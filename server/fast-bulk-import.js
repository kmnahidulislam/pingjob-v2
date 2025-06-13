import { storage } from './storage.ts';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function fastBulkImport() {
  console.log('Starting optimized bulk import...');
  
  try {
    const csvPath = '../attached_assets/Replit_1749782925286.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Total records in CSV: ${records.length}`);
    
    // Get current count
    const currentCompanies = await storage.getCompanies(50000);
    const startIndex = currentCompanies.length;
    const remainingRecords = records.slice(startIndex);
    
    console.log(`Current database: ${currentCompanies.length} companies`);
    console.log(`Remaining to import: ${remainingRecords.length} companies`);
    
    if (remainingRecords.length === 0) {
      console.log('All companies already imported!');
      return;
    }
    
    let imported = 0;
    let errors = 0;
    const batchSize = 100; // Much larger batches for speed
    
    // Process in large batches with optimized SQL
    for (let i = 0; i < remainingRecords.length; i += batchSize) {
      const batch = remainingRecords.slice(i, i + batchSize);
      
      try {
        // Prepare batch data
        const validCompanies = batch
          .filter(record => record.name?.trim())
          .map(record => ({
            name: record.name.trim(),
            location: record.location?.trim() || null,
            logoUrl: record.logo_url === 'logos/NULL' ? null : record.logo_url?.trim() || null,
            website: record.website?.trim() || null,
            phone: record.phone?.trim() || null,
            status: 'approved',
            approvedBy: 'admin-krupa',
            userId: 'admin-krupa'
          }));
        
        // Bulk insert using direct SQL for maximum speed
        if (validCompanies.length > 0) {
          await storage.bulkCreateCompanies(validCompanies);
          imported += validCompanies.length;
          
          console.log(`Progress: ${imported} imported (${startIndex + imported} total) - ${Math.round((imported / remainingRecords.length) * 100)}%`);
        }
        
      } catch (error) {
        errors++;
        console.error(`Batch error: ${error.message}`);
        
        // Fallback to individual inserts for this batch
        for (const record of batch) {
          try {
            if (!record.name?.trim()) continue;
            
            const company = {
              name: record.name.trim(),
              location: record.location?.trim() || null,
              logoUrl: record.logo_url === 'logos/NULL' ? null : record.logo_url?.trim() || null,
              website: record.website?.trim() || null,
              phone: record.phone?.trim() || null,
              status: 'approved',
              approvedBy: 'admin-krupa',
              userId: 'admin-krupa'
            };
            
            await storage.createCompany(company);
            imported++;
          } catch (individualError) {
            errors++;
          }
        }
      }
      
      // Minimal delay only every 10 batches
      if (i % (batchSize * 10) === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`\n=== FAST IMPORT COMPLETE ===`);
    console.log(`Imported: ${imported} new companies`);
    console.log(`Total in database: ${startIndex + imported}`);
    console.log(`Errors: ${errors}`);
    console.log(`Remaining: ${records.length - (startIndex + imported)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Fast import failed:', error);
    process.exit(1);
  }
}

fastBulkImport();