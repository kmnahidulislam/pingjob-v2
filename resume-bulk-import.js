import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function resumeBulkImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Resuming bulk import from where it stopped...');
    
    // Check current count
    const currentResult = await pool.query('SELECT COUNT(*) as current_count FROM companies');
    const currentCount = parseInt(currentResult.rows[0].current_count);
    console.log(`Current database count: ${currentCount} companies`);

    // Read the CSV file
    const csvContent = fs.readFileSync('attached_assets/Replit_1749782925286.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV contains: ${records.length} total records`);
    console.log(`Remaining to import: ${records.length - currentCount} companies`);

    if (currentCount >= records.length) {
      console.log('Import already complete!');
      return;
    }

    // Start from where we left off
    const remainingRecords = records.slice(currentCount);
    console.log(`Processing ${remainingRecords.length} remaining companies...`);

    let imported = 0;
    const batchSize = 500; // Larger batches for efficiency
    const totalBatches = Math.ceil(remainingRecords.length / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatch = remainingRecords.slice(batch * batchSize, (batch + 1) * batchSize);
      
      // Build bulk insert with ALL columns
      const values = [];
      const placeholders = [];
      
      for (let i = 0; i < currentBatch.length; i++) {
        const record = currentBatch[i];
        const base = i * 13;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, NOW(), NOW(), 0, NULL, NULL, NULL)`);
        
        values.push(
          parseInt(record.id) || (currentCount + imported + i + 1),
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
      
      console.log(`Batch ${batch + 1}/${totalBatches}: ${imported} more companies imported (Total: ${currentCount + imported})`);
      
      // Progress milestones
      if (imported % 5000 === 0) {
        console.log(`Milestone: ${imported} additional companies imported...`);
      }
    }

    // Reset sequence to highest ID
    await pool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
    
    // Final verification
    const finalResult = await pool.query('SELECT COUNT(*) as final_count FROM companies');
    const finalCount = parseInt(finalResult.rows[0].final_count);
    
    console.log(`\nResume import complete!`);
    console.log(`Final database count: ${finalCount} companies`);
    console.log(`Import completion: ${((finalCount / records.length) * 100).toFixed(2)}%`);
    
    // Show sample of newly imported companies with ALL columns
    const sampleNew = await pool.query(`
      SELECT id, name, country, state, city, location, zip_code, website, phone, status, approved_by, user_id, logo_url 
      FROM companies 
      WHERE id > $1
      ORDER BY id 
      LIMIT 3
    `, [currentCount]);
    
    console.log('\nSample of newly imported companies with ALL columns:');
    sampleNew.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}`);
      console.log(`  Location: ${row.location || row.city}, ${row.state} ${row.zip_code}, ${row.country}`);
      console.log(`  Website: ${row.website || 'N/A'}`);
      console.log(`  Phone: ${row.phone || 'N/A'}`);
      console.log(`  Status: ${row.status}, User: ${row.user_id}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Resume import error:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

resumeBulkImport();