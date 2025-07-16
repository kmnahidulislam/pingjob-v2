import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixApplicantCounts() {
  try {
    console.log('=== FIXING APPLICANT COUNTS ===');
    
    // Step 1: Check current state
    const checkQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count as stored_count,
        COUNT(ja.id) as actual_count
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.recruiter_id = 'admin-krupa'
      GROUP BY j.id, j.title, j.application_count
      ORDER BY j.updated_at DESC, j.created_at DESC
      LIMIT 10
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log('Current state of admin jobs:');
    console.table(checkResult.rows);
    
    // Step 2: Update ALL jobs to have correct counts
    const updateQuery = `
      UPDATE jobs 
      SET application_count = (
        SELECT COUNT(*) 
        FROM job_applications 
        WHERE job_applications.job_id = jobs.id
      )
      WHERE jobs.id IN (
        SELECT j.id 
        FROM jobs j
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        GROUP BY j.id
        HAVING j.application_count != COUNT(ja.id)
      )
    `;
    
    const updateResult = await pool.query(updateQuery);
    console.log(`Updated ${updateResult.rowCount} jobs with correct application counts`);
    
    // Step 3: Verify the fix
    const verifyResult = await pool.query(checkQuery);
    console.log('After fix - admin jobs:');
    console.table(verifyResult.rows);
    
    // Step 4: Show specific job that was applied to
    const specificJobQuery = `
      SELECT 
        j.id,
        j.title,
        j.application_count as stored_count,
        COUNT(ja.id) as actual_count,
        array_agg(ja.applicant_id) as applicants
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.id = 83585
      GROUP BY j.id, j.title, j.application_count
    `;
    
    const specificResult = await pool.query(specificJobQuery);
    console.log('Specific job 83585 details:');
    console.table(specificResult.rows);
    
    console.log('=== FIX COMPLETED ===');
    
  } catch (error) {
    console.error('Error fixing applicant counts:', error);
  } finally {
    await pool.end();
  }
}

fixApplicantCounts();