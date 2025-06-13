import { storage } from './storage.ts';
import { parse } from 'csv-parse';
import fs from 'fs';

async function importCompanies() {
  console.log('Starting companies import from CSV...');
  
  try {
    const csvFilePath = '../attached_assets/Replit_1749782925286.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
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
    
    let successCount = 0;
    let errorCount = 0;
    let batchSize = 100;
    
    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);
      
      for (const record of batch) {
        try {
          // Map CSV fields to company data
          const companyData = {
            name: record.name?.trim() || '',
            location: record.location?.trim() || null,
            logoUrl: record.logo_url === 'logos/NULL' ? null : record.logo_url?.trim() || null,
            website: record.website?.trim() || null,
            phone: record.phone?.trim() || null,
            status: record.status?.trim() || 'pending',
            approvedBy: record.approved_by?.trim() || null,
            userId: record.user_id?.trim() || 'admin-krupa'
          };
          
          await storage.createCompany(companyData);
          successCount++;
          
          if (successCount % 1000 === 0) {
            console.log(`Imported ${successCount} companies...`);
          }
          
        } catch (error) {
          errorCount++;
          if (errorCount <= 5) {
            console.error(`Error importing ${record.name}: ${error.message}`);
          }
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Successfully imported: ${successCount} companies`);
    console.log(`Errors: ${errorCount} companies`);
    console.log(`Total processed: ${records.length} companies`);
    
    // Verify the import
    const totalCompanies = await storage.getCompanies(10);
    console.log(`\nVerification: Database now contains companies starting with:`);
    totalCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (Logo: ${company.logoUrl || 'None'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing companies:', error);
    process.exit(1);
  }
}

importCompanies();