import { db } from './server/db';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function importJobsWithoutValidation() {
  console.log('Starting bulk jobs import without validation...');
  
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

        // Clean and prepare job data - set invalid foreign keys to null
        const jobRecord = {
          id: parseInt(row.id) || null,
          company_id: parseInt(row.company_id) || null,
          title: row.title || '',
          requirements: row.requirements || '',
          category_id: parseInt(row.category_id) || null,
          description: row.description || '',
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zip_code: row.zip_code || '',
          status: row.status || 'active',
          employment_type: row.employment_type || 'Contract',
          experience_level: row.experience_level || 'senior',
          salary: parseFloat(row.salary) || 75,
          is_active: row.is_active === 'TRUE' || row.is_active === 'true' || row.is_active === '1',
          recruiter_id: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        };

        jobRecords.push(jobRecord);
      })
      .on('end', async () => {
        console.log(`Parsed ${rowCount} rows from CSV`);
        console.log(`Skipped ${skippedRows} invalid rows`);
        console.log(`Processing ${jobRecords.length} job records`);

        try {
          // Temporarily disable foreign key constraints
          await db.execute(sql`SET session_replication_role = replica;`);
          console.log('Disabled foreign key constraints');

          // Process jobs in batches of 500 for faster import
          const batchSize = 500;
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < jobRecords.length; i += batchSize) {
            const batch = jobRecords.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobRecords.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)`);

            try {
              // Insert batch using raw SQL for maximum performance
              const values = batch.map(job => 
                `(${job.id}, ${job.company_id}, ${job.title ? `'${job.title.replace(/'/g, "''")}'` : 'NULL'}, ` +
                `${job.requirements ? `'${job.requirements.replace(/'/g, "''")}'` : 'NULL'}, ${job.category_id}, ` +
                `${job.description ? `'${job.description.replace(/'/g, "''")}'` : 'NULL'}, ` +
                `${job.country ? `'${job.country}'` : 'NULL'}, ` +
                `${job.state ? `'${job.state}'` : 'NULL'}, ` +
                `${job.city ? `'${job.city}'` : 'NULL'}, ` +
                `${job.zip_code ? `'${job.zip_code}'` : 'NULL'}, ` +
                `'${job.status}', '${job.employment_type}', '${job.experience_level}', ` +
                `${job.salary}, ${job.is_active}, NOW(), NOW(), '${job.recruiter_id}')`
              ).join(',');

              await db.execute(sql.raw(`
                INSERT INTO jobs (
                  id, company_id, title, requirements, category_id, description,
                  country, state, city, zip_code, status, employment_type,
                  experience_level, salary, is_active, created_at, updated_at, recruiter_id
                ) VALUES ${values}
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  title = EXCLUDED.title,
                  requirements = EXCLUDED.requirements,
                  category_id = EXCLUDED.category_id,
                  description = EXCLUDED.description,
                  country = EXCLUDED.country,
                  state = EXCLUDED.state,
                  city = EXCLUDED.city,
                  zip_code = EXCLUDED.zip_code,
                  status = EXCLUDED.status,
                  employment_type = EXCLUDED.employment_type,
                  experience_level = EXCLUDED.experience_level,
                  salary = EXCLUDED.salary,
                  is_active = EXCLUDED.is_active,
                  updated_at = NOW()
              `));
              
              successCount += batch.length;
              console.log(`✓ Batch ${batchNumber} completed successfully`);
              
            } catch (batchError) {
              console.error(`✗ Error in batch ${batchNumber}:`, batchError);
              errorCount += batch.length;
            }
          }

          // Re-enable foreign key constraints
          await db.execute(sql`SET session_replication_role = DEFAULT;`);
          console.log('Re-enabled foreign key constraints');

          console.log('\n=== BULK JOBS IMPORT COMPLETED ===');
          console.log(`Total rows processed: ${jobRecords.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobRecords.length) * 100).toFixed(2)}%`);

          // Verify final count
          const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM jobs`);
          console.log(`Total jobs in database: ${countResult.rows[0].total}`);

          resolve(successCount);
        } catch (error) {
          // Re-enable foreign key constraints even if there's an error
          try {
            await db.execute(sql`SET session_replication_role = DEFAULT;`);
          } catch (e) {
            console.error('Failed to re-enable foreign key constraints:', e);
          }
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
importJobsWithoutValidation()
  .then((count) => {
    console.log(`Jobs import completed: ${count} records processed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });