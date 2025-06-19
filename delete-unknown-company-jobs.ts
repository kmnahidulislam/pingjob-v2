import { pool } from './server/db.ts';

async function deleteUnknownCompanyJobs() {
  try {
    console.log('Deleting jobs for Unknown Company (ID: 76283)...');
    
    // Get count before deletion
    const beforeCount = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE company_id = 76283');
    console.log(`Found ${beforeCount.rows[0].count} jobs to delete`);
    
    if (parseInt(beforeCount.rows[0].count) > 0) {
      // First, delete all job applications for these jobs
      console.log('Deleting job applications for Unknown Company jobs...');
      const applicationDeleteResult = await pool.query(`
        DELETE FROM job_applications 
        WHERE job_id IN (SELECT id FROM jobs WHERE company_id = 76283)
      `);
      console.log(`Deleted ${applicationDeleteResult.rowCount} job applications`);
      
      // Now delete the jobs themselves
      console.log('Deleting jobs for Unknown Company...');
      const jobDeleteResult = await pool.query('DELETE FROM jobs WHERE company_id = 76283');
      console.log(`Successfully deleted ${jobDeleteResult.rowCount} jobs for Unknown Company`);
    }
    
    // Verify deletion
    const afterCount = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE company_id = 76283');
    console.log(`Remaining jobs for Unknown Company: ${afterCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting jobs:', error);
    process.exit(1);
  }
}

deleteUnknownCompanyJobs();