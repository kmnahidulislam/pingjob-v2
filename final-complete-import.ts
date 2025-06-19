import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';

async function finalCompleteImport() {
  console.log('Starting final complete jobs import...');
  
  const existingJobs = await db.select().from(jobs);
  const existingIds = new Set(existingJobs.map(j => j.id));
  console.log(`Current jobs: ${existingIds.size}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const remainingJobs: any[] = [];
  let csvRowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        csvRowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (existingIds.has(jobId)) return;

        const job = {
          id: jobId,
          companyId: 1,
          title: (row.title || 'Position Available').substring(0, 200),
          description: row.description || row.title || 'Job description available',
          requirements: row.requirements || '',
          categoryId: null,
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

        remainingJobs.push(job);
      })
      .on('end', async () => {
        console.log(`Total CSV rows: ${csvRowCount}`);
        console.log(`Remaining jobs to import: ${remainingJobs.length}`);

        if (remainingJobs.length === 0) {
          console.log('All jobs already imported');
          resolve(0);
          return;
        }

        try {
          let successCount = 0;
          const batchSize = 100;

          for (let i = 0; i < remainingJobs.length; i += batchSize) {
            const batch = remainingJobs.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(remainingJobs.length / batchSize);
            
            try {
              await db.insert(jobs).values(batch);
              successCount += batch.length;
              
              if (batchNum % 25 === 0) {
                console.log(`Batch ${batchNum}/${totalBatches} - ${successCount} jobs imported`);
              }
            } catch (batchError) {
              for (const job of batch) {
                try {
                  await db.insert(jobs).values(job);
                  successCount++;
                } catch (individualError) {
                  continue;
                }
              }
            }
          }

          const finalJobs = await db.select().from(jobs);
          console.log(`\n=== FINAL COMPLETE IMPORT FINISHED ===`);
          console.log(`Jobs imported in this session: ${successCount}`);
          console.log(`Total jobs in database: ${finalJobs.length}`);
          console.log(`Target from CSV: 25,122 jobs`);
          console.log(`Import completion: ${((finalJobs.length / 25122) * 100).toFixed(1)}%`);

          resolve(successCount);
        } catch (error) {
          console.error('Import error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

finalCompleteImport()
  .then((count) => {
    console.log(`Final import session completed: ${count} jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Final import failed:', error);
    process.exit(1);
  });