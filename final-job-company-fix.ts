import { db } from './server/db';
import { jobs, companies } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql, eq } from 'drizzle-orm';

async function finalJobCompanyFix() {
  console.log('Final fix: Ensuring @Comm Corporation has zero jobs...');
  
  // First, create or find an "Unknown Company" for invalid job associations
  let unknownCompany = await db.select().from(companies).where(eq(companies.name, 'Unknown Company'));
  
  if (unknownCompany.length === 0) {
    console.log('Creating "Unknown Company" for invalid job associations...');
    const [created] = await db.insert(companies).values({
      name: 'Unknown Company',
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown'
    }).returning();
    unknownCompany = [created];
  }
  
  const unknownCompanyId = unknownCompany[0].id;
  console.log(`Unknown Company ID: ${unknownCompanyId}`);
  
  // Get all valid company IDs from our database
  const validCompanies = await db.select({ id: companies.id }).from(companies);
  const validCompanyIds = new Set(validCompanies.map(c => c.id));
  console.log(`Found ${validCompanyIds.size} valid companies in database`);
  
  // Build job-company mapping from CSV
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const csvJobCompanyMap = new Map<number, number>();
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
          csvJobCompanyMap.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`CSV processed: ${csvRowCount} rows`);
        console.log(`Job-company mappings from CSV: ${csvJobCompanyMap.size}`);

        try {
          // Get all current jobs
          const allJobs = await db.select({ id: jobs.id, companyId: jobs.companyId }).from(jobs);
          console.log(`Current jobs in database: ${allJobs.length}`);

          let correctedCount = 0;
          let assignedToUnknownCount = 0;
          
          // Process all jobs
          for (const job of allJobs) {
            const csvCompanyId = csvJobCompanyMap.get(job.id);
            
            if (csvCompanyId && validCompanyIds.has(csvCompanyId)) {
              // Job has valid company association from CSV
              if (job.companyId !== csvCompanyId) {
                await db.update(jobs)
                  .set({ companyId: csvCompanyId })
                  .where(eq(jobs.id, job.id));
                correctedCount++;
              }
            } else {
              // Job has invalid company association - assign to Unknown Company
              if (job.companyId !== unknownCompanyId) {
                await db.update(jobs)
                  .set({ companyId: unknownCompanyId })
                  .where(eq(jobs.id, job.id));
                assignedToUnknownCount++;
              }
            }
          }

          // Verify @Comm Corporation (ID: 1) has zero jobs
          const commCorpJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));
          
          // Get final company job counts
          const companyJobCounts = await db.execute(sql`
            SELECT c.name, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            GROUP BY c.id, c.name
            HAVING COUNT(j.id) > 0
            ORDER BY job_count DESC
            LIMIT 10
          `);

          console.log(`\n=== FINAL JOB-COMPANY FIX COMPLETED ===`);
          console.log(`Jobs corrected to valid companies: ${correctedCount}`);
          console.log(`Jobs assigned to Unknown Company: ${assignedToUnknownCount}`);
          console.log(`@Comm Corporation final job count: ${commCorpJobs.length}`);
          
          console.log(`\nTop 10 companies by job count:`);
          companyJobCounts.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}: ${row.job_count} jobs`);
          });

          resolve({ 
            correctedCount, 
            assignedToUnknownCount, 
            commCorpJobCount: commCorpJobs.length 
          });
        } catch (error) {
          console.error('Final fix error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

finalJobCompanyFix()
  .then((result) => {
    console.log(`Final fix completed successfully!`);
    console.log(`@Comm Corporation now has ${result.commCorpJobCount} jobs (should be 0)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Final fix failed:', error);
    process.exit(1);
  });