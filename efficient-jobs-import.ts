import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function efficientJobsImport() {
  console.log('Starting efficient jobs import...');
  
  // Check current job count
  const currentJobs = await db.select().from(jobs);
  console.log(`Current jobs in database: ${currentJobs.length}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found:', csvFilePath);
    return;
  }

  const jobRecords: any[] = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ 
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;

        const jobRecord = {
          id: parseInt(row.id),
          companyId: parseInt(row.company_id) || null,
          title: (row.title || '').substring(0, 255),
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
        console.log(`Parsed ${rowCount} rows from CSV`);
        console.log(`Processing ${jobRecords.length} job records`);

        try {
          let successCount = 0;
          let errorCount = 0;
          const batchSize = 100;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Processing batch ${batchNum}/${totalBatches}`);

            // Insert batch with error handling
            for (const job of batch) {
              try {
                // Set categoryId to null if it doesn't match existing categories
                if (job.categoryId && (job.categoryId < 1 || job.categoryId > 200)) {
                  job.categoryId = null;
                }
                
                // Set companyId to null if it seems invalid
                if (job.companyId && job.companyId > 100000) {
                  job.companyId = null;
                }

                await db.insert(jobs).values(job).onConflictDoUpdate({
                  target: jobs.id,
                  set: {
                    title: job.title,
                    requirements: job.requirements,
                    description: job.description,
                    updatedAt: new Date()
                  }
                });
                
                successCount++;
              } catch (error: any) {
                if (error.message?.includes('foreign key')) {
                  // Try again with null foreign keys
                  try {
                    await db.insert(jobs).values({
                      ...job,
                      companyId: null,
                      categoryId: null
                    }).onConflictDoUpdate({
                      target: jobs.id,
                      set: {
                        title: job.title,
                        requirements: job.requirements,
                        description: job.description,
                        updatedAt: new Date()
                      }
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

          console.log('\n=== EFFICIENT JOBS IMPORT COMPLETED ===');
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobRecords.length) * 100).toFixed(2)}%`);

          // Final count
          const finalJobs = await db.select().from(jobs);
          console.log(`Total jobs in database: ${finalJobs.length}`);

          resolve(successCount);
        } catch (error) {
          console.error('Import error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

efficientJobsImport()
  .then(() => {
    console.log('Jobs import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });