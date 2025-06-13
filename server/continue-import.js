import { storage } from './storage.ts';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function continueImport() {
  console.log('Continuing company import...');
  
  try {
    const currentCompanies = await storage.getCompanies(50000);
    console.log(`Current companies in database: ${currentCompanies.length}`);
    
    const csvPath = '../attached_assets/Replit_1749782925286.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const startIndex = currentCompanies.length;
    const remainingRecords = records.slice(startIndex);
    
    console.log(`Importing ${remainingRecords.length} remaining records...`);
    
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < remainingRecords.length; i += 5) {
      const batch = remainingRecords.slice(i, i + 5);
      
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
          
          if (imported % 250 === 0) {
            console.log(`Imported ${imported} companies (${startIndex + imported} total)...`);
          }
          
        } catch (error) {
          errors++;
          if (errors <= 5) {
            console.error(`Error: ${error.message}`);
          }
        }
      }
      
      if (i % 25 === 0) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
    
    console.log(`Import session complete: ${imported} new companies imported`);
    console.log(`Total companies in database: ${startIndex + imported}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

continueImport();