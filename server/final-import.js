import { storage } from './storage.ts';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function finalImport() {
  console.log('Starting final import of complete dataset...');
  
  try {
    const csvPath = '../attached_assets/Replit_1749782925286.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Loaded ${records.length} records from CSV`);
    
    let imported = 0;
    let errors = 0;
    
    // Process in smaller batches with error recovery
    for (let i = 0; i < records.length; i += 25) {
      const batch = records.slice(i, i + 25);
      
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
          
          if (imported % 1000 === 0) {
            console.log(`Imported ${imported} companies...`);
          }
          
        } catch (error) {
          errors++;
          if (errors <= 5) {
            console.error(`Error: ${error.message}`);
          }
        }
      }
      
      // Prevent timeout with small delay every 100 records
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`\nImport complete: ${imported} companies imported, ${errors} errors`);
    
    const verification = await storage.getCompanies(100);
    console.log(`Database contains ${verification.length} companies`);
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

finalImport();