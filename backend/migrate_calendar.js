require('dotenv').config({ path: '.env' });
const { query } = require('./src/db/pool');

async function migrate() {
  try {
    console.log('Creating calendar_events table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) DEFAULT 'assignment',
        event_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Adding calendar_token column to users table...');
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(255) UNIQUE;`);
    
    console.log('Calendar Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
