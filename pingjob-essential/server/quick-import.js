import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function quickImport() {
  console.log('Starting quick company import...');
  
  const records = [];
  let count = 0;
  
  return new Promise((resolve, reject) => {
    createReadStream('./attached_assets/Replit_1749131418658.csv')
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ','
      }))
      .on('data', async (data) => {
        try {
          const companyData = {
            id: parseInt(data.id),
            userId: data.user_id || 'admin-krupa',
            name: data.name,
            industry: 'Not specified',
            size: '1-50',
            website: data.website === 'NULL' ? null : data.website,
            description: null,
            logoUrl: data.logo_url === 'uploads/NULL' ? null : data.logo_url,
            followers: 0,
            country: data.country,
            state: data.state,
            city: data.city,
            zipCode: data.zip_code === 'NULL' ? null : data.zip_code,
            location: data.location || `${data.city}, ${data.state}, ${data.country}`,
            phone: data.phone === 'NULL' ? null : data.phone,
            status: data.status || 'approved',
            approvedBy: data.approved_by || 'admin-krupa'
          };
          
          // Insert immediately to avoid memory issues
          await db.insert(companies).values(companyData).onConflictDoNothing();
          count++;
          
          if (count % 1000 === 0) {
            console.log(`Imported ${count} companies...`);
          }
        } catch (error) {
          console.error('Error importing record:', error);
        }
      })
      .on('end', () => {
        console.log(`Successfully imported ${count} companies`);
        resolve(count);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

quickImport().then(() => {
  console.log('Import completed');
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});