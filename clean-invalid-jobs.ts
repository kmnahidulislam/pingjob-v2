import { db } from './server/db';
import { jobs, companies } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql, eq, inArray } from 'drizzle-orm';

async function cleanInvalidJobs() {
  console.log('Cleaning jobs with invalid company associations...');
  
  // Get all valid company IDs from our database
  const validCompanies = await db.select({ id: companies.id }).from(companies);
  const validCompanyIds = new Set(validCompanies.map(c => c.id));
  console.log(`Found ${validCompanyIds.size} valid companies in database`);
  
  // Get CSV data to identify which jobs should exist
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const validJobIds = new Set<number>();
  const validJobCompanyMap = new Map<number, number>();
  let csvRowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        csvRowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        const companyId = parseInt(row.company_id);
        
        // Only include jobs where the company exists in our database
        if (jobId && companyId && validCompanyIds.has(companyId)) {
          validJobIds.add(jobId);
          validJobCompanyMap.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`CSV processed: ${csvRowCount} rows`);
        console.log(`Valid job-company pairs found: ${validJobIds.size}`);

        try {
          // Delete all jobs that don't have valid company mappings from CSV
          const allJobs = await db.select({ id: jobs.id, companyId: jobs.companyId }).from(jobs);
          const jobsToDelete = allJobs.filter(job => !validJobIds.has(job.id));
          
          console.log(`Current jobs in database: ${allJobs.length}`);
          console.log(`Jobs to delete (invalid company associations): ${jobsToDelete.length}`);
          console.log(`Jobs to keep (valid associations): ${validJobIds.size}`);

          if (jobsToDelete.length > 0) {
            // Delete invalid jobs in batches
            const batchSize = 1000;
            let deletedCount = 0;
            
            for (let i = 0; i < jobsToDelete.length; i += batchSize) {
              const batch = jobsToDelete.slice(i, i + batchSize);
              const jobIdsToDelete = batch.map(job => job.id);
              
              await db.delete(jobs).where(inArray(jobs.id, jobIdsToDelete));
              deletedCount += batch.length;
              
              console.log(`Deleted batch: ${deletedCount}/${jobsToDelete.length} jobs`);
            }
          }

          // Update remaining jobs to correct company associations
          const remainingJobs = await db.select({ id: jobs.id, companyId: jobs.companyId }).from(jobs);
          let updatedCount = 0;

          for (const job of remainingJobs) {
            const correctCompanyId = validJobCompanyMap.get(job.id);
            if (correctCompanyId && correctCompanyId !== job.companyId) {
              await db.update(jobs)
                .set({ companyId: correctCompanyId })
                .where(eq(jobs.id, job.id));
              updatedCount++;
            }
          }

          // Final verification
          const finalJobs = await db.select().from(jobs);
          const companyJobCounts = await db.execute(sql`
            SELECT c.name, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            GROUP BY c.id, c.name
            HAVING COUNT(j.id) > 0
            ORDER BY job_count DESC
            LIMIT 10
          `);

          console.log(`\n=== CLEAN INVALID JOBS COMPLETED ===`);
          console.log(`Jobs deleted: ${jobsToDelete.length}`);
          console.log(`Jobs updated: ${updatedCount}`);
          console.log(`Final jobs count: ${finalJobs.length}`);
          console.log(`\nTop 10 companies by job count:`);
          companyJobCounts.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}: ${row.job_count} jobs`);
          });

          // Verify @Comm Corporation has no jobs
          const commCorpJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));
          console.log(`\n@Comm Corporation jobs: ${commCorpJobs.length}`);

          resolve(finalJobs.length);
        } catch (error) {
          console.error('Clean operation error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

cleanInvalidJobs()
  .then((finalCount) => {
    console.log(`Clean operation completed. Final jobs count: ${finalCount}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Clean operation failed:', error);
    process.exit(1);
  });