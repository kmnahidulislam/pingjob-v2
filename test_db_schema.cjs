const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function testSchema() {
  try {
    // Try a simple query to see if resume_url exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('resume_url', 'resumeUrl', 'first_name', 'firstName', 'last_name', 'lastName')
      ORDER BY column_name
    `);
    
    console.log('Available columns:', result.rows);
    
    // Try to query a single user with resume info
    const userResult = await pool.query(`
      SELECT id, first_name, last_name, email, resume_url, headline, location, category_id
      FROM users 
      WHERE category_id IS NOT NULL 
      LIMIT 1
    `);
    
    console.log('Sample user with resume data:', userResult.rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSchema();
