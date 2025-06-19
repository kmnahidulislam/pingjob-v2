import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function finalJobsImport() {
  console.log('Starting final jobs import with proper null handling...');
  
  // Get existing job IDs
  const existingResult = await db.execute(sql`SELECT id FROM jobs`);
  const existingIds = new Set(existingResult.rows.map(row => row.id));
  console.log(`Existing jobs: ${existingIds.size}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const jobRecords: any[] = [];
  let rowCount = 0;
  let duplicateCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (existingIds.has(jobId)) {
          duplicateCount++;
          return;
        }

        // Default company_id to 1 (first company) if null or invalid
        let companyId = parseInt(row.company_id) || 1;
        if (companyId > 100000) companyId = 1; // Set very high IDs to default

        const jobRecord = {
          id: jobId,
          companyId: companyId,
          title: (row.title || 'Untitled Position').substring(0, 200),
          description: row.description || row.title || 'Job description not available',
          requirements: row.requirements || '',
          categoryId: parseInt(row.category_id) || null,
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zip_code || '',
          employmentType: row.employment_type || 'Contract',
          experienceLevel: row.experience_level || 'senior',
          salary: row.salary || '75',
          isActive: true,
          recruiterId: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        jobRecords.push(jobRecord);
      })
      .on('end', async () => {
        console.log(`Total CSV rows: ${rowCount}`);
        console.log(`Duplicate jobs skipped: ${duplicateCount}`);
        console.log(`New jobs to import: ${jobRecords.length}`);

        if (jobRecords.length === 0) {
          console.log('No new jobs to import!');
          resolve(0);
          return;
        }

        try {
          let successCount = 0;
          let errorCount = 0;
          const batchSize = 200;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} jobs)`);

            try {
              // Insert entire batch at once for better performance
              await db.insert(jobs).values(batch);
              successCount += batch.length;
              console.log(`✓ Batch ${batchNum} completed`);
            } catch (batchError: any) {
              // If batch fails, try individual inserts
              console.log(`Batch failed, trying individual inserts...`);
              for (const job of batch) {
                try {
                  await db.insert(jobs).values(job);
                  successCount++;
                } catch (jobError: any) {
                  if (jobError.message?.includes('foreign key')) {
                    // Retry with null category if foreign key issue
                    try {
                      await db.insert(jobs).values({
                        ...job,
                        categoryId: null
                      });
                      successCount++;
                    } catch (retryError) {
                      errorCount++;
                    }
                  } else {
                    errorCount++;
                  }
                }
              }
            }
            
            // Progress update every 20 batches
            if (batchNum % 20 === 0) {
              console.log(`Progress: ${successCount + errorCount}/${jobRecords.length} processed`);
            }
          }

          console.log(`\n=== FINAL JOBS IMPORT COMPLETED ===`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobRecords.length) * 100).toFixed(2)}%`);
          
          // Final count verification
          const finalCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM jobs`);
          const finalCount = finalCountResult.rows[0].count;
          console.log(`Total jobs in database: ${finalCount}`);

          resolve(successCount);
        } catch (error) {
          console.error('Import error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

finalJobsImport()
  .then((count) => {
    console.log(`Final import completed: ${count} new jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Final import failed:', error);
    process.exit(1);
  });