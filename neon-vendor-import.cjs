const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

// Use the same Neon connection as the application
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000
});

async function importVendorsToNeon() {
  try {
    console.log('Starting vendor import to Neon...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Neon connection verified');
    
    // Check current state
    const companyCount = await pool.query('SELECT COUNT(*) FROM companies');
    const vendorCount = await pool.query('SELECT COUNT(*) FROM vendors');
    console.log(`Current state: ${companyCount.rows[0].count} companies, ${vendorCount.rows[0].count} vendors`);
    
    // Load vendor CSV
    const vendorsData = fs.readFileSync('./attached_assets/Vendor_replit_1750258134470.csv', 'utf8');
    
    const vendorRecords = [];
    await new Promise((resolve, reject) => {
      csv.parse(vendorsData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else {
          vendorRecords.push(...data);
          resolve(data);
        }
      });
    });

    console.log(`Found ${vendorRecords.length} vendors in CSV`);
    
    // Get valid company IDs from Neon
    const companyResult = await pool.query('SELECT id FROM companies ORDER BY id');
    const validCompanyIds = new Set(companyResult.rows.map(row => row.id));
    console.log(`Valid company ID range: ${Math.min(...validCompanyIds)} - ${Math.max(...validCompanyIds)} (${validCompanyIds.size} total)`);

    // Clear existing vendors
    await pool.query('DELETE FROM vendors');
    console.log('✓ Cleared existing vendors');
    
    // Import vendors in batches
    const batchSize = 500;
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < vendorRecords.length; i += batchSize) {
      const batch = vendorRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const vendor of batch) {
        const id = parseInt(vendor.id);
        const companyId = parseInt(vendor.company_id);
        const name = (vendor.name || '').substring(0, 255);
        const email = (vendor.email || '').substring(0, 255);
        const services = (vendor.services || '').substring(0, 1000);

        // Only include vendors with valid company IDs
        if (id && companyId && name && email && validCompanyIds.has(companyId)) {
          values.push(id, companyId, name, email, services, 'pending');
          placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5})`);
          paramIndex += 6;
        } else {
          skippedCount++;
        }
      }

      if (placeholders.length > 0) {
        const insertQuery = `
          INSERT INTO vendors (id, company_id, name, email, services, status) 
          VALUES ${placeholders.join(', ')}
        `;
        
        await pool.query(insertQuery, values);
        importedCount += placeholders.length;
      }

      if (batchNumber % 25 === 0) {
        console.log(`Progress: ${importedCount} imported, ${skippedCount} skipped (${batchNumber}/${Math.ceil(vendorRecords.length / batchSize)} batches)`);
      }
    }

    // Final verification
    const finalVendorCount = await pool.query('SELECT COUNT(*) FROM vendors');
    const topVendorCompanies = await pool.query(`
      SELECT c.id, c.name, COUNT(v.id) as vendor_count
      FROM companies c
      JOIN vendors v ON c.id = v.company_id
      GROUP BY c.id, c.name
      ORDER BY vendor_count DESC
      LIMIT 5
    `);

    console.log('\n=== NEON VENDOR IMPORT COMPLETE ===');
    console.log(`Total vendors imported: ${finalVendorCount.rows[0].count}`);
    console.log(`Vendors skipped: ${skippedCount}`);
    console.log('=======================================');

    console.log('\nTop companies by vendor count:');
    topVendorCompanies.rows.forEach(company => {
      console.log(`  ${company.id}: ${company.name} - ${company.vendor_count} vendors`);
    });

    console.log('\n✅ Vendor import to Neon completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    await pool.end();
  }
}

importVendorsToNeon().catch(console.error);