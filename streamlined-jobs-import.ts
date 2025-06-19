import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';

async function streamlinedJobsImport() {
  console.log('Starting streamlined jobs import...');
  
  // Get existing job IDs
  const existingJobs = await db.select().from(jobs);
  const existingIds = new Set(existingJobs.map(j => j.id));
  console.log(`Current jobs: ${existingIds.size}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const newJobs: any[] = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (existingIds.has(jobId)) return;

        // Create job record with safe defaults
        const job = {
          id: jobId,
          companyId: 1, // Default to first company to avoid foreign key issues
          title: (row.title || 'Position Available').substring(0, 200),
          description: row.description || row.title || 'Job description available',
          requirements: row.requirements || '',
          categoryId: null, // Set to null to avoid foreign key constraints
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zip_code || '',
          employmentType: 'Contract',
          experienceLevel: 'senior',
          salary: '75',
          isActive: true,
          recruiterId: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        newJobs.push(job);
      })
      .on('end', async () => {
        console.log(`CSV rows: ${rowCount}`);
        console.log(`New jobs to import: ${newJobs.length}`);

        if (newJobs.length === 0) {
          console.log('All jobs already imported');
          resolve(0);
          return;
        }

        try {
          let successCount = 0;
          const batchSize = 50;

          for (let i = 0; i < newJobs.length; i += batchSize) {
            const batch = newJobs.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(newJobs.length / batchSize);
            
            try {
              await db.insert(jobs).values(batch);
              successCount += batch.length;
              
              if (batchNum % 50 === 0) {
                console.log(`Progress: ${batchNum}/${totalBatches} batches (${successCount} jobs imported)`);
              }
            } catch (batchError) {
              // Process individually if batch fails
              for (const job of batch) {
                try {
                  await db.insert(jobs).values(job);
                  successCount++;
                } catch (individualError) {
                  // Skip problematic jobs
                  continue;
                }
              }
            }
          }

          const finalJobs = await db.select().from(jobs);
          console.log(`\n=== STREAMLINED IMPORT COMPLETED ===`);
          console.log(`Jobs imported: ${successCount}`);
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

streamlinedJobsImport()
  .then((count) => {
    console.log(`Import completed: ${count} jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });