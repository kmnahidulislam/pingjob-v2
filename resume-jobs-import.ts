import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';

async function resumeJobsImport() {
  console.log('Resuming jobs import from CSV...');
  
  // Get current max job ID to resume from correct position
  const existingJobs = await db.select().from(jobs);
  const maxId = Math.max(...existingJobs.map(j => j.id));
  console.log(`Current jobs in database: ${existingJobs.length}`);
  console.log(`Max job ID: ${maxId}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const jobRecords: any[] = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (jobId <= maxId) return; // Skip already imported jobs

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
        console.log(`New jobs to import: ${jobRecords.length}`);

        if (jobRecords.length === 0) {
          console.log('All jobs already imported!');
          resolve(0);
          return;
        }

        try {
          let successCount = 0;
          let errorCount = 0;
          const batchSize = 50;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} jobs)`);

            for (const job of batch) {
              try {
                // Handle potential foreign key violations
                if (job.categoryId && (job.categoryId < 1 || job.categoryId > 200)) {
                  job.categoryId = null;
                }
                if (job.companyId && job.companyId > 100000) {
                  job.companyId = null;
                }

                await db.insert(jobs).values(job);
                successCount++;
              } catch (error: any) {
                if (error.message?.includes('foreign key')) {
                  try {
                    await db.insert(jobs).values({
                      ...job,
                      companyId: null,
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

          console.log(`\n=== RESUME IMPORT COMPLETED ===`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          
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

resumeJobsImport()
  .then((count) => {
    console.log(`Resume import completed: ${count} new jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Resume import failed:', error);
    process.exit(1);
  });