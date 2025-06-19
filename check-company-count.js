const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCompanyCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM companies');
    console.log('Total companies in database:', result.rows[0].count);
    
    const approvedResult = await pool.query('SELECT COUNT(*) as count FROM companies WHERE status = \'approved\'');
    console.log('Approved companies:', approvedResult.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCompanyCount();