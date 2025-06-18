const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function bulkVendorImport() {
  try {
    console.log('Starting bulk vendor import...');
    
    // Read CSV file with different encoding options to handle potential encoding issues
    let csvData;
    const csvFilePath = './attached_assets/Vendor_replit_1750258134470.csv';
    
    try {
      // Try UTF-8 first
      csvData = fs.readFileSync(csvFilePath, 'utf8');
    } catch (error) {
      try {
        // Try latin1 encoding if UTF-8 fails
        csvData = fs.readFileSync(csvFilePath, 'latin1');
        console.log('Using latin1 encoding for CSV file');
      } catch (error2) {
        try {
          // Try binary and convert
          const buffer = fs.readFileSync(csvFilePath);
          csvData = buffer.toString('utf8');
          console.log('Using buffer conversion for CSV file');
        } catch (error3) {
          console.error('Failed to read CSV file with any encoding:', error3.message);
          return;
        }
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

    // Log first record to verify structure
    console.log('First record structure:', Object.keys(records[0]));
    console.log('Sample record:', records[0]);

    // Process records in batches to avoid memory issues
    const batchSize = 500;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${batchNumber} (${batch.length} records)...`);

      try {
        await pool.query('BEGIN');

        for (const record of batch) {
          try {
            // Map CSV columns to database columns
            // Expected CSV columns: id, company_id, name, email, services
            const vendorData = {
              id: record.id ? parseInt(record.id) : null,
              company_id: record.company_id ? parseInt(record.company_id) : null,
              name: record.name || '',
              email: record.email || '',
              services: record.services || '',
              status: 'pending', // Default status
              created_by: 'csv-import',
              approved_by: null,
              phone: null // Not provided in CSV
            };

            // Validate required fields
            if (!vendorData.company_id || !vendorData.name || !vendorData.email) {
              console.warn(`Skipping invalid record: ${JSON.stringify(record)}`);
              errorCount++;
              continue;
            }

            // Insert vendor record
            const insertQuery = `
              INSERT INTO vendors (
                ${vendorData.id ? 'id,' : ''}
                company_id, 
                name, 
                email, 
                services, 
                status, 
                created_by, 
                approved_by,
                phone,
                created_at,
                updated_at
              ) VALUES (
                ${vendorData.id ? '$1,' : ''}
                ${vendorData.id ? '$2' : '$1'}, 
                ${vendorData.id ? '$3' : '$2'}, 
                ${vendorData.id ? '$4' : '$3'}, 
                ${vendorData.id ? '$5' : '$4'}, 
                ${vendorData.id ? '$6' : '$5'}, 
                ${vendorData.id ? '$7' : '$6'}, 
                ${vendorData.id ? '$8' : '$7'},
                ${vendorData.id ? '$9' : '$8'},
                NOW(),
                NOW()
              )
              ON CONFLICT (id) DO UPDATE SET
                company_id = EXCLUDED.company_id,
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                services = EXCLUDED.services,
                updated_at = NOW()
            `;

            const values = vendorData.id ? 
              [vendorData.id, vendorData.company_id, vendorData.name, vendorData.email, vendorData.services, vendorData.status, vendorData.created_by, vendorData.approved_by, vendorData.phone] :
              [vendorData.company_id, vendorData.name, vendorData.email, vendorData.services, vendorData.status, vendorData.created_by, vendorData.approved_by, vendorData.phone];

            await pool.query(insertQuery, values);
            processedCount++;

          } catch (recordError) {
            console.error(`Error processing record:`, record, recordError.message);
            errorCount++;
          }
        }

        await pool.query('COMMIT');
        console.log(`Batch ${batchNumber} completed. Total processed: ${processedCount}, Errors: ${errorCount}`);

      } catch (batchError) {
        await pool.query('ROLLBACK');
        console.error(`Batch ${batchNumber} failed:`, batchError.message);
        errorCount += batch.length;
      }
    }

    // Final count verification
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vendors');
    const totalVendors = parseInt(countResult.rows[0].total);

    console.log('\n=== VENDOR IMPORT SUMMARY ===');
    console.log(`Total records in CSV: ${records.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Total vendors in database: ${totalVendors}`);
    console.log('=====================================');

    if (processedCount > 0) {
      // Sample some imported vendors
      const sampleResult = await pool.query('SELECT * FROM vendors ORDER BY created_at DESC LIMIT 5');
      console.log('\nSample imported vendors:');
      sampleResult.rows.forEach((vendor, index) => {
        console.log(`${index + 1}. ${vendor.name} (Company ID: ${vendor.company_id}, Email: ${vendor.email})`);
      });
    }

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
bulkVendorImport().catch(console.error);