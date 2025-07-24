import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: NEON_DATABASE_URL });

async function importCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('Starting companies import...');
    
    // Read CSV file
    const csvData = fs.readFileSync('./attached_assets/companies_port.csv', 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = lines[i].split(',');
        
        // Parse company data - adjust indices based on CSV structure
        const companyData = {
          name: values[1]?.replace(/"/g, '').trim() || '',
          industry: values[2]?.replace(/"/g, '').trim() || 'Technology',
          description: values[3]?.replace(/"/g, '').trim() || '',
          website: values[4]?.replace(/"/g, '').trim() || '',
          city: values[5]?.replace(/"/g, '').trim() || '',
          state: values[6]?.replace(/"/g, '').trim() || '',
          country: values[7]?.replace(/"/g, '').trim() || 'United States',
          size: '50-200',
          userId: 'admin-krupa',
          status: 'approved'
        };
        
        // Skip if missing required fields
        if (!companyData.name) {
          continue;
        }
        
        // Insert company
        const query = `
          INSERT INTO companies (
            user_id, name, industry, description, website, 
            city, state, country, size, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await client.query(query, [
          companyData.userId,
          companyData.name,
          companyData.industry,
          companyData.description,
          companyData.website,
          companyData.city,
          companyData.state,
          companyData.country,
          companyData.size,
          companyData.status
        ]);
        
        successCount++;
        
        if (successCount % 1000 === 0) {
          console.log(`Imported ${successCount} companies...`);
        }
        
      } catch (error) {
        console.error(`Error importing company at line ${i}:`, error.message);
        errorCount++;
      }
      
      totalProcessed++;
    }
    
    console.log(`\nCompanies import completed!`);
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
  }
}

// Run the import
importCompanies().catch(console.error);