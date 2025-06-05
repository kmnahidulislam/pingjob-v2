import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function completeImport() {
  console.log('Starting complete company import from CSV...');
  
  let totalProcessed = 0;
  let successfulImports = 0;
  let batch = [];
  const batchSize = 50; // Small batches for reliability
  
  return new Promise((resolve, reject) => {
    createReadStream('./attached_assets/Replit_1749131418658.csv')
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }))
      .on('data', async (row) => {
        totalProcessed++;
        
        // Basic validation
        const id = parseInt(row.id);
        if (!id || id <= 0 || !row.name || row.name === 'name') {
          return;
        }
        
        // Clean and prepare data
        const companyData = {
          id: id,
          userId: (row.user_id && row.user_id !== 'NULL') ? row.user_id.trim() : 'admin-krupa',
          name: row.name.trim().substring(0, 255),
          industry: 'Not specified',
          size: '1-50',
          website: (row.website && row.website !== 'NULL' && row.website.trim()) ? row.website.trim().substring(0, 255) : null,
          description: null,
          logoUrl: (row.logo_url && row.logo_url !== 'uploads/NULL' && row.logo_url !== 'NULL') ? row.logo_url.trim().substring(0, 255) : null,
          followers: 0,
          country: (row.country || '').trim().substring(0, 100),
          state: (row.state || '').trim().substring(0, 100),
          city: (row.city || '').trim().substring(0, 100),
          zipCode: (row.zip_code && row.zip_code !== 'NULL') ? row.zip_code.trim().substring(0, 20) : null,
          location: (row.location || `${row.city || ''}, ${row.state || ''}, ${row.country || ''}`).trim().substring(0, 255),
          phone: (row.phone && row.phone !== 'NULL') ? row.phone.trim().substring(0, 50) : null,
          status: (row.status || 'approved').trim(),
          approvedBy: (row.approved_by && row.approved_by !== 'NULL') ? row.approved_by.trim() : 'admin-krupa'
        };
        
        batch.push(companyData);
        
        if (batch.length >= batchSize) {
          await processBatch();
        }
      })
      .on('end', async () => {
        if (batch.length > 0) {
          await processBatch();
        }
        
        console.log(`Import completed: ${successfulImports}/${totalProcessed} companies imported successfully`);
        resolve(successfulImports);
      })
      .on('error', reject);
    
    async function processBatch() {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      try {
        await db.insert(companies).values(currentBatch).onConflictDoNothing();
        successfulImports += currentBatch.length;
        
        if (successfulImports % 2000 === 0) {
          console.log(`Imported ${successfulImports} companies...`);
        }
      } catch (error) {
        console.error(`Batch import error, trying individual inserts...`);
        
        // Fall back to individual inserts
        for (const company of currentBatch) {
          try {
            await db.insert(companies).values(company).onConflictDoNothing();
            successfulImports++;
          } catch (individualError) {
            console.error(`Failed to import: ${company.name}`);
          }
        }
      }
    }
  });
}

completeImport().then((count) => {
  console.log(`Successfully imported ${count} companies from CSV file`);
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});