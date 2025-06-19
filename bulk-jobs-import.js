const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('@neondatabase/serverless');
const ws = require("ws");

// Configure Neon connection
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importJobsFromCSV() {
  console.log('Starting bulk jobs import...');
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found:', csvFilePath);
    return;
  }

  const jobs = [];
  let rowCount = 0;
  let skippedRows = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ 
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
        const job = {
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
          is_active: row.is_active === 'TRUE' || row.is_active === 'true' || row.is_active === '1'
        };

        jobs.push(job);
      })
      .on('end', async () => {
        console.log(`Parsed ${rowCount} rows from CSV`);
        console.log(`Skipped ${skippedRows} invalid rows`);
        console.log(`Processing ${jobs.length} job records`);

        try {
          // Process jobs in batches of 100
          const batchSize = 100;
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = jobs.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(jobs.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)`);

            try {
              // Insert batch using raw SQL for better performance
              const values = batch.map(job => 
                `(${job.id}, ${job.company_id}, '${(job.title || '').replace(/'/g, "''")}', ` +
                `'${(job.requirements || '').replace(/'/g, "''")}', ${job.category_id}, ` +
                `'${(job.description || '').replace(/'/g, "''")}', '${job.country}', ` +
                `'${job.state}', '${job.city}', '${job.zip_code}', '${job.status}', ` +
                `'${job.employment_type}', '${job.experience_level}', ${job.salary}, ${job.is_active}, ` +
                `NOW(), 'admin')`
              ).join(',');

              const insertSQL = `
                INSERT INTO jobs (
                  id, company_id, title, requirements, category_id, description,
                  country, state, city, zip_code, status, employment_type,
                  experience_level, salary, is_active, created_at, recruiter_id
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
              `;

              const result = await pool.query(insertSQL);
              successCount += batch.length;
              
              console.log(`✓ Batch ${batchNumber} completed successfully`);
              
            } catch (batchError) {
              console.error(`✗ Error in batch ${batchNumber}:`, batchError.message);
              errorCount += batch.length;
            }
          }

          console.log('\n=== BULK JOBS IMPORT COMPLETED ===');
          console.log(`Total rows processed: ${jobs.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed imports: ${errorCount}`);
          console.log(`Success rate: ${((successCount / jobs.length) * 100).toFixed(2)}%`);

          // Verify final count
          const countResult = await pool.query('SELECT COUNT(*) as total FROM jobs');
          console.log(`Total jobs in database: ${countResult.rows[0].total}`);

          resolve();
        } catch (error) {
          console.error('Error during import:', error);
          reject(error);
        } finally {
          await pool.end();
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
  .then(() => {
    console.log('Jobs import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });