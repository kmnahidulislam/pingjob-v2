import { db } from './server/db';
import { jobs, companies } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql, eq } from 'drizzle-orm';

async function fixJobCompanyMapping() {
  console.log('Fixing job-company mapping from original CSV...');
  
  // Get existing companies to create a mapping
  const existingCompanies = await db.select().from(companies);
  const companyIdMap = new Map(existingCompanies.map(c => [c.id, c.name]));
  console.log(`Found ${existingCompanies.length} companies in database`);
  
  // Get jobs that were incorrectly assigned to company ID 1
  const incorrectJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));
  console.log(`Found ${incorrectJobs.length} jobs incorrectly assigned to @Comm Corporation`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const csvJobData = new Map();
  let csvRowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        csvRowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        const companyId = parseInt(row.company_id);
        
        if (jobId && companyId) {
          csvJobData.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`Processed ${csvRowCount} CSV rows`);
        console.log(`Found ${csvJobData.size} job-company mappings from CSV`);

        try {
          let correctedCount = 0;
          let actualCommCorpJobs = 0;
          
          for (const job of incorrectJobs) {
            const originalCompanyId = csvJobData.get(job.id);
            
            if (originalCompanyId && originalCompanyId !== 1) {
              // Check if the company exists in our database
              if (companyIdMap.has(originalCompanyId)) {
                await db.update(jobs)
                  .set({ companyId: originalCompanyId })
                  .where(eq(jobs.id, job.id));
                correctedCount++;
              }
            } else if (originalCompanyId === 1) {
              // This job actually belongs to @Comm Corporation
              actualCommCorpJobs++;
            }
          }

          // Get final count of jobs for @Comm Corporation
          const finalCommCorpJobs = await db.select()
            .from(jobs)
            .where(eq(jobs.companyId, 1));

          console.log(`\n=== JOB-COMPANY MAPPING CORRECTION COMPLETED ===`);
          console.log(`Jobs corrected: ${correctedCount}`);
          console.log(`Actual @Comm Corporation jobs: ${finalCommCorpJobs.length}`);
          console.log(`Jobs that couldn't be mapped: ${incorrectJobs.length - correctedCount - actualCommCorpJobs}`);

          // Show top companies by job count after correction
          const topCompaniesResult = await db.execute(sql`
            SELECT c.name, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            GROUP BY c.id, c.name
            HAVING COUNT(j.id) > 0
            ORDER BY job_count DESC
            LIMIT 10
          `);

          console.log('\nTop 10 companies by job count after correction:');
          topCompaniesResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}: ${row.job_count} jobs`);
          });

          resolve(correctedCount);
        } catch (error) {
          console.error('Error fixing job mappings:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

fixJobCompanyMapping()
  .then((count) => {
    console.log(`Job-company mapping correction completed: ${count} jobs fixed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Mapping correction failed:', error);
    process.exit(1);
  });