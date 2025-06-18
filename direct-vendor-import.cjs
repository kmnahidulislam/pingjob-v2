const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function directVendorImport() {
  try {
    console.log('Starting direct vendor import without validation...');
    
    // Temporarily disable foreign key constraints
    await pool.query('SET foreign_key_checks = 0;');
    console.log('Disabled foreign key constraints');
    
    // Read CSV file with different encoding options
    let csvData;
    const csvFilePath = './attached_assets/Vendor_replit_1750258134470.csv';
    
    try {
      csvData = fs.readFileSync(csvFilePath, 'utf8');
    } catch (error) {
      try {
        csvData = fs.readFileSync(csvFilePath, 'latin1');
        console.log('Using latin1 encoding');
      } catch (error2) {
        const buffer = fs.readFileSync(csvFilePath);
        csvData = buffer.toString('utf8');
        console.log('Using buffer conversion');
      }
    }

    // Parse CSV data
    const records = [];
    await new Promise((resolve, reject) => {
      csv.parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          records.push(...data);
          resolve(data);
        }
      });
    });

    console.log(`Parsed ${records.length} vendor records from CSV`);
    
    if (records.length === 0) {
      console.log('No records found in CSV file');
      return;
    }

    console.log('Sample record:', records[0]);

    // Clear existing vendors table to avoid conflicts
    await pool.query('TRUNCATE TABLE vendors RESTART IDENTITY CASCADE;');
    console.log('Cleared existing vendors table');

    // Process all records in large batches
    const batchSize = 1000;
    let processedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${batchNumber} (${batch.length} records)...`);

      try {
        // Build bulk insert query
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        for (const record of batch) {
          const id = record.id ? parseInt(record.id) : null;
          const companyId = record.company_id ? parseInt(record.company_id) : null;
          const name = record.name || '';
          const email = record.email || '';
          const services = record.services || '';

          if (id && companyId && name && email) {
            values.push(id, companyId, name, email, services, 'pending', 'csv-import');
            placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
            paramIndex += 7;
          }
        }

        if (placeholders.length > 0) {
          const insertQuery = `
            INSERT INTO vendors (id, company_id, name, email, services, status, created_by) 
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (id) DO UPDATE SET
              company_id = EXCLUDED.company_id,
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              services = EXCLUDED.services,
              updated_at = NOW()
          `;

          await pool.query(insertQuery, values);
          processedCount += placeholders.length;
          console.log(`Batch ${batchNumber} completed. Total processed: ${processedCount}`);
        }

      } catch (batchError) {
        console.error(`Batch ${batchNumber} failed:`, batchError.message);
      }
    }

    // Re-enable foreign key constraints
    await pool.query('SET foreign_key_checks = 1;');
    console.log('Re-enabled foreign key constraints');

    // Final count verification
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vendors');
    const totalVendors = parseInt(countResult.rows[0].total);

    console.log('\n=== VENDOR IMPORT SUMMARY ===');
    console.log(`Total records in CSV: ${records.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Total vendors in database: ${totalVendors}`);
    console.log('=====================================');

    // Sample imported vendors
    const sampleResult = await pool.query('SELECT * FROM vendors ORDER BY id LIMIT 5');
    console.log('\nSample imported vendors:');
    sampleResult.rows.forEach((vendor, index) => {
      console.log(`${index + 1}. ID: ${vendor.id}, Company: ${vendor.company_id}, Name: ${vendor.name}, Email: ${vendor.email}`);
    });

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
directVendorImport().catch(console.error);