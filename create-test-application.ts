import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestApplication() {
  try {
    console.log('🚫 Test application creation DISABLED - prevents broken resume references');
    console.log('Only manual file uploads through application modal are allowed');
    await pool.end();
    return;
    
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
    
    // 🚫 SCRIPT DISABLED - Prevents broken STAFF Systems resume references
    console.log('🚫 Test application creation DISABLED to prevent broken resume references');
    console.log('Only manual file uploads through application modal are allowed');
    await pool.end();
    return;
    
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