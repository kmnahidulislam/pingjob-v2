const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function simpleVendorImport() {
  try {
    console.log('Starting simple vendor import...');
    
    // Temporarily remove foreign key constraint
    await pool.query('ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_company_id_companies_id_fk;');
    console.log('Removed foreign key constraint');
    
    // Read CSV file
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

    // Parse CSV
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
    console.log('Sample record:', records[0]);

    // Clear existing vendors
    await pool.query('DELETE FROM vendors;');
    console.log('Cleared existing vendors');

    // Insert in smaller batches
    const batchSize = 100;
    let processedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${batchNumber}/${Math.ceil(records.length / batchSize)} (${batch.length} records)...`);

      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const record of batch) {
        const id = record.id ? parseInt(record.id) : null;
        const companyId = record.company_id ? parseInt(record.company_id) : null;
        const name = (record.name || '').substring(0, 255);
        const email = (record.email || '').substring(0, 255);
        const services = (record.services || '').substring(0, 1000);

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
        `;

        try {
          await pool.query(insertQuery, values);
          processedCount += placeholders.length;
        } catch (error) {
          console.error(`Batch ${batchNumber} error:`, error.message);
        }
      }

      if (batchNumber % 10 === 0) {
        console.log(`Progress: ${processedCount} records processed`);
      }
    }

    // Add foreign key constraint back
    await pool.query('ALTER TABLE vendors ADD CONSTRAINT vendors_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES companies (id);');
    console.log('Restored foreign key constraint');

    // Final verification
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vendors');
    const totalVendors = parseInt(countResult.rows[0].total);

    console.log('\n=== VENDOR IMPORT SUMMARY ===');
    console.log(`Total records in CSV: ${records.length}`);
    console.log(`Successfully imported: ${processedCount}`);
    console.log(`Total vendors in database: ${totalVendors}`);
    console.log('=====================================');

    // Sample imported vendors
    const sampleResult = await pool.query('SELECT * FROM vendors ORDER BY id LIMIT 5');
    console.log('\nSample imported vendors:');
    sampleResult.rows.forEach((vendor, index) => {
      console.log(`${index + 1}. ID: ${vendor.id}, Company: ${vendor.company_id}, Name: ${vendor.name}`);
    });

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

simpleVendorImport().catch(console.error);