import { db } from './server/db';
import { jobs } from './shared/schema';

async function checkImportStatus() {
  try {
    const jobCount = await db.select().from(jobs);
    console.log(`Current jobs in database: ${jobCount.length}`);
    
    // Show sample of most recent jobs
    const recentJobs = jobCount.slice(-5);
    console.log('\nMost recent jobs:');
    recentJobs.forEach(job => {
      console.log(`- ID: ${job.id}, Title: ${job.title}, Company: ${job.companyId}`);
    });
    
    return jobCount.length;
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkImportStatus();