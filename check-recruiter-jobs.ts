import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { jobs } from './shared/schema';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function checkRecruiterJobs() {
  try {
    console.log('Checking jobs for recruiter: user_1751050337717_6m7wx40s5');
    
    // Get all jobs by this recruiter
    const recruiterJobs = await db.select().from(jobs).where(eq(jobs.recruiterId, 'user_1751050337717_6m7wx40s5'));
    console.log('Recruiter jobs found:', recruiterJobs.length);
    
    if (recruiterJobs.length > 0) {
      console.log('Jobs:', JSON.stringify(recruiterJobs, null, 2));
    } else {
      console.log('No jobs found for this recruiter');
      
      // Check if there are any recent jobs
      const recentJobs = await db.select().from(jobs).limit(5);
      console.log('Recent jobs in database:', recentJobs.map(j => ({
        id: j.id,
        title: j.title,
        recruiterId: j.recruiterId,
        createdAt: j.createdAt
      })));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRecruiterJobs();