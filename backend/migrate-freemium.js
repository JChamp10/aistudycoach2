require('dotenv').config();
const { pool } = require('./src/db/pool');

async function migrate() {
  try {
    console.log('Running migration to add freemium columns...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS ai_calls_today INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_ai_call_date DATE DEFAULT CURRENT_DATE;
    `);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
