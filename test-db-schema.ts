import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDatabaseSchema() {
  try {
    // Check users table columns
    const usersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name LIKE '%resume%'
    `);
    
    console.log('Users table resume columns:');
    console.log(usersColumns.rows);
    
    // Check job_applications table columns
    const jaColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' AND column_name LIKE '%resume%'
    `);
    
    console.log('\nJob applications table resume columns:');
    console.log(jaColumns.rows);
    
    // Check if there are any job applications
    const applications = await pool.query(`
      SELECT COUNT(*) as count FROM job_applications
    `);
    
    console.log('\nTotal job applications:', applications.rows[0].count);
    
    // Check recent applications
    const recentApplications = await pool.query(`
      SELECT ja.id, ja.applicant_id, ja.job_id, ja.resume_url, ja.applied_at,
             u.email, u.first_name, u.last_name
      FROM job_applications ja
      LEFT JOIN users u ON ja.applicant_id = u.id
      ORDER BY ja.applied_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent applications:');
    console.log(recentApplications.rows);
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await pool.end();
  }
}

testDatabaseSchema();