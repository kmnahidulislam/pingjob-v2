const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function queryDatabase() {
  try {
    // Check the actual column names in users table
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%resume%'
    `);
    
    console.log('Resume columns:', columns.rows);
    
    // Check some key columns to see the actual naming convention
    const keyColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('resume_url', 'resumeUrl', 'first_name', 'firstName', 'last_name', 'lastName')
      ORDER BY column_name
    `);
    
    console.log('Key columns (snake_case vs camelCase):', keyColumns.rows.map(r => r.column_name));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

queryDatabase();
