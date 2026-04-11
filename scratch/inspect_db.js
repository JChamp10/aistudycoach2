require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../backend/src/db/pool');
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

async function inspect() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns in users table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting table:', err);
    process.exit(1);
  }
}

inspect();
