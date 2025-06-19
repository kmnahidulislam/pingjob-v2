import { db } from './server/db';
import { jobs, companies } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql, eq } from 'drizzle-orm';

async function correctJobCompaniesOnly() {
  console.log('Correcting job-company associations without deleting jobs...');
  
  // Get all valid company IDs from our database
  const validCompanies = await db.select({ id: companies.id }).from(companies);
  const validCompanyIds = new Set(validCompanies.map(c => c.id));
  console.log(`Found ${validCompanyIds.size} valid companies in database`);
  
  // Build job-company mapping from CSV, only for valid companies
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
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
        
        // Only map jobs where the company exists in our database
        if (jobId && companyId && validCompanyIds.has(companyId)) {
          validJobCompanyMap.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`CSV processed: ${csvRowCount} rows`);
        console.log(`Valid job-company mappings found: ${validJobCompanyMap.size}`);

        try {
          // Get all current jobs
          const allJobs = await db.select({ id: jobs.id, companyId: jobs.companyId }).from(jobs);
          console.log(`Current jobs in database: ${allJobs.length}`);

          // Update jobs to correct companies, or set invalid ones to null
          let correctedCount = 0;
          let nullifiedCount = 0;
          
          const batchSize = 1000;
          for (let i = 0; i < allJobs.length; i += batchSize) {
            const batch = allJobs.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allJobs.length/batchSize)}`);
            
            for (const job of batch) {
              const correctCompanyId = validJobCompanyMap.get(job.id);
              
              if (correctCompanyId && correctCompanyId !== job.companyId) {
                // Update to correct company
                await db.update(jobs)
                  .set({ companyId: correctCompanyId })
                  .where(eq(jobs.id, job.id));
                correctedCount++;
              } else if (!correctCompanyId && job.companyId !== null) {
                // Set invalid company association to null
                await db.update(jobs)
                  .set({ companyId: null })
                  .where(eq(jobs.id, job.id));
                nullifiedCount++;
              }
            }
          }

          // Final verification - count jobs by company
          const companyJobCounts = await db.execute(sql`
            SELECT 
              COALESCE(c.name, 'No Company') as name, 
              COUNT(j.id) as job_count
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            GROUP BY c.id, c.name
            ORDER BY job_count DESC
            LIMIT 15
          `);

          // Check @Comm Corporation specifically
          const commCorpJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));

          console.log(`\n=== JOB-COMPANY CORRECTION COMPLETED ===`);
          console.log(`Jobs corrected to valid companies: ${correctedCount}`);
          console.log(`Jobs with invalid companies set to null: ${nullifiedCount}`);
          console.log(`@Comm Corporation (ID:1) final job count: ${commCorpJobs.length}`);
          
          console.log(`\nTop companies by job count after correction:`);
          companyJobCounts.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}: ${row.job_count} jobs`);
          });

          resolve({ correctedCount, nullifiedCount, finalCommCorpJobs: commCorpJobs.length });
        } catch (error) {
          console.error('Correction operation error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

correctJobCompaniesOnly()
  .then((result) => {
    console.log(`Correction completed: ${result.correctedCount} jobs corrected, ${result.nullifiedCount} nullified`);
    console.log(`@Comm Corporation final jobs: ${result.finalCommCorpJobs}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Correction failed:', error);
    process.exit(1);
  });