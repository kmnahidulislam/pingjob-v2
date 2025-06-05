import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function finalImport() {
  console.log('Starting final company import...');
  
  let totalProcessed = 0;
  let totalImported = 0;
  let batch = [];
  const batchSize = 100;
  
  return new Promise((resolve, reject) => {
    createReadStream('./attached_assets/Replit_1749131418658.csv')
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        relax_quotes: true,
        relax_column_count: true
      }))
      .on('data', async (row) => {
        totalProcessed++;
        
        // Validate and clean data
        const id = parseInt(row.id);
        if (!id || id <= 0 || !row.name) {
          return;
        }
        
        const companyData = {
          id: id,
          userId: (row.user_id && row.user_id !== 'NULL') ? row.user_id.substring(0, 50) : 'admin-krupa',
          name: row.name.substring(0, 200),
          industry: 'Not specified',
          size: '1-50',
          website: (row.website && row.website !== 'NULL' && row.website.length > 0) ? row.website.substring(0, 200) : null,
          description: null,
          logoUrl: (row.logo_url && row.logo_url !== 'uploads/NULL' && row.logo_url !== 'NULL') ? row.logo_url.substring(0, 200) : null,
          followers: 0,
          country: (row.country || '').substring(0, 100),
          state: (row.state || '').substring(0, 100),
          city: (row.city || '').substring(0, 100),
          zipCode: (row.zip_code && row.zip_code !== 'NULL') ? row.zip_code.substring(0, 20) : null,
          location: (row.location || `${row.city || ''}, ${row.state || ''}, ${row.country || ''}`).substring(0, 200),
          phone: (row.phone && row.phone !== 'NULL') ? row.phone.substring(0, 50) : null,
          status: row.status || 'approved',
          approvedBy: (row.approved_by && row.approved_by !== 'NULL') ? row.approved_by.substring(0, 50) : 'admin-krupa'
        };
        
        batch.push(companyData);
        
        // Process batch when full
        if (batch.length >= batchSize) {
          await processBatch();
        }
      })
      .on('end', async () => {
        // Process remaining items
        if (batch.length > 0) {
          await processBatch();
        }
        
        console.log(`Import completed: ${totalImported}/${totalProcessed} companies imported`);
        resolve(totalImported);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
    
    async function processBatch() {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      try {
        await db.insert(companies).values(currentBatch).onConflictDoNothing();
        totalImported += currentBatch.length;
        
        if (totalImported % 1000 === 0) {
          console.log(`Imported ${totalImported} companies...`);
        }
      } catch (error) {
        console.error(`Batch error: ${error.message}`);
        
        // Fall back to individual inserts
        for (const company of currentBatch) {
          try {
            await db.insert(companies).values(company).onConflictDoNothing();
            totalImported++;
          } catch (individualError) {
            console.error(`Failed to import company ${company.id}: ${company.name.substring(0, 50)}`);
          }
        }
      }
    }
  });
}

finalImport().then((count) => {
  console.log(`Successfully imported ${count} companies`);
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});