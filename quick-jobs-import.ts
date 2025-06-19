import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';

async function importJobsFromCSV() {
  console.log('Starting bulk jobs import using Drizzle...');
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found:', csvFilePath);
    return;
  }

  const jobRecords: any[] = [];
  let rowCount = 0;
  let skippedRows = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ 
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      }))
      .on('data', (row) => {
        rowCount++;
        
        // Skip header or empty rows
        if (!row.id || row.id === 'id') {
          skippedRows++;
          return;
        }

        // Clean and prepare job data
        const jobRecord = {
          id: parseInt(row.id) || undefined,
          companyId: parseInt(row.company_id) || undefined,
          title: row.title || '',
          requirements: row.requirements || '',
          categoryId: parseInt(row.category_id) || undefined,
          description: row.description || '',
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zip_code || '',
          status: row.status || 'active',
          employmentType: row.employment_type || 'Contract',
          experienceLevel: row.experience_level || 'senior',
          salary: parseFloat(row.salary) || 75,
          isActive: row.is_active === 'TRUE' || row.is_active === 'true' || row.is_active === '1',
          recruiterId: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        jobRecords.push(jobRecord);
      })
      .on('end', async () => {
        console.log(`Parsed ${rowCount} rows from CSV`);
        console.log(`Skipped ${skippedRows} invalid rows`);
        console.log(`Processing ${jobRecords.length} job records`);

        try {
          // Process jobs in batches of 100
          const batchSize = 100;
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)`);

            try {
              // Insert batch using Drizzle
              await db.insert(jobs).values(batch).onConflictDoUpdate({
                target: jobs.id,
                set: {
                  companyId: batch[0].companyId,
                  title: batch[0].title,
                  requirements: batch[0].requirements,
                  categoryId: batch[0].categoryId,
                  description: batch[0].description,
                  country: batch[0].country,
                  state: batch[0].state,
                  city: batch[0].city,
                  zipCode: batch[0].zipCode,
                  status: batch[0].status,
                  employmentType: batch[0].employmentType,
                  experienceLevel: batch[0].experienceLevel,
                  salary: batch[0].salary,
                  isActive: batch[0].isActive,
                  updatedAt: new Date()
                }
              });
              
              successCount += batch.length;
              console.log(`✓ Batch ${batchNumber} completed successfully`);
              
            } catch (batchError) {
              console.error(`✗ Error in batch ${batchNumber}:`, batchError);
              errorCount += batch.length;
            }
          }

          console.log('\n=== BULK JOBS IMPORT COMPLETED ===');
          console.log(`Total rows processed: ${jobRecords.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobRecords.length) * 100).toFixed(2)}%`);

          resolve(successCount);
        } catch (error) {
          console.error('Error during import:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Run the import
importJobsFromCSV()
  .then((count) => {
    console.log(`Jobs import completed: ${count} records processed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });