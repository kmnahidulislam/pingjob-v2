const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    // Check if job_candidate_assignments table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_candidate_assignments'
      );
    `);
    
    console.log('job_candidate_assignments table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'job_candidate_assignments'
        ORDER BY ordinal_position
      `);
      
      console.log('Table columns:', columns.rows);
      
      // Check if there are any records
      const count = await pool.query(`SELECT COUNT(*) FROM job_candidate_assignments`);
      console.log('Total records:', count.rows[0].count);
    }
    
    // Check if we have users with category_id
    const usersWithCategory = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE category_id IS NOT NULL 
      AND user_type = 'job_seeker'
    `);
    
    console.log('Job seekers with category_id:', usersWithCategory.rows[0].count);
    
    // Check sample users
    const sampleUsers = await pool.query(`
      SELECT id, first_name, last_name, email, category_id, user_type 
      FROM users 
      WHERE category_id IS NOT NULL 
      AND user_type = 'job_seeker'
      LIMIT 5
    `);
    
    console.log('Sample users:', sampleUsers.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
