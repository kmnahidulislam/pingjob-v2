import { storage } from './storage.ts';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function fullImport() {
  console.log('Starting full import of all companies...');
  
  try {
    const csvPath = '../attached_assets/Replit_1749782925286.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Total records to import: ${records.length}`);
    
    // Get current companies and start from where we left off
    const currentCompanies = await storage.getCompanies(50000);
    const startIndex = currentCompanies.length;
    const remainingRecords = records.slice(startIndex);
    
    console.log(`Current database has ${currentCompanies.length} companies`);
    console.log(`Importing ${remainingRecords.length} remaining records...`);
    
    let imported = 0;
    let errors = 0;
    
    // Process in very small batches with minimal delays
    for (let i = 0; i < remainingRecords.length; i += 3) {
      const batch = remainingRecords.slice(i, i + 3);
      
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
          
          if (imported % 100 === 0) {
            console.log(`Progress: ${imported} imported (${startIndex + imported} total)`);
          }
          
        } catch (error) {
          errors++;
          if (errors <= 3) {
            console.error(`Error: ${error.message}`);
          }
        }
      }
      
      // Minimal delay every 15 batches
      if (i % 15 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`\nFull import complete!`);
    console.log(`Imported: ${imported} new companies`);
    console.log(`Total in database: ${startIndex + imported}`);
    console.log(`Errors: ${errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Full import failed:', error);
    process.exit(1);
  }
}

fullImport();