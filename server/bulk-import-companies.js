import { storage } from './storage.ts';
import { parse } from 'csv-parse';
import fs from 'fs';

async function bulkImportCompanies() {
  console.log('Starting bulk companies import...');
  
  try {
    const csvFilePath = '../attached_assets/Replit_1749782925286.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    console.log('Parsing CSV data...');
    const records = [];
    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    for await (const record of parser) {
      records.push(record);
    }
    
    console.log(`Parsed ${records.length} companies from CSV`);
    
    // Check how many companies already exist
    const existingCompanies = await storage.getCompanies(1000);
    console.log(`Current companies in database: ${existingCompanies.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    let batchSize = 50; // Smaller batches for reliability
    
    // Process all records
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(records.length/batchSize);
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} companies)`);
      
      for (const record of batch) {
        try {
          // Skip if company name is empty
          if (!record.name || record.name.trim() === '') {
            skipCount++;
            continue;
          }
          
          // Map CSV fields to company data
          const companyData = {
            name: record.name.trim(),
            location: record.location?.trim() || null,
            logoUrl: (record.logo_url === 'logos/NULL' || !record.logo_url) ? null : record.logo_url.trim(),
            website: record.website?.trim() || null,
            phone: record.phone?.trim() || null,
            status: record.status?.trim() || 'approved',
            approvedBy: record.approved_by?.trim() || 'admin-krupa',
            userId: record.user_id?.trim() || 'admin-krupa'
          };
          
          await storage.createCompany(companyData);
          successCount++;
          
        } catch (error) {
          errorCount++;
          if (errorCount <= 10) {
            console.error(`Error importing ${record.name}: ${error.message}`);
          }
        }
      }
      
      // Progress update every 20 batches
      if (batchNum % 20 === 0) {
        console.log(`Progress: ${successCount} imported, ${errorCount} errors, ${skipCount} skipped`);
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Total records processed: ${records.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped (empty names): ${skipCount}`);
    
    // Final verification
    const finalCompanies = await storage.getCompanies(100);
    console.log(`\nDatabase verification: ${finalCompanies.length} companies found`);
    console.log('First 5 companies:');
    finalCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (Logo: ${company.logoUrl || 'None'})`);
    });
    
    if (successCount > 70000) {
      console.log('\nSUCCESS: Full dataset imported successfully');
    } else {
      console.log(`\nWARNING: Expected ~76,800 companies, imported ${successCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error in bulk import:', error);
    process.exit(1);
  }
}

bulkImportCompanies();