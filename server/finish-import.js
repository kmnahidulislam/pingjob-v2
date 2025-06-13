import { storage } from './storage.ts';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function finishImport() {
  console.log('Finishing complete import of all remaining companies...');
  
  try {
    const csvPath = '../attached_assets/Replit_1749782925286.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Total records in CSV: ${records.length}`);
    
    const currentCompanies = await storage.getCompanies(50000);
    const startIndex = currentCompanies.length;
    const remainingRecords = records.slice(startIndex);
    
    console.log(`Current database: ${currentCompanies.length} companies`);
    console.log(`Remaining to import: ${remainingRecords.length} companies`);
    
    let imported = 0;
    let errors = 0;
    
    // Aggressive processing in tiny batches for maximum speed
    for (let i = 0; i < remainingRecords.length; i += 2) {
      const batch = remainingRecords.slice(i, i + 2);
      
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
          
          if (imported % 50 === 0) {
            console.log(`Progress: ${imported} imported (${startIndex + imported} total)`);
          }
          
        } catch (error) {
          errors++;
          if (errors <= 2) {
            console.error(`Error: ${error.message}`);
          }
        }
      }
      
      // Minimal delay every 10 batches
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }
    
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Imported: ${imported} new companies`);
    console.log(`Total in database: ${startIndex + imported}`);
    console.log(`Errors: ${errors}`);
    console.log(`Target: ${records.length} (${records.length - (startIndex + imported)} remaining)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

finishImport();