import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function completeFreshImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting complete fresh import with ALL columns...');
    
    // Clear ALL existing data completely
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Database completely cleared.');

    // Read the correct CSV file with ALL columns
    const csvContent = fs.readFileSync('attached_assets/Replit_1749782925286.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV loaded: ${records.length} total records with ALL columns`);
    console.log('CSV columns:', Object.keys(records[0]));
    
    let imported = 0;
    let errors = 0;
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);

    // Import ALL data with ALL columns from CSV
    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatch = records.slice(batch * batchSize, (batch + 1) * batchSize);
      
      // Build bulk insert with ALL columns
      const values = [];
      const placeholders = [];
      
      for (let i = 0; i < currentBatch.length; i++) {
        const record = currentBatch[i];
        const base = i * 13;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, NOW(), NOW(), 0, NULL, NULL, NULL)`);
        
        values.push(
          parseInt(record.id) || (imported + i + 1),
          record.name || 'Unknown Company',
          record.country || null,
          record.state || null,
          record.city?.trim() || null,
          record.location || null,           // IMPORTING location column
          record.zip_code || null,
          record.website || null,            // IMPORTING website column
          record.phone || null,              // IMPORTING phone column
          record.status || 'approved',       // IMPORTING status column
          record.approved_by || 'admin',     // IMPORTING approved_by column
          record.user_id || 'admin',         // IMPORTING user_id column
          record.logo_url || null            // IMPORTING logo_url column
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
      
      console.log(`Batch ${batch + 1}/${totalBatches}: ${imported} companies imported with ALL columns`);
      
      if (imported % 5000 === 0) {
        console.log(`Milestone: ${imported} companies imported...`);
      }
    }

    // Reset sequence
    await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
    
    // Final verification with ALL columns
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM companies');
    console.log(`\nFresh import complete: ${finalCount.rows[0].total} companies imported with ALL columns`);
    
    // Verify ALL columns are imported
    const sampleWithAllColumns = await pool.query(`
      SELECT id, name, country, state, city, location, zip_code, website, phone, status, approved_by, user_id, logo_url 
      FROM companies 
      WHERE website IS NOT NULL OR phone IS NOT NULL OR location IS NOT NULL
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('\nSample companies with ALL columns imported:');
    sampleWithAllColumns.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}`);
      console.log(`  Location: ${row.location || row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
      console.log(`  Website: ${row.website || 'N/A'}`);
      console.log(`  Phone: ${row.phone || 'N/A'}`);
      console.log(`  Status: ${row.status}, Approved by: ${row.approved_by}, User: ${row.user_id}`);
      console.log(`  Logo URL: ${row.logo_url || 'N/A'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Fresh import error:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

completeFreshImport();