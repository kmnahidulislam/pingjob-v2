import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function safeImport() {
  console.log('Starting safe company import...');
  
  let totalImported = 0;
  let batchData = [];
  const batchSize = 100; // Smaller batches for reliability
  
  return new Promise((resolve, reject) => {
    createReadStream('./attached_assets/Replit_1749131418658.csv')
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }))
      .on('data', async (data) => {
        try {
          const companyData = {
            id: parseInt(data.id) || 0,
            userId: (data.user_id && data.user_id !== 'NULL') ? data.user_id : 'admin-krupa',
            name: data.name || 'Unknown Company',
            industry: 'Not specified',
            size: '1-50',
            website: (data.website && data.website !== 'NULL') ? data.website : null,
            description: null,
            logoUrl: (data.logo_url && data.logo_url !== 'uploads/NULL' && data.logo_url !== 'NULL') ? data.logo_url : null,
            followers: 0,
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            zipCode: (data.zip_code && data.zip_code !== 'NULL') ? data.zip_code : null,
            location: data.location || `${data.city || ''}, ${data.state || ''}, ${data.country || ''}`,
            phone: (data.phone && data.phone !== 'NULL') ? data.phone : null,
            status: data.status || 'approved',
            approvedBy: (data.approved_by && data.approved_by !== 'NULL') ? data.approved_by : 'admin-krupa'
          };
          
          // Skip invalid records
          if (!companyData.id || !companyData.name || companyData.name === 'Unknown Company') {
            return;
          }
          
          batchData.push(companyData);
          
          // Process batch when it reaches the size limit
          if (batchData.length >= batchSize) {
            try {
              await db.insert(companies).values(batchData).onConflictDoNothing();
              totalImported += batchData.length;
              console.log(`Imported ${totalImported} companies...`);
              batchData = []; // Clear batch
            } catch (batchError) {
              console.error('Batch error, trying individual inserts:', batchError.message);
              // Try inserting individually if batch fails
              for (const company of batchData) {
                try {
                  await db.insert(companies).values(company).onConflictDoNothing();
                  totalImported++;
                } catch (individualError) {
                  console.error(`Failed to insert company ${company.id}: ${company.name}`);
                }
              }
              batchData = [];
            }
          }
        } catch (error) {
          console.error('Error processing record:', error.message);
        }
      })
      .on('end', async () => {
        // Process remaining batch
        if (batchData.length > 0) {
          try {
            await db.insert(companies).values(batchData).onConflictDoNothing();
            totalImported += batchData.length;
          } catch (finalBatchError) {
            console.error('Final batch error, trying individual inserts');
            for (const company of batchData) {
              try {
                await db.insert(companies).values(company).onConflictDoNothing();
                totalImported++;
              } catch (individualError) {
                console.error(`Failed to insert final company ${company.id}: ${company.name}`);
              }
            }
          }
        }
        
        console.log(`Successfully imported ${totalImported} companies`);
        resolve(totalImported);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

safeImport().then((count) => {
  console.log(`Import completed: ${count} companies imported`);
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});