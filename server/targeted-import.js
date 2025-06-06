const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function targetedImport() {
  try {
    console.log('Starting targeted import for missing companies...');
    
    // Read CSV data
    const csvData = fs.readFileSync('attached_assets/companies_port.csv', 'utf8');
    const lines = csvData.split('\n');
    
    // Skip header line
    const companies = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length >= 7) {
        const id = parseInt(values[0]);
        const name = values[1]?.replace(/"/g, '') || '';
        
        // Target specific companies including Fifth Third Bancorp
        if (name.toLowerCase().includes('fifth third') || 
            name.toLowerCase().includes('bancorp') ||
            name.toLowerCase().includes('bank') ||
            name.toLowerCase().includes('financial')) {
          
          companies.push({
            id: id,
            name: name,
            country: values[2]?.replace(/"/g, '') || 'United States',
            state: values[3]?.replace(/"/g, '') || '',
            city: values[4]?.replace(/"/g, '') || '',
            location: values[5]?.replace(/"/g, '') || '',
            zipCode: values[6]?.replace(/"/g, '') || '',
            website: values[7]?.replace(/"/g, '') || '',
            phone: values[8]?.replace(/"/g, '') || null,
            status: 'approved',
            approvedBy: 'admin-krupa',
            userId: 'admin-krupa'
          });
        }
      }
    }
    
    console.log(`Found ${companies.length} target companies to import`);
    
    // Insert companies in batches
    const client = await pool.connect();
    let imported = 0;
    
    for (const company of companies) {
      try {
        await client.query(`
          INSERT INTO companies (
            id, "userId", name, industry, size, website, description, 
            "logoUrl", followers, country, state, city, "zipCode", 
            location, phone, status, "approvedBy", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            state = EXCLUDED.state,
            city = EXCLUDED.city,
            location = EXCLUDED.location,
            "zipCode" = EXCLUDED."zipCode",
            website = EXCLUDED.website,
            phone = EXCLUDED.phone,
            "updatedAt" = NOW()
        `, [
          company.id,
          company.userId,
          company.name,
          'Financial Services',
          '1-50',
          company.website,
          null,
          null,
          0,
          company.country,
          company.state,
          company.city,
          company.zipCode,
          company.location,
          company.phone,
          company.status,
          company.approvedBy
        ]);
        
        imported++;
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} companies`);
        }
        
      } catch (error) {
        console.error(`Error importing company ${company.name}:`, error.message);
      }
    }
    
    client.release();
    console.log(`Targeted import completed. Imported ${imported} companies.`);
    
    // Verify Fifth Third Bancorp was imported
    const result = await pool.query("SELECT id, name FROM companies WHERE name ILIKE '%fifth third%'");
    console.log('Fifth Third Bancorp verification:', result.rows);
    
  } catch (error) {
    console.error('Error in targeted import:', error);
  } finally {
    await pool.end();
  }
}

targetedImport();