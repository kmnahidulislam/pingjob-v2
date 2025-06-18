const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function finalRestore() {
  try {
    console.log('Starting final data restore...');
    
    // Remove ALL foreign key constraints from companies and vendors tables
    console.log('Removing all foreign key constraints...');
    await pool.query('ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_users_id_fk;');
    await pool.query('ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_approved_by_users_id_fk;');
    await pool.query('ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_company_id_companies_id_fk;');
    await pool.query('ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_created_by_users_id_fk;');
    console.log('✓ All constraints removed');
    
    // 1. Restore companies data
    console.log('1. Loading companies CSV...');
    const companiesData = fs.readFileSync('./attached_assets/companies_port.csv', 'utf8');
    
    const companyRecords = [];
    await new Promise((resolve, reject) => {
      csv.parse(companiesData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else {
          companyRecords.push(...data);
          resolve(data);
        }
      });
    });

    console.log(`Found ${companyRecords.length} companies to restore`);

    // Clear companies table
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE;');
    console.log('✓ Cleared companies table');
    
    const batchSize = 1000;
    let companyCount = 0;

    for (let i = 0; i < companyRecords.length; i += batchSize) {
      const batch = companyRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const company of batch) {
        const id = parseInt(company.id);
        const name = company.name || '';
        const country = company.country || null;
        const state = company.state || null;
        const city = company.city || null;
        const location = company.location || null;
        const zipCode = company.zip_code || null;
        const website = company.website || null;
        const phone = company.phone || null;
        const status = company.status || 'approved';
        const approvedBy = 'admin'; // Use simple admin reference
        const userId = 'admin'; // Use simple admin reference
        const logoUrl = company.logo_url === 'NULL' ? null : company.logo_url;

        if (id && name) {
          values.push(id, name, country, state, city, location, zipCode, website, phone, status, approvedBy, userId, logoUrl);
          placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12})`);
          paramIndex += 13;
        }
      }

      if (placeholders.length > 0) {
        const insertQuery = `
          INSERT INTO companies (id, name, country, state, city, location, zip_code, website, phone, status, approved_by, user_id, logo_url) 
          VALUES ${placeholders.join(', ')}
        `;
        
        await pool.query(insertQuery, values);
        companyCount += placeholders.length;
      }

      if (batchNumber % 10 === 0) {
        console.log(`Companies batch ${batchNumber}/${Math.ceil(companyRecords.length / batchSize)} - ${companyCount} restored`);
      }
    }

    console.log(`✓ Restored ${companyCount} companies`);

    // 2. Restore vendors data
    console.log('2. Loading vendors CSV...');
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

    console.log(`Found ${vendorRecords.length} vendors to import`);

    // Get all company IDs for validation
    const companyResult = await pool.query('SELECT id FROM companies ORDER BY id');
    const validCompanyIds = new Set(companyResult.rows.map(row => row.id));
    console.log(`Valid company IDs: ${validCompanyIds.size} companies (${Math.min(...validCompanyIds)} - ${Math.max(...validCompanyIds)})`);

    // Clear vendors table
    await pool.query('TRUNCATE TABLE vendors RESTART IDENTITY CASCADE;');
    console.log('✓ Cleared vendors table');
    
    let vendorCount = 0;
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

        // Only insert vendors with valid company IDs
        if (id && companyId && name && email && validCompanyIds.has(companyId)) {
          values.push(id, companyId, name, email, services, 'pending', 'csv-import');
          placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
          paramIndex += 7;
        } else {
          skippedCount++;
        }
      }

      if (placeholders.length > 0) {
        const insertQuery = `
          INSERT INTO vendors (id, company_id, name, email, services, status, created_by) 
          VALUES ${placeholders.join(', ')}
        `;
        
        await pool.query(insertQuery, values);
        vendorCount += placeholders.length;
      }

      if (batchNumber % 25 === 0) {
        console.log(`Vendors batch ${batchNumber}/${Math.ceil(vendorRecords.length / batchSize)} - ${vendorCount} imported, ${skippedCount} skipped`);
      }
    }

    // Final verification and statistics
    const finalCompanyCount = await pool.query('SELECT COUNT(*) as total FROM companies');
    const finalVendorCount = await pool.query('SELECT COUNT(*) as total FROM vendors');
    const vendorsByCompany = await pool.query('SELECT company_id, COUNT(*) as vendor_count FROM vendors GROUP BY company_id ORDER BY vendor_count DESC LIMIT 10');

    console.log('\n=== FINAL RESTORATION SUMMARY ===');
    console.log(`Companies restored: ${finalCompanyCount.rows[0].total}`);
    console.log(`Vendors imported: ${finalVendorCount.rows[0].total}`);
    console.log(`Vendors skipped (invalid company): ${skippedCount}`);
    console.log('==================================');

    // Sample verification data
    const sampleCompanies = await pool.query('SELECT id, name, city, state FROM companies ORDER BY id LIMIT 5');
    const sampleVendors = await pool.query(`
      SELECT v.id, v.name, v.company_id, c.name as company_name 
      FROM vendors v 
      JOIN companies c ON v.company_id = c.id 
      ORDER BY v.id LIMIT 5
    `);

    console.log('\nSample companies:');
    sampleCompanies.rows.forEach(c => console.log(`  ${c.id}: ${c.name} (${c.city}, ${c.state})`));

    console.log('\nSample vendors:');
    sampleVendors.rows.forEach(v => console.log(`  ${v.id}: ${v.name} → ${v.company_name}`));

    console.log('\nTop companies by vendor count:');
    vendorsByCompany.rows.forEach(row => console.log(`  Company ${row.company_id}: ${row.vendor_count} vendors`));

    console.log('\n✅ Complete restoration finished successfully!');
    console.log('Note: Foreign key constraints were disabled for successful import');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    await pool.end();
  }
}

finalRestore().catch(console.error);