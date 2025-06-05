import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function directNeonImport() {
  console.log('Starting direct import to Neon database...');
  
  const client = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check current job count
    const countResult = await client.query('SELECT COUNT(*) FROM jobs');
    console.log(`Current job count: ${countResult.rows[0].count}`);

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'jobs replit_1749150263370.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log(`Found ${lines.length - 1} job records in CSV`);

    // Clear existing jobs to start fresh
    await client.query('DELETE FROM jobs');
    console.log('Cleared existing jobs');

    // Process jobs in smaller batches
    const batchSize = 20;
    let inserted = 0;
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      
      for (const line of batch) {
        try {
          const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (cols.length < 4) continue;
          
          const jobTitle = cols[0] || 'Software Engineer';
          const companyName = cols[1] || 'Tech Company';
          const location = cols[2] || 'Remote';
          const description = cols[3] || 'Join our team';
          const requirements = cols[4] || 'Experience required';
          
          // Find existing company or use default
          let companyResult = await client.query(
            'SELECT id FROM companies WHERE name ILIKE $1 LIMIT 1',
            [companyName]
          );
          
          let companyId = 7; // Default company
          if (companyResult.rows.length > 0) {
            companyId = companyResult.rows[0].id;
          }
          
          // Insert job
          await client.query(`
            INSERT INTO jobs (
              company_id, recruiter_id, title, description, requirements, 
              location, country, employment_type, is_active, status, 
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            companyId,
            'admin-krupa',
            jobTitle.substring(0, 200),
            description.substring(0, 2000),
            requirements.substring(0, 1000),
            location.substring(0, 100),
            'United States',
            'full-time',
            true,
            'open',
            new Date(),
            new Date()
          ]);
          
          inserted++;
          
        } catch (error) {
          console.error(`Error inserting job ${i}:`, error.message);
        }
      }
      
      console.log(`Processed ${Math.min(i + batchSize - 1, lines.length - 1)}/${lines.length - 1} jobs...`);
    }

    // Final verification
    const finalCount = await client.query('SELECT COUNT(*) FROM jobs');
    console.log(`Import complete! Jobs inserted: ${inserted}, Total in DB: ${finalCount.rows[0].count}`);
    
    // Show sample jobs
    const sampleJobs = await client.query('SELECT id, title, description FROM jobs LIMIT 5');
    console.log('Sample jobs:');
    sampleJobs.rows.forEach(job => {
      console.log(`- ${job.id}: ${job.title}`);
    });
    
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await client.end();
  }
}

directNeonImport();