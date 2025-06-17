import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function batchCSVImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting batch CSV import for all 76,807 companies...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Database cleared successfully.');

    // Read entire CSV file
    const csvContent = fs.readFileSync('attached_assets/CSZ_1750183986263.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV loaded: ${records.length} total records to import`);
    
    let imported = 0;
    let errors = 0;
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);

    // Process in batches using batch inserts for speed
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, records.length);
      const currentBatch = records.slice(startIndex, endIndex);
      
      try {
        // Build batch insert query
        const values = [];
        const placeholders = [];
        
        for (let i = 0; i < currentBatch.length; i++) {
          const record = currentBatch[i];
          const baseIndex = i * 13;
          
          placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, NOW(), NOW(), 0, NULL, NULL, NULL)`);
          
          values.push(
            parseInt(record.id) || (imported + i + 1),
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
          );
        }
        
        const insertQuery = `
          INSERT INTO companies (
            id, name, country, state, city, location, zip_code, 
            website, phone, status, approved_by, user_id, logo_url, 
            created_at, updated_at, followers, industry, size, description
          )
          VALUES ${placeholders.join(', ')}
          ON CONFLICT (id) DO NOTHING
        `;
        
        await pool.query(insertQuery, values);
        imported += currentBatch.length;
        
        console.log(`Batch ${batch + 1}/${totalBatches} completed. Total imported: ${imported}`);
        
      } catch (error) {
        console.error(`Error in batch ${batch + 1}:`, error.message);
        errors++;
        
        // Fallback to individual inserts for this batch
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
              parseInt(record.id) || (imported + 1),
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
          } catch (individualError) {
            console.error(`Individual error for ${record.name}:`, individualError.message);
          }
        }
      }
    }

    // Reset sequence
    await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
    
    // Final verification
    const count = await pool.query('SELECT COUNT(*) as total FROM companies');
    console.log(`\nBatch import completed: ${imported} companies imported`);
    console.log(`Final database count: ${count.rows[0].total} companies`);
    console.log(`Total errors: ${errors}`);
    
    // Sample companies
    const sample = await pool.query('SELECT id, name, country, state, city, zip_code FROM companies ORDER BY id LIMIT 10');
    console.log('\nSample imported companies:');
    sample.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Location: ${row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
    });
    
  } catch (error) {
    console.error('Batch import error:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

batchCSVImport();