import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestApplication() {
  try {
    // First, check if there are any job applications
    const existingApps = await pool.query('SELECT COUNT(*) as count FROM job_applications');
    console.log(`Current applications in database: ${existingApps.rows[0].count}`);
    
    // Get a job to apply to (preferably an admin job)
    const jobs = await pool.query(`
      SELECT id, title, company_id 
      FROM jobs 
      WHERE recruiter_id = 'admin-krupa' 
      LIMIT 1
    `);
    
    if (jobs.rows.length === 0) {
      console.log('No admin jobs found to apply to');
      return;
    }
    
    const job = jobs.rows[0];
    console.log(`Found job to apply to: ${job.title} (ID: ${job.id})`);
    
    // Get a job seeker to apply with
    const jobSeekers = await pool.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE user_type = 'job_seeker' 
      AND resume_url IS NOT NULL
      LIMIT 1
    `);
    
    if (jobSeekers.rows.length === 0) {
      console.log('No job seekers with resumes found');
      return;
    }
    
    const jobSeeker = jobSeekers.rows[0];
    console.log(`Found job seeker: ${jobSeeker.first_name} ${jobSeeker.last_name} (${jobSeeker.email})`);
    
    // Create a test application
    const result = await pool.query(`
      INSERT INTO job_applications 
      (job_id, applicant_id, resume_url, cover_letter, status, match_score, skills_score, experience_score, education_score, company_score, is_processed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      job.id,
      jobSeeker.id,
      'sample_resume.pdf', // Test resume file
      'I am very interested in this position and believe my skills would be a great fit.',
      'pending',
      8, // Match score out of 12
      5, // Skills score out of 6
      2, // Experience score out of 2
      1, // Education score out of 2
      0, // Company score (bonus)
      true
    ]);
    
    console.log(`Created test application with ID: ${result.rows[0].id}`);
    
    // Check total applications now
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM job_applications');
    console.log(`Total applications after creation: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Error creating test application:', error);
  } finally {
    await pool.end();
  }
}

createTestApplication();