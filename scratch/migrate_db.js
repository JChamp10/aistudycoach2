require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../backend/src/db/pool');

async function migrate() {
  try {
    console.log('Adding ai_calls_today column...');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_calls_today INTEGER DEFAULT 0');
    
    console.log('Adding last_ai_call_date column...');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ai_call_date DATE DEFAULT CURRENT_DATE');
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
