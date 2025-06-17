import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function bulkCompleteImport() {
  const pool = new Pool({ 
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting bulk complete import...');
    
    // Get current max ID
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM companies');
    const maxId = parseInt(maxIdResult.rows[0].max_id) || 0;
    console.log(`Starting from ID: ${maxId + 1}`);

    // Read CSV and filter remaining records
    const csvContent = fs.readFileSync('attached_assets/CSZ_1750183986263.csv', 'utf8');
    const allRecords = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    const remainingRecords = allRecords.filter(record => parseInt(record.id) > maxId);
    
    console.log(`Importing ${remainingRecords.length} remaining companies...`);

    let imported = 0;
    const batchSize = 500; // Larger batches for speed
    const totalBatches = Math.ceil(remainingRecords.length / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatch = remainingRecords.slice(batch * batchSize, (batch + 1) * batchSize);
      
      // Build bulk insert
      const values = [];
      const placeholders = [];
      
      for (let i = 0; i < currentBatch.length; i++) {
        const record = currentBatch[i];
        const base = i * 13;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, NOW(), NOW(), 0, NULL, NULL, NULL)`);
        
        values.push(
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
      
      console.log(`Batch ${batch + 1}/${totalBatches}: ${imported} total imported`);
    }

    // Final count check
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM companies');
    console.log(`\nBulk import complete: ${finalCount.rows[0].total} total companies in database`);
    
  } catch (error) {
    console.error('Bulk import error:', error);
  } finally {
    await pool.end();
  }
}

bulkCompleteImport();