import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function addNatWest() {
  const pool = new Pool({ connectionString: NEON_DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Adding NatWest to database...');
    
    // Add NatWest specifically from the CSV data
    const insertQuery = `
      INSERT INTO companies (
        id, user_id, name, industry, size, website, description, 
        logo_url, followers, country, state, city, zip_code, location, phone,
        status, approved_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        website = EXCLUDED.website,
        logo_url = EXCLUDED.logo_url,
        country = EXCLUDED.country,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        zip_code = EXCLUDED.zip_code,
        location = EXCLUDED.location,
        phone = EXCLUDED.phone,
        status = EXCLUDED.status,
        approved_by = EXCLUDED.approved_by,
        updated_at = NOW()
    `;
    
    const natwestData = [
      6656, // id
      'admin-krupa', // user_id
      'NatWest Markets Securities Inc', // name
      'Financial Services', // industry
      '1000+', // size
      'www.NatWest.us', // website
      'Leading financial services provider', // description
      'uploads/Natwest.jfif', // logo_url
      0, // followers
      'United States', // country
      'Connecticut', // state
      'Stamford', // city
      '6901', // zip_code
      '600 Washington Blvd', // location
      '(203) 897-2700', // phone
      'approved', // status
      'admin-krupa' // approved_by
    ];
    
    await client.query(insertQuery, natwestData);
    console.log('NatWest added successfully');
    
    // Verify NatWest exists
    const verification = await client.query("SELECT id, name, status FROM companies WHERE id = 6656");
    console.log('Verification:', verification.rows);
    
    // Check total companies
    const count = await client.query('SELECT COUNT(*) as count FROM companies');
    console.log(`Total companies in database: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('Error adding NatWest:', error);
  } finally {
    client.release();
  }
}

addNatWest().catch(console.error);