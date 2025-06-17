import fs from 'fs';
import { parse } from 'csv-parse';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function finalCSVImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Starting final CSV import for all 76,807 companies...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Database cleared successfully.');

    let imported = 0;
    let errors = 0;
    let totalProcessed = 0;
    
    return new Promise((resolve, reject) => {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      const stream = fs.createReadStream('attached_assets/CSZ_1750183986263.csv');
      
      parser.on('readable', async function() {
        let record;
        while (record = parser.read()) {
          totalProcessed++;
          
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
              parseInt(record.id) || totalProcessed,
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
              console.log(`Progress: ${imported} companies imported (${totalProcessed} processed)...`);
            }
          } catch (error) {
            errors++;
            if (errors <= 10) {
              console.error(`Error importing ${record.name} (ID: ${record.id}):`, error.message);
            }
          }
        }
      });

      parser.on('error', function(err) {
        console.error('CSV parsing error:', err);
        reject(err);
      });

      parser.on('end', async function() {
        try {
          // Reset sequence to continue from highest ID
          await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
          
          console.log(`\nFinal import completed: ${imported} companies imported with ALL columns and original IDs preserved`);
          console.log(`Total processed: ${totalProcessed}, Total errors: ${errors}`);
          
          // Final verification
          const count = await pool.query('SELECT COUNT(*) as total FROM companies');
          console.log(`Final database count: ${count.rows[0].total} companies`);
          
          // Sample companies
          const sample = await pool.query('SELECT id, name, country, state, city, zip_code FROM companies ORDER BY id LIMIT 5');
          console.log('\nFirst 5 imported companies:');
          sample.rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}, Location: ${row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
          });
          
          await pool.end();
          resolve();
        } catch (error) {
          console.error('Error during completion:', error);
          reject(error);
        }
      });

      stream.pipe(parser);
    });
    
  } catch (error) {
    console.error('Final import error:', error);
    await pool.end();
  }
}

finalCSVImport().then(() => {
  console.log('CSV import process completed.');
}).catch(error => {
  console.error('CSV import failed:', error);
});