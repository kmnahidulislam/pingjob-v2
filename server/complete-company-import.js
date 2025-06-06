import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function importAllCompanies() {
  const pool = new Pool({ connectionString: NEON_DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Starting complete company import...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '../attached_assets/companies_port.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} companies to import`);
    
    // Process in batches to avoid memory issues
    const batchSize = 100;
    let imported = 0;
    let updated = 0;
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      
      let paramIndex = 1;
      
      for (const line of batch) {
        if (!line.trim()) continue;
        
        const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
        
        if (fields.length < 7) continue;
        
        const [id, name, country, state, city, location, zipCode, website, phone, status, approvedBy, userId, logoUrl] = fields;
        
        // Clean and validate data
        const cleanName = name || 'Unknown Company';
        const cleanCountry = country || 'Unknown';
        const cleanState = state || '';
        const cleanCity = city || '';
        const cleanWebsite = website && website !== 'NULL' ? website : null;
        const cleanPhone = phone && phone !== 'NULL' ? phone : null;
        const cleanLogoUrl = logoUrl && logoUrl !== 'NULL' ? `uploads/${logoUrl}` : null;
        
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14})`);
        
        values.push(
          parseInt(id) || i,
          'admin-krupa', // userId
          cleanName,
          'Not specified', // industry
          '1-50', // size
          cleanWebsite,
          null, // description
          cleanLogoUrl,
          0, // followers
          cleanCountry,
          cleanState,
          cleanCity,
          zipCode || '',
          location || '',
          cleanPhone
        );
        
        paramIndex += 15;
      }
      
      if (values.length > 0) {
        const query = `
          INSERT INTO companies (
            id, user_id, name, industry, size, website, description, 
            logo_url, followers, country, state, city, zip_code, location, phone
          ) VALUES ${placeholders.join(', ')}
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            state = EXCLUDED.state,
            city = EXCLUDED.city,
            location = EXCLUDED.location,
            zip_code = EXCLUDED.zip_code,
            website = EXCLUDED.website,
            phone = EXCLUDED.phone,
            logo_url = EXCLUDED.logo_url,
            updated_at = NOW()
        `;
        
        try {
          const result = await client.query(query, values);
          imported += result.rowCount;
          console.log(`Batch ${Math.ceil(i/batchSize)}: Processed ${batch.length} companies`);
        } catch (error) {
          console.error(`Error in batch ${Math.ceil(i/batchSize)}:`, error.message);
          continue;
        }
      }
    }
    
    // Update all companies to approved status
    await client.query(`
      UPDATE companies 
      SET status = 'approved', approved_by = 'admin-krupa', updated_at = NOW() 
      WHERE status IS NULL OR status != 'approved'
    `);
    
    const finalCount = await client.query('SELECT COUNT(*) as count FROM companies');
    console.log(`Import complete. Total companies in database: ${finalCount.rows[0].count}`);
    
    // Verify NatWest exists
    const natwestCheck = await client.query("SELECT id, name FROM companies WHERE LOWER(name) LIKE '%natwest%'");
    console.log('NatWest verification:', natwestCheck.rows);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
  }
}

importAllCompanies().catch(console.error);