import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugApplicantCount() {
  try {
    console.log('=== Debug Applicant Count Issue ===');
    
    // Check specific job that was just applied to
    const jobId = 83587;
    
    const jobQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count,
        j.category_id,
        c.name as category_name,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as actual_application_count
      FROM jobs j
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = $1
    `;
    
    const jobResult = await pool.query(jobQuery, [jobId]);
    console.log('Job 83587 details:', jobResult.rows[0]);
    
    // Check recent applications for this job
    const applicationsQuery = `
      SELECT 
        ja.id,
        ja.job_id,
        ja.applicant_id,
        ja.applied_at,
        ja.status,
        u.first_name,
        u.last_name,
        u.email
      FROM job_applications ja
      LEFT JOIN users u ON ja.applicant_id = u.id
      WHERE ja.job_id = $1
      ORDER BY ja.applied_at DESC
      LIMIT 5
    `;
    
    const applicationsResult = await pool.query(applicationsQuery, [jobId]);
    console.log('Recent applications for job 83587:', applicationsResult.rows);
    
    // Check if there are other jobs in the same category that should have auto-applications
    const categoryJobsQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as actual_application_count
      FROM jobs j
      WHERE j.category_id = (SELECT category_id FROM jobs WHERE id = $1)
        AND j.id != $1
        AND j.recruiter_id = 'admin-krupa'
      ORDER BY j.created_at DESC
      LIMIT 10
    `;
    
    const categoryJobsResult = await pool.query(categoryJobsQuery, [jobId]);
    console.log('Other jobs in same category:', categoryJobsResult.rows);
    
    // Check admin jobs that appear on home page
    const adminJobsQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as actual_application_count
      FROM jobs j
      WHERE j.recruiter_id = 'admin-krupa'
        AND j.is_active = true
      ORDER BY j.updated_at DESC, j.created_at DESC
      LIMIT 10
    `;
    
    const adminJobsResult = await pool.query(adminJobsQuery);
    console.log('Admin jobs (home page):', adminJobsResult.rows);
    
    console.log('=== End Debug ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugApplicantCount();