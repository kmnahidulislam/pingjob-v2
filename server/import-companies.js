import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function importCompanies() {
  console.log('Starting company import...');
  
  const records = [];
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    delimiter: ','
  });

  // Read and parse CSV file
  createReadStream('../attached_assets/companies_port.csv')
    .pipe(parser)
    .on('data', (data) => {
      // Map CSV columns to database schema
      const companyData = {
        id: parseInt(data.id),
        userId: data.user_id || 'admin-krupa',
        name: data.name,
        industry: data.industry || 'Not specified',
        size: '1-50', // Default size since not in CSV
        website: data.website || null,
        description: null,
        logoUrl: data.logo_url || null,
        followers: 0,
        country: data.country,
        state: data.state,
        city: data.city,
        zipCode: data.zip_code || null,
        location: data.location || `${data.city}, ${data.state}, ${data.country}`,
        phone: data.phone || null,
        status: data.status || 'approved',
        approvedBy: data.approved_by || 'admin-krupa'
      };
      
      records.push(companyData);
    })
    .on('end', async () => {
      console.log(`Parsed ${records.length} companies from CSV`);
      
      try {
        // Clear existing companies first
        await db.delete(companies);
        console.log('Cleared existing companies');
        
        // Insert companies in batches of 1000
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await db.insert(companies).values(batch);
          console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);
        }
        
        console.log(`Successfully imported ${records.length} companies`);
        process.exit(0);
      } catch (error) {
        console.error('Error importing companies:', error);
        process.exit(1);
      }
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      process.exit(1);
    });
}

importCompanies();