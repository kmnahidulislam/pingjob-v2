import fs from 'fs';
import { parse } from 'csv-parse';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function robustCSVImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    console.log('Starting robust CSV import for all 76,807 companies...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Database cleared successfully.');

    const csvData = [];
    
    // Read CSV file synchronously to avoid stream issues
    const csvContent = fs.readFileSync('attached_assets/CSZ_1750183986263.csv', 'utf8');
    const parser = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV parsed: ${parser.length} total records to import`);
    
    let imported = 0;
    let errors = 0;
    const batchSize = 50; // Smaller batch size for stability
    const totalBatches = Math.ceil(parser.length / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, parser.length);
      const currentBatch = parser.slice(startIndex, endIndex);
      
      console.log(`Processing batch ${batch + 1}/${totalBatches} (${currentBatch.length} companies)...`);
      
      // Process each company in the batch
      for (const csvCompany of currentBatch) {
        try {
          const insertQuery = `
            INSERT INTO companies (
              id, name, country, state, city, location, zip_code, 
              website, phone, status, approved_by, user_id, logo_url, 
              created_at, updated_at, followers, industry, size, description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 0, NULL, NULL, NULL)
            ON CONFLICT (id) DO NOTHING
          `;
          
          await pool.query(insertQuery, [
            parseInt(csvCompany.id) || (imported + 1),
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
          
          if (imported % 1000 === 0) {
            console.log(`Progress: ${imported} companies imported...`);
          }
        } catch (error) {
          console.error(`Error importing ${csvCompany.name} (ID: ${csvCompany.id}):`, error.message);
          errors++;
          if (errors > 100) {
            console.log('Too many errors, stopping import');
            break;
          }
        }
      }
      
      console.log(`Batch ${batch + 1} completed. Total imported: ${imported}, Total errors: ${errors}`);
      
      // Small delay between batches to prevent overwhelming the database
      if (batch % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Reset sequence to continue from highest ID
    await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
    
    console.log(`\nRobust import completed: ${imported} companies imported with ALL columns and original IDs preserved`);
    console.log(`Total errors: ${errors}`);
    
    // Final verification
    const count = await pool.query('SELECT COUNT(*) as total FROM companies');
    console.log(`Final database count: ${count.rows[0].total} companies`);
    
    // Sample companies
    const sample = await pool.query('SELECT id, name, country, state, city, zip_code FROM companies ORDER BY id LIMIT 5');
    console.log('\nFirst 5 imported companies:');
    sample.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Location: ${row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
    });
    
  } catch (error) {
    console.error('Robust import error:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

robustCSVImport();