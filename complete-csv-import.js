import fs from 'fs';
import { parse } from 'csv-parse';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function completeCSVImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting complete CSV import with ALL columns and original IDs...');
    
    // Clear all existing data with proper cascade handling
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Existing data cleared successfully.');

    const csvData = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const stream = fs.createReadStream('attached_assets/CSZ_1750183986263.csv');
    stream.pipe(parser);

    parser.on('data', (row) => {
      csvData.push(row);
    });

    parser.on('end', async () => {
      try {
        console.log(`Processing ${csvData.length} companies with ALL columns from CSV...`);
        
        let imported = 0;
        let errors = 0;
        const batchSize = 100;
        const totalBatches = Math.ceil(csvData.length / batchSize);

        for (let batch = 0; batch < totalBatches; batch++) {
          const startIndex = batch * batchSize;
          const endIndex = Math.min(startIndex + batchSize, csvData.length);
          const currentBatch = csvData.slice(startIndex, endIndex);
          
          console.log(`Processing batch ${batch + 1}/${totalBatches} (${currentBatch.length} companies)...`);
          
          for (const csvCompany of currentBatch) {
            try {
              // Import with ALL columns from CSV, preserving original ID
              const insertQuery = `
                INSERT INTO companies (
                  id, name, country, state, city, location, zip_code, 
                  website, phone, status, approved_by, user_id, logo_url, 
                  created_at, updated_at, followers, industry, size, description
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 0, NULL, NULL, NULL)
              `;
              
              await pool.query(insertQuery, [
                parseInt(csvCompany.id) || imported + 1,  // Use CSV ID or fallback
                csvCompany.name || 'Unknown Company',
                csvCompany.country || null,
                csvCompany.state || null,
                csvCompany.city?.trim() || null,
                csvCompany.location || null,
                csvCompany.zip_code || null,
                csvCompany.website || null,
                csvCompany.phone || null,
                csvCompany.status || 'approved',
                csvCompany.approved_by || 'admin',
                csvCompany.user_id || 'admin',
                csvCompany.logo_url || null
              ]);
              
              imported++;
              if (imported % 500 === 0) {
                console.log(`Progress: ${imported} companies imported...`);
              }
            } catch (error) {
              console.error(`Error importing ${csvCompany.name} (ID: ${csvCompany.id}):`, error.message);
              errors++;
            }
          }
          
          console.log(`Batch ${batch + 1} completed. Imported: ${imported}, Errors: ${errors}`);
        }

        // Reset sequence to continue from highest ID
        await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
        
        console.log(`\nComplete import finished: ${imported} companies imported with ALL columns and original IDs preserved`);
        console.log(`Total errors: ${errors}`);
        
        // Sample verification
        const sample = await pool.query('SELECT id, name, country, state, city, zip_code FROM companies LIMIT 5');
        console.log('\nSample imported companies:');
        sample.rows.forEach(row => {
          console.log(`ID: ${row.id}, Name: ${row.name}, Location: ${row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
        });
        
      } catch (error) {
        console.error('Import error:', error);
      } finally {
        await pool.end();
      }
    });

    parser.on('error', (error) => {
      console.error('CSV parsing error:', error);
    });

  } catch (error) {
    console.error('Import error:', error);
  }
}

completeCSVImport();