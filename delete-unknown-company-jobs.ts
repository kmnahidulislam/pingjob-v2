import { db } from './server/db.ts';
import { jobs, jobApplications } from './shared/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function deleteUnknownCompanyJobs() {
  try {
    console.log('Deleting jobs for Unknown Company (ID: 76283)...');
    
    // Get count before deletion
    const beforeCount = await db.select().from(jobs).where(eq(jobs.companyId, 76283));
    console.log(`Found ${beforeCount.length} jobs to delete`);
    
    // First, delete all job applications for these jobs
    console.log('Deleting job applications for Unknown Company jobs...');
    const jobIds = beforeCount.map(job => job.id);
    
    if (jobIds.length > 0) {
      // Delete job applications in batches to avoid query limits
      const batchSize = 1000;
      let totalApplicationsDeleted = 0;
      
      for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        const deletedApps = await db.delete(jobApplications).where(
          eq(jobApplications.jobId, batch[0]) // Delete applications for jobs in this batch
        );
        console.log(`Deleted applications for job batch ${i / batchSize + 1}`);
      }
      
      // Actually, let's use a raw SQL approach for efficiency
      console.log('Using raw SQL to delete job applications...');
      const applicationDeleteResult = await db.execute(sql`DELETE FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE company_id = 76283)`);
      console.log('Deleted job applications for Unknown Company jobs');
    }
    
    // Now delete the jobs themselves
    console.log('Deleting jobs for Unknown Company...');
    const result = await db.delete(jobs).where(eq(jobs.companyId, 76283));
    
    console.log(`Successfully deleted jobs for Unknown Company`);
    
    // Verify deletion
    const afterCount = await db.select().from(jobs).where(eq(jobs.companyId, 76283));
    console.log(`Remaining jobs for Unknown Company: ${afterCount.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting jobs:', error);
    process.exit(1);
  }
}

deleteUnknownCompanyJobs();