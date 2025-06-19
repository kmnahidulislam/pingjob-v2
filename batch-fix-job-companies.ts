import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function batchFixJobCompanies() {
  console.log('Starting batch fix of job-company associations...');
  
  // Build complete job ID to company ID mapping from CSV
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const jobCompanyMap = new Map<number, number>();
  let csvRowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        csvRowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        const companyId = parseInt(row.company_id);
        
        if (jobId && companyId && companyId <= 100000) {
          jobCompanyMap.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`CSV processed: ${csvRowCount} rows`);
        console.log(`Job-company mappings found: ${jobCompanyMap.size}`);

        try {
          // Process in batches using SQL for efficiency
          const batchSize = 1000;
          const jobIds = Array.from(jobCompanyMap.keys());
          let correctedCount = 0;

          for (let i = 0; i < jobIds.length; i += batchSize) {
            const batch = jobIds.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobIds.length / batchSize);
            
            console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)`);

            // Build CASE statement for bulk update
            const caseStatements = batch.map(jobId => {
              const companyId = jobCompanyMap.get(jobId);
              return `WHEN ${jobId} THEN ${companyId}`;
            }).join(' ');

            const jobIdsList = batch.join(',');

            const updateSQL = `
              UPDATE jobs 
              SET company_id = CASE id ${caseStatements} END
              WHERE id IN (${jobIdsList})
            `;

            try {
              const result = await db.execute(sql.raw(updateSQL));
              correctedCount += batch.length;
              
              if (batchNum % 10 === 0) {
                console.log(`Progress: ${correctedCount} jobs corrected`);
              }
            } catch (batchError) {
              console.error(`Batch ${batchNum} failed:`, batchError.message);
            }
          }

          // Verify results
          const companyJobCounts = await db.execute(sql`
            SELECT c.name, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            WHERE c.id IN (1, 2669, 2983, 16875, 2094)
            GROUP BY c.id, c.name
            ORDER BY job_count DESC
          `);

          console.log(`\n=== BATCH JOB-COMPANY FIX COMPLETED ===`);
          console.log(`Jobs corrected: ${correctedCount}`);
          console.log(`\nTop company job counts after correction:`);
          companyJobCounts.rows.forEach(row => {
            console.log(`${row.name}: ${row.job_count} jobs`);
          });

          resolve(correctedCount);
        } catch (error) {
          console.error('Batch correction error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

batchFixJobCompanies()
  .then((count) => {
    console.log(`Batch correction completed: ${count} jobs processed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Batch correction failed:', error);
    process.exit(1);
  });