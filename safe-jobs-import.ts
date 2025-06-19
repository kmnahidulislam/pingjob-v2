import { db } from './server/db';
import { jobs } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';

async function safeImportJobs() {
  console.log('Starting safe jobs import (skipping invalid foreign keys)...');
  
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
          companyId: parseInt(row.company_id) || null,
          title: row.title || '',
          requirements: row.requirements || '',
          categoryId: parseInt(row.category_id) || null,
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
          let successCount = 0;
          let errorCount = 0;
          let foreignKeyErrors = 0;

          // Process jobs individually to handle foreign key violations
          for (let i = 0; i < jobRecords.length; i++) {
            const job = jobRecords[i];
            const progress = i + 1;
            
            if (progress % 1000 === 0) {
              console.log(`Progress: ${progress}/${jobRecords.length} (${((progress/jobRecords.length)*100).toFixed(1)}%)`);
            }

            try {
              await db.insert(jobs).values(job).onConflictDoUpdate({
                target: jobs.id,
                set: {
                  companyId: job.companyId,
                  title: job.title,
                  requirements: job.requirements,
                  categoryId: job.categoryId,
                  description: job.description,
                  country: job.country,
                  state: job.state,
                  city: job.city,
                  zipCode: job.zipCode,
                  status: job.status,
                  employmentType: job.employmentType,
                  experienceLevel: job.experienceLevel,
                  salary: job.salary,
                  isActive: job.isActive,
                  updatedAt: new Date()
                }
              });
              
              successCount++;
              
            } catch (jobError: any) {
              if (jobError.message?.includes('foreign key constraint')) {
                foreignKeyErrors++;
                // Skip jobs with invalid foreign key references
                continue;
              } else {
                console.error(`Error inserting job ID ${job.id}:`, jobError.message);
                errorCount++;
              }
            }
          }

          console.log('\n=== SAFE JOBS IMPORT COMPLETED ===');
          console.log(`Total rows processed: ${jobRecords.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Skipped due to foreign key issues: ${foreignKeyErrors}`);
          console.log(`Other errors: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobRecords.length) * 100).toFixed(2)}%`);

          // Verify final count
          const result = await db.select().from(jobs);
          console.log(`Total jobs in database: ${result.length}`);

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
safeImportJobs()
  .then((count) => {
    console.log(`Jobs import completed: ${count} records processed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });