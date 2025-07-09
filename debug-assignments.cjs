const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugAssignments() {
  try {
    // Check the recruiter's jobs
    const recruiterJobs = await pool.query(`
      SELECT id, title, category_id, recruiter_id
      FROM jobs 
      WHERE recruiter_id = 'user_1751050337717_6m7wx40s5'
      ORDER BY created_at DESC
    `);
    
    console.log('Recruiter jobs:', recruiterJobs.rows);
    
    if (recruiterJobs.rows.length > 0) {
      const firstJob = recruiterJobs.rows[0];
      console.log(`\nFirst job: ${firstJob.title} (ID: ${firstJob.id}, Category: ${firstJob.category_id})`);
      
      // Check for users with matching category
      const matchingUsers = await pool.query(`
        SELECT id, email, first_name, last_name, category_id, user_type
        FROM users 
        WHERE category_id = $1 AND user_type = 'job_seeker'
        LIMIT 10
      `, [firstJob.category_id]);
      
      console.log(`\nMatching job seekers (category ${firstJob.category_id}):`, matchingUsers.rows.length);
      matchingUsers.rows.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email})`);
      });
      
      // Check existing assignments
      const existingAssignments = await pool.query(`
        SELECT * FROM job_candidate_assignments 
        WHERE job_id = $1 AND recruiter_id = $2
      `, [firstJob.id, firstJob.recruiter_id]);
      
      console.log(`\nExisting assignments for job ${firstJob.id}:`, existingAssignments.rows.length);
      existingAssignments.rows.forEach(assignment => {
        console.log(`- Assignment ${assignment.id}: ${assignment.candidate_id} (${assignment.status})`);
      });
    }
    
    // Check categories
    const categories = await pool.query(`
      SELECT id, name FROM categories 
      ORDER BY name 
      LIMIT 10
    `);
    
    console.log('\nAvailable categories:');
    categories.rows.forEach(cat => {
      console.log(`- ${cat.id}: ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugAssignments();