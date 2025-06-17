import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function resumeCSVImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Resuming CSV import to complete all 76,807 companies...');
    
    // Check current count
    const currentCount = await pool.query('SELECT COUNT(*) as count FROM companies');
    const existingRecords = parseInt(currentCount.rows[0].count);
    console.log(`Current database has ${existingRecords} companies`);
    
    // Get highest ID to know where to resume
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM companies');
    const maxId = parseInt(maxIdResult.rows[0].max_id) || 0;
    console.log(`Highest existing ID: ${maxId}`);

    // Read entire CSV file
    const csvContent = fs.readFileSync('attached_assets/CSZ_1750183986263.csv', 'utf8');
    const allRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV contains ${allRecords.length} total records`);
    
    // Filter to only records we haven't imported yet
    const remainingRecords = allRecords.filter(record => {
      const recordId = parseInt(record.id);
      return recordId > maxId;
    });
    
    console.log(`Need to import ${remainingRecords.length} remaining records (IDs > ${maxId})`);
    
    if (remainingRecords.length === 0) {
      console.log('All records already imported!');
      return;
    }

    let imported = 0;
    let errors = 0;
    const batchSize = 50; // Smaller batches for stability
    const totalBatches = Math.ceil(remainingRecords.length / batchSize);

    // Process remaining records in small batches
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, remainingRecords.length);
      const currentBatch = remainingRecords.slice(startIndex, endIndex);
      
      console.log(`Processing batch ${batch + 1}/${totalBatches} (${currentBatch.length} companies)...`);
      
      // Process each company individually to handle errors gracefully
      for (const record of currentBatch) {
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
            parseInt(record.id),
            record.name || 'Unknown Company',
            record.country || null,
            record.state || null,
            record.city?.trim() || null,
            record.location || null,
            record.zip_code || null,
            record.website || null,
            record.phone || null,
            record.status || 'approved',
            record.approved_by || 'admin',
            record.user_id || 'admin',
            record.logo_url || null
          ]);
          
          imported++;
          
          if (imported % 1000 === 0) {
            console.log(`Progress: ${imported} additional companies imported...`);
          }
        } catch (error) {
          console.error(`Error importing ${record.name} (ID: ${record.id}):`, error.message);
          errors++;
          if (errors > 100) {
            console.log('Too many errors, stopping import');
            break;
          }
        }
      }
      
      console.log(`Batch ${batch + 1} completed. Total new imports: ${imported}, Errors: ${errors}`);
      
      // Small delay between batches
      if (batch % 20 === 0 && batch > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Reset sequence to continue from highest ID
    await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
    
    // Final verification
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM companies');
    const totalCompanies = parseInt(finalCount.rows[0].total);
    
    console.log(`\nResume import completed:`);
    console.log(`- Started with: ${existingRecords} companies`);
    console.log(`- Newly imported: ${imported} companies`);
    console.log(`- Total errors: ${errors}`);
    console.log(`- Final database count: ${totalCompanies} companies`);
    console.log(`- Target was: 76,807 companies`);
    console.log(`- Completion: ${((totalCompanies / 76807) * 100).toFixed(1)}%`);
    
    // Sample of newly imported companies
    if (imported > 0) {
      const sampleNew = await pool.query(
        'SELECT id, name, country, state, city, zip_code FROM companies WHERE id > $1 ORDER BY id LIMIT 5',
        [maxId]
      );
      console.log('\nSample of newly imported companies:');
      sampleNew.rows.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.name}, Location: ${row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
      });
    }
    
  } catch (error) {
    console.error('Resume import error:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

resumeCSVImport();