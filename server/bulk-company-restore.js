import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function bulkCompanyRestore() {
  try {
    console.log('Starting bulk company restore from authentic CSV data...');
    
    // Read the authentic CSV data
    const csvData = fs.readFileSync('attached_assets/companies_port.csv', 'utf8');
    const lines = csvData.split('\n');
    
    console.log(`Found ${lines.length - 1} companies in CSV file`);
    
    const client = await pool.connect();
    let processed = 0;
    let imported = 0;
    
    // Process in smaller batches to avoid conflicts
    const batchSize = 50;
    const companies = [];
    
    // Parse all companies first
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length >= 7) {
        const id = parseInt(values[0]);
        if (isNaN(id)) continue;
        
        companies.push({
          id: id,
          user_id: 'admin-krupa',
          name: values[1]?.replace(/"/g, '') || '',
          industry: 'Not specified',
          size: '1-50',
          website: values[7]?.replace(/"/g, '') || '',
          description: null,
          logo_url: values[12]?.replace(/"/g, '') || null,
          followers: 0,
          country: values[2]?.replace(/"/g, '') || 'United States',
          state: values[3]?.replace(/"/g, '') || '',
          city: values[4]?.replace(/"/g, '') || '',
          zip_code: values[6]?.replace(/"/g, '') || '',
          location: values[5]?.replace(/"/g, '') || '',
          phone: values[8]?.replace(/"/g, '') || null,
          status: 'approved',
          approved_by: 'admin-krupa'
        });
      }
    }
    
    console.log(`Parsed ${companies.length} valid companies`);
    
    // Insert in batches
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      try {
        await client.query('BEGIN');
        
        for (const company of batch) {
          await client.query(`
            INSERT INTO companies (
              id, user_id, name, industry, size, website, description, 
              logo_url, followers, country, state, city, zip_code, 
              location, phone, status, approved_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              country = EXCLUDED.country,
              state = EXCLUDED.state,
              city = EXCLUDED.city,
              location = EXCLUDED.location,
              zip_code = EXCLUDED.zip_code,
              website = EXCLUDED.website,
              phone = EXCLUDED.phone,
              updated_at = NOW()
          `, [
            company.id, company.user_id, company.name, company.industry, 
            company.size, company.website, company.description, company.logo_url,
            company.followers, company.country, company.state, company.city,
            company.zip_code, company.location, company.phone, company.status,
            company.approved_by
          ]);
          imported++;
        }
        
        await client.query('COMMIT');
        processed += batch.length;
        
        if (processed % 500 === 0) {
          console.log(`Processed ${processed} companies...`);
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error in batch starting at ${i}:`, error.message);
      }
    }
    
    client.release();
    
    // Verify final count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM companies');
    console.log(`Bulk restore completed. Total companies in database: ${countResult.rows[0].total}`);
    console.log(`Successfully imported: ${imported} companies`);
    
    // Test Fifth Third Bancorp specifically
    const fifthThirdResult = await pool.query("SELECT id, name FROM companies WHERE name ILIKE '%fifth third%'");
    console.log('Fifth Third Bancorp verification:', fifthThirdResult.rows);
    
  } catch (error) {
    console.error('Error in bulk company restore:', error);
  } finally {
    await pool.end();
  }
}

bulkCompanyRestore();