const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCategoriesAndUsers() {
  try {
    // Check categories
    const categories = await pool.query(`
      SELECT id, name FROM categories 
      WHERE id IN (1, 2, 3, 4, 5, 188)
      ORDER BY id
    `);
    
    console.log('Categories:');
    categories.rows.forEach(cat => {
      console.log(`- ${cat.id}: ${cat.name}`);
    });
    
    // Check job seekers by category
    const usersByCategory = await pool.query(`
      SELECT category_id, COUNT(*) as count
      FROM users 
      WHERE user_type = 'job_seeker' 
      AND category_id IS NOT NULL
      GROUP BY category_id
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('\nJob seekers by category:');
    usersByCategory.rows.forEach(row => {
      console.log(`- Category ${row.category_id}: ${row.count} job seekers`);
    });
    
    // Check some sample job seekers
    const sampleUsers = await pool.query(`
      SELECT id, email, first_name, last_name, category_id
      FROM users 
      WHERE user_type = 'job_seeker' 
      AND category_id IS NOT NULL
      LIMIT 5
    `);
    
    console.log('\nSample job seekers:');
    sampleUsers.rows.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Category: ${user.category_id}`);
    });
    
    // Check recruiter jobs
    const recruiterJobs = await pool.query(`
      SELECT id, title, category_id
      FROM jobs 
      WHERE recruiter_id = 'user_1751050337717_6m7wx40s5'
      ORDER BY created_at DESC
    `);
    
    console.log('\nRecruiter jobs:');
    recruiterJobs.rows.forEach(job => {
      console.log(`- Job ${job.id}: ${job.title} - Category: ${job.category_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCategoriesAndUsers();