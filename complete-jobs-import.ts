import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function completeJobsImport() {
  console.log('Starting complete jobs import from CSV...');
  
  // Get existing job IDs to avoid duplicates
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
          return; // Skip existing jobs
        }

        const jobRecord = {
          id: jobId,
          companyId: parseInt(row.company_id) || null,
          title: (row.title || '').substring(0, 200),
          requirements: row.requirements || '',
          categoryId: parseInt(row.category_id) || null,
          description: row.description || '',
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zip_code || '',
          status: 'active',
          employmentType: row.employment_type || 'Contract',
          experienceLevel: row.experience_level || 'senior',
          salary: parseFloat(row.salary) || 75,
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
          const batchSize = 100;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)`);

            // Process each job in the batch individually for better error handling
            for (const job of batch) {
              try {
                // Clean up potential foreign key issues
                if (job.categoryId && (job.categoryId < 1 || job.categoryId > 200)) {
                  job.categoryId = null;
                }
                if (job.companyId && job.companyId > 100000) {
                  job.companyId = null;
                }

                await db.insert(jobs).values(job);
                successCount++;
              } catch (error: any) {
                // Handle foreign key constraint violations
                if (error.message?.includes('foreign key') || error.message?.includes('violates')) {
                  try {
                    // Retry with null foreign keys
                    await db.insert(jobs).values({
                      ...job,
                      companyId: null,
                      categoryId: null
                    });
                    successCount++;
                  } catch (retryError) {
                    console.error(`Failed to insert job ${job.id}: ${retryError}`);
                    errorCount++;
                  }
                } else {
                  console.error(`Error inserting job ${job.id}: ${error.message}`);
                  errorCount++;
                }
              }
            }
            
            // Progress update every 10 batches
            if (batchNum % 10 === 0) {
              console.log(`Progress: ${successCount + errorCount}/${jobRecords.length} processed`);
            }
          }

          console.log(`\n=== COMPLETE JOBS IMPORT FINISHED ===`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          
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

completeJobsImport()
  .then((count) => {
    console.log(`Complete import finished: ${count} new jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Complete import failed:', error);
    process.exit(1);
  });