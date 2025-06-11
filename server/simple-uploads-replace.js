import { storage } from './storage.ts';

async function simpleUploadsReplace() {
  console.log('Starting simple uploads/ replacement...');
  
  try {
    // Get companies in smaller, manageable batches
    let totalUpdated = 0;
    let batchNum = 0;
    let batchSize = 1000;
    
    while (batchNum < 50) { // Limit to 50 batches for safety
      batchNum++;
      console.log(`Processing batch ${batchNum}...`);
      
      const companies = await storage.getCompanies(batchSize);
      
      if (companies.length === 0) {
        console.log('No more companies to process');
        break;
      }
      
      const uploadsCompanies = companies.filter(c => 
        c.logoUrl && c.logoUrl.includes('uploads/')
      );
      
      if (uploadsCompanies.length === 0) {
        console.log(`Batch ${batchNum}: No uploads/ found`);
        continue;
      }
      
      console.log(`Batch ${batchNum}: Found ${uploadsCompanies.length} companies with uploads/`);
      
      // Update each company
      for (const company of uploadsCompanies) {
        try {
          const newUrl = company.logoUrl.replace(/uploads\//g, 'logos/');
          await storage.updateCompany(company.id, { logoUrl: newUrl });
          totalUpdated++;
          
          if (totalUpdated <= 3) {
            console.log(`  Updated: ${company.name}`);
          }
        } catch (err) {
          console.error(`  Failed to update ${company.name}: ${err.message}`);
        }
      }
      
      console.log(`Batch ${batchNum} complete. Total updated: ${totalUpdated}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nTotal companies updated: ${totalUpdated}`);
    
    // Quick verification
    const testBatch = await storage.getCompanies(5000);
    const remaining = testBatch.filter(c => c.logoUrl && c.logoUrl.includes('uploads/'));
    console.log(`Remaining uploads/ in test batch: ${remaining.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

simpleUploadsReplace();