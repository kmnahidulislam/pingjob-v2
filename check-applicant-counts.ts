import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkApplicantCounts() {
  try {
    console.log('=== Checking Applicant Count Synchronization ===');
    
    // Check specific job and its actual vs stored counts
    const jobId = 83587;
    
    const query = `
      SELECT 
        j.id,
        j.title,
        j.application_count as stored_count,
        COUNT(ja.id) as actual_count,
        j.category_id,
        c.name as category_name
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = $1
      GROUP BY j.id, j.title, j.application_count, j.category_id, c.name
    `;
    
    const result = await pool.query(query, [jobId]);
    console.log('Job 83587 count comparison:', result.rows[0]);
    
    // Check if we need to sync the counts
    const job = result.rows[0];
    if (job && job.stored_count !== job.actual_count) {
      console.log(`Syncing count for job ${jobId}: ${job.stored_count} -> ${job.actual_count}`);
      
      await pool.query(
        'UPDATE jobs SET application_count = $1 WHERE id = $2',
        [job.actual_count, jobId]
      );
      
      console.log('Count synced successfully');
    }
    
    // Check other jobs in the same category
    const categoryQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count as stored_count,
        COUNT(ja.id) as actual_count
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.category_id = $1 AND j.recruiter_id = 'admin-krupa'
      GROUP BY j.id, j.title, j.application_count
      ORDER BY j.created_at DESC
      LIMIT 10
    `;
    
    const categoryResult = await pool.query(categoryQuery, [job.category_id]);
    console.log('Category jobs count comparison:', categoryResult.rows);
    
    // Sync all counts if needed
    for (const categoryJob of categoryResult.rows) {
      if (categoryJob.stored_count !== categoryJob.actual_count) {
        console.log(`Syncing count for job ${categoryJob.id}: ${categoryJob.stored_count} -> ${categoryJob.actual_count}`);
        await pool.query(
          'UPDATE jobs SET application_count = $1 WHERE id = $2',
          [categoryJob.actual_count, categoryJob.id]
        );
      }
    }
    
    console.log('=== Sync Complete ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkApplicantCounts();