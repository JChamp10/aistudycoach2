const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth.middleware');
const { query } = require('../db/pool');
const crypto = require('crypto');

// Get all events for user
router.get('/', verifyAuth, async (req, res) => {
  try {
    const events = await query(
      'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date ASC',
      [req.user.id]
    );
    res.json({ events: events.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

// Create event
router.post('/', verifyAuth, async (req, res) => {
  const { title, description, event_type, event_date } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'Title and event_date required.' });
  
  try {
    const result = await query(
      'INSERT INTO calendar_events (user_id, title, description, event_type, event_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, description, event_type || 'assignment', event_date]
    );
    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// Delete event
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Event not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// Generate Sync Token
router.post('/token', verifyAuth, async (req, res) => {
  try {
    const userRes = await query('SELECT calendar_token FROM users WHERE id = $1', [req.user.id]);
    let token = userRes.rows[0]?.calendar_token;
    
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await query('UPDATE users SET calendar_token = $1 WHERE id = $2', [token, req.user.id]);
    }
    
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate token.' });
  }
});

// Public iCal feed
router.get('/ical/:token', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE calendar_token = $1', [req.params.token]);
    if (userRes.rowCount === 0) return res.status(404).send('Invalid token.');
    
    const userId = userRes.rows[0].id;
    const events = await query('SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date ASC', [userId]);
    
    let ical = '';
    ical += 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//StudyCafe//EN\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += 'X-WR-CALNAME:StudyCafe Assignments & Tests\r\n';
    ical += 'X-WR-TIMEZONE:UTC\r\n';
    
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const formatDateOnly = (date) => {
      const d = new Date(date);
      return d.toISOString().split('T')[0].replace(/-/g, '');
    };

    events.rows.forEach(e => {
      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${e.id}@studycafe\r\n`;
      ical += `DTSTAMP:${formatDate(e.created_at)}\r\n`;
      // We'll set these as all-day events
      ical += `DTSTART;VALUE=DATE:${formatDateOnly(e.event_date)}\r\n`;
      ical += `SUMMARY:[${e.event_type.toUpperCase()}] ${e.title}\r\n`;
      if (e.description) {
        ical += `DESCRIPTION:${e.description.replace(/\n/g, '\\n')}\r\n`;
      }
      ical += 'END:VEVENT\r\n';
    });
    
    ical += 'END:VCALENDAR\r\n';
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="studycafe.ics"');
    res.send(ical);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate iCal feed.');
  }
});

module.exports = router;
