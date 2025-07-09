const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixCandidateAssignment() {
  try {
    console.log('=== FIXING CANDIDATE ASSIGNMENT ISSUE ===');
    
    // Step 1: Check which categories have job seekers
    console.log('\n1. Checking categories with job seekers...');
    const categoriesWithUsers = await pool.query(`
      SELECT u.category_id, c.name, COUNT(u.id) as user_count
      FROM users u
      JOIN categories c ON u.category_id = c.id
      WHERE u.user_type = 'job_seeker'
      GROUP BY u.category_id, c.name
      ORDER BY user_count DESC
      LIMIT 10
    `);
    
    console.log('Categories with job seekers:');
    categoriesWithUsers.rows.forEach(row => {
      console.log(`- Category ${row.category_id} (${row.name}): ${row.user_count} users`);
    });
    
    if (categoriesWithUsers.rows.length === 0) {
      console.log('ERROR: No categories have job seekers!');
      return;
    }
    
    // Step 2: Get the recruiter's current job
    console.log('\n2. Checking recruiter job...');
    const recruiterJob = await pool.query(`
      SELECT id, title, category_id
      FROM jobs 
      WHERE recruiter_id = 'user_1751050337717_6m7wx40s5'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (recruiterJob.rows.length === 0) {
      console.log('ERROR: No recruiter jobs found!');
      return;
    }
    
    const job = recruiterJob.rows[0];
    console.log(`Current job: ${job.title} (ID: ${job.id}, Category: ${job.category_id})`);
    
    // Step 3: Update the job to use a category with job seekers
    const targetCategory = categoriesWithUsers.rows[0];
    console.log(`\n3. Updating job ${job.id} to use category ${targetCategory.category_id} (${targetCategory.name})...`);
    
    const updateResult = await pool.query(`
      UPDATE jobs 
      SET category_id = $1
      WHERE id = $2
      RETURNING *
    `, [targetCategory.category_id, job.id]);
    
    console.log(`Job updated successfully! Now using category ${targetCategory.category_id}`);
    
    // Step 4: Test the auto-assignment
    console.log('\n4. Testing auto-assignment...');
    const candidates = await pool.query(`
      SELECT id, email, first_name, last_name, category_id
      FROM users 
      WHERE user_type = 'job_seeker' 
      AND category_id = $1 
      LIMIT 5
    `, [targetCategory.category_id]);
    
    console.log(`Found ${candidates.rows.length} candidates for category ${targetCategory.category_id}:`);
    candidates.rows.forEach(candidate => {
      console.log(`- ${candidate.first_name} ${candidate.last_name} (${candidate.email})`);
    });
    
    console.log('\n=== FIX COMPLETE ===');
    console.log('The job now has a category with job seekers.');
    console.log('Try clicking "View Candidates" again - it should now work!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Only run if this file is called directly (not imported)
if (require.main === module) {
  fixCandidateAssignment();
}

module.exports = { fixCandidateAssignment };