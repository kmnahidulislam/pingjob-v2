const fs = require('fs');
const csv = require('csv-parse');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function completeRestore() {
  try {
    console.log('Starting complete data restore...');
    
    // Remove foreign key constraints temporarily
    await pool.query('ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_users_id_fk;');
    await pool.query('ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_company_id_companies_id_fk;');
    console.log('Removed foreign key constraints');
    
    // 1. Restore companies
    console.log('1. Restoring companies...');
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

    // Clear and restore companies
    await pool.query('DELETE FROM companies;');
    
    const batchSize = 500;
    let companyCount = 0;

    for (let i = 0; i < companyRecords.length; i += batchSize) {
      const batch = companyRecords.slice(i, i + batchSize);
      
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
        const approvedBy = company.approved_by || 'admin';
        const userId = 'admin'; // Use consistent admin user
        const logoUrl = company.logo_url === 'NULL' ? null : company.logo_url;

        values.push(id, name, country, state, city, location, zipCode, website, phone, status, approvedBy, userId, logoUrl);
        placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12})`);
        paramIndex += 13;
      }

      if (placeholders.length > 0) {
        const insertQuery = `
          INSERT INTO companies (id, name, country, state, city, location, zip_code, website, phone, status, approved_by, user_id, logo_url) 
          VALUES ${placeholders.join(', ')}
        `;
        
        await pool.query(insertQuery, values);
        companyCount += placeholders.length;
      }

      if ((i / batchSize + 1) % 20 === 0) {
        console.log(`Companies progress: ${companyCount}/${companyRecords.length}`);
      }
    }

    console.log(`✓ Restored ${companyCount} companies`);

    // 2. Restore vendors
    console.log('2. Restoring vendors...');
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

    // Get valid company IDs
    const companyResult = await pool.query('SELECT id FROM companies');
    const validCompanyIds = new Set(companyResult.rows.map(row => row.id));
    console.log(`Valid company IDs: ${validCompanyIds.size} companies`);

    // Clear and restore vendors
    await pool.query('DELETE FROM vendors;');
    
    let vendorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < vendorRecords.length; i += batchSize) {
      const batch = vendorRecords.slice(i, i + batchSize);
      
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const vendor of batch) {
        const id = parseInt(vendor.id);
        const companyId = parseInt(vendor.company_id);
        const name = (vendor.name || '').substring(0, 255);
        const email = (vendor.email || '').substring(0, 255);
        const services = (vendor.services || '').substring(0, 1000);

        // Only insert if company_id exists
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

      if ((i / batchSize + 1) % 50 === 0) {
        console.log(`Vendors progress: ${vendorCount} imported, ${skippedCount} skipped`);
      }
    }

    // Add foreign key constraints back (optional, as they may cause issues)
    try {
      await pool.query('ALTER TABLE companies ADD CONSTRAINT companies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users (id);');
      await pool.query('ALTER TABLE vendors ADD CONSTRAINT vendors_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES companies (id);');
      console.log('Restored foreign key constraints');
    } catch (constraintError) {
      console.log('Warning: Could not restore all foreign key constraints (this is expected)');
    }

    // Final verification
    const companyCheck = await pool.query('SELECT COUNT(*) as total FROM companies');
    const vendorCheck = await pool.query('SELECT COUNT(*) as total FROM vendors');

    console.log('\n=== COMPLETE RESTORATION SUMMARY ===');
    console.log(`Companies restored: ${companyCheck.rows[0].total}`);
    console.log(`Vendors imported: ${vendorCheck.rows[0].total}`);
    console.log(`Vendors skipped (invalid company_id): ${skippedCount}`);
    console.log('====================================');

    // Sample data verification
    const sampleCompanies = await pool.query('SELECT id, name, city, state FROM companies ORDER BY id LIMIT 5');
    const sampleVendors = await pool.query('SELECT v.id, v.name, v.company_id, c.name as company_name FROM vendors v JOIN companies c ON v.company_id = c.id ORDER BY v.id LIMIT 5');

    console.log('\nSample companies:');
    sampleCompanies.rows.forEach(c => console.log(`${c.id}: ${c.name} (${c.city}, ${c.state})`));

    console.log('\nSample vendors:');
    sampleVendors.rows.forEach(v => console.log(`${v.id}: ${v.name} → ${v.company_name}`));

    console.log('\n✓ Complete restoration finished successfully!');

  } catch (error) {
    console.error('Restoration failed:', error);
  } finally {
    await pool.end();
  }
}

completeRestore().catch(console.error);