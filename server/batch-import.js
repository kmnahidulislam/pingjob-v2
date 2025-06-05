import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function batchImport() {
  console.log('Starting batch company import...');
  
  const records = [];
  let processed = 0;
  let imported = 0;
  
  return new Promise((resolve, reject) => {
    createReadStream('./attached_assets/Replit_1749131418658.csv')
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"'
      }))
      .on('data', (data) => {
        processed++;
        
        // Only process valid records
        if (!data.id || !data.name || parseInt(data.id) <= 0) {
          return;
        }
        
        const companyData = {
          id: parseInt(data.id),
          userId: (data.user_id && data.user_id !== 'NULL') ? data.user_id : 'admin-krupa',
          name: data.name.substring(0, 255), // Limit name length
          industry: 'Not specified',
          size: '1-50',
          website: (data.website && data.website !== 'NULL') ? data.website.substring(0, 255) : null,
          description: null,
          logoUrl: (data.logo_url && data.logo_url !== 'uploads/NULL' && data.logo_url !== 'NULL') ? data.logo_url.substring(0, 255) : null,
          followers: 0,
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          zipCode: (data.zip_code && data.zip_code !== 'NULL') ? data.zip_code : null,
          location: (data.location || `${data.city || ''}, ${data.state || ''}, ${data.country || ''}`).substring(0, 255),
          phone: (data.phone && data.phone !== 'NULL') ? data.phone : null,
          status: data.status || 'approved',
          approvedBy: (data.approved_by && data.approved_by !== 'NULL') ? data.approved_by : 'admin-krupa'
        };
        
        records.push(companyData);
        
        // Process in batches of 50 for faster processing
        if (records.length >= 50) {
          processNextBatch();
        }
      })
      .on('end', () => {
        // Process remaining records
        if (records.length > 0) {
          processRemainingBatch().then(() => {
            console.log(`Import completed: ${imported}/${processed} companies imported`);
            resolve(imported);
          });
        } else {
          console.log(`Import completed: ${imported}/${processed} companies imported`);
          resolve(imported);
        }
      })
      .on('error', reject);
    
    async function processNextBatch() {
      if (records.length === 0) return;
      
      const batch = records.splice(0, 50);
      try {
        await db.insert(companies).values(batch).onConflictDoNothing();
        imported += batch.length;
        
        if (imported % 500 === 0) {
          console.log(`Imported ${imported} companies...`);
        }
      } catch (error) {
        console.error(`Batch import error: ${error.message}`);
        // Try individual inserts for failed batch
        for (const company of batch) {
          try {
            await db.insert(companies).values(company).onConflictDoNothing();
            imported++;
          } catch (indError) {
            console.error(`Failed to import company ${company.id}: ${company.name}`);
          }
        }
      }
    }
    
    async function processRemainingBatch() {
      while (records.length > 0) {
        await processNextBatch();
      }
    }
  });
}

batchImport().then((count) => {
  console.log(`Final result: ${count} companies imported successfully`);
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});