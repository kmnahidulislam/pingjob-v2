import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importToCorrectNeon() {
  console.log('Starting import to correct Neon database...');
  
  // Use the actual DATABASE_URL from environment
  const client = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // First, let's check current job count
    const countResult = await client.query('SELECT COUNT(*) FROM jobs');
    console.log(`Current job count: ${countResult.rows[0].count}`);

    // Read the jobs CSV file
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'jobs replit_1749150263370.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);

    // Clear existing jobs
    await client.query('DELETE FROM jobs');
    console.log('Cleared existing jobs');

    // Process jobs in batches
    const batchSize = 50;
    let processed = 0;
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).filter(line => line.trim());
      if (batch.length === 0) continue;

      const values = [];
      const placeholders = [];
      
      for (let j = 0; j < batch.length; j++) {
        const line = batch[j];
        const cols = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (cols.length < 5) continue; // Skip invalid rows
        
        const jobTitle = cols[0] || 'Software Engineer';
        const companyName = cols[1] || 'Tech Company';
        const location = cols[2] || 'Remote';
        const description = cols[3] || 'Join our team';
        const requirements = cols[4] || 'Experience required';
        
        // Find or create company
        let companyResult = await client.query(
          'SELECT id FROM companies WHERE name ILIKE $1 LIMIT 1',
          [companyName]
        );
        
        let companyId = 7; // Default to 3M Company
        if (companyResult.rows.length > 0) {
          companyId = companyResult.rows[0].id;
        }
        
        const offset = j * 12;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`);
        
        values.push(
          companyId,                    // company_id
          'admin-krupa',               // recruiter_id
          jobTitle,                    // title
          description,                 // description
          requirements,                // requirements
          location,                    // location
          'United States',             // country
          'full-time',                 // employment_type
          true,                        // is_active
          'open',                      // status
          new Date(),                  // created_at
          new Date()                   // updated_at
        );
      }
      
      if (values.length > 0) {
        const query = `
          INSERT INTO jobs (company_id, recruiter_id, title, description, requirements, location, country, employment_type, is_active, status, created_at, updated_at)
          VALUES ${placeholders.join(', ')}
          ON CONFLICT DO NOTHING
        `;
        
        await client.query(query, values);
        processed += batch.length;
        console.log(`Processed ${processed} jobs...`);
      }
    }

    // Final count
    const finalCount = await client.query('SELECT COUNT(*) FROM jobs');
    console.log(`Import complete! Total jobs: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await client.end();
  }
}

importToCorrectNeon();