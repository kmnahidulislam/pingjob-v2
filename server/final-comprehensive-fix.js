import { storage } from './storage.ts';

async function finalComprehensiveFix() {
  console.log('Starting final comprehensive fix for all uploads/ references...');
  
  try {
    let totalProcessed = 0;
    let totalUpdated = 0;
    let batchNumber = 1;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`\nProcessing batch ${batchNumber}...`);
      
      // Get all companies and filter for uploads/ in one go
      const allCompanies = await storage.getCompanies(50000);
      const uploadsCompanies = allCompanies.filter(company => 
        company.logoUrl && company.logoUrl.includes('uploads/')
      );
      
      console.log(`Found ${uploadsCompanies.length} companies with uploads/ in this batch`);
      
      if (uploadsCompanies.length === 0) {
        console.log('No more companies with uploads/ found');
        hasMore = false;
        break;
      }
      
      // Process in smaller chunks to avoid timeouts
      const chunkSize = 50;
      for (let i = 0; i < uploadsCompanies.length; i += chunkSize) {
        const chunk = uploadsCompanies.slice(i, i + chunkSize);
        console.log(`  Processing chunk ${Math.floor(i/chunkSize) + 1} (${chunk.length} companies)`);
        
        for (const company of chunk) {
          try {
            const newLogoUrl = company.logoUrl.replace(/uploads\//g, 'logos/');
            
            await storage.updateCompany(company.id, {
              logoUrl: newLogoUrl
            });
            
            totalUpdated++;
            
            if (totalUpdated <= 10) {
              console.log(`    ${totalUpdated}. ${company.name}: uploads/... → logos/...`);
            }
            
          } catch (error) {
            console.error(`    Error updating ${company.name}: ${error.message}`);
          }
        }
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      totalProcessed += uploadsCompanies.length;
      console.log(`Batch ${batchNumber} completed. Updated: ${totalUpdated}, Total processed: ${totalProcessed}`);
      
      batchNumber++;
      
      // Safety check to prevent infinite loops
      if (batchNumber > 10) {
        console.log('Reached maximum batch limit for safety');
        break;
      }
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total companies updated: ${totalUpdated}`);
    console.log(`Total companies processed: ${totalProcessed}`);
    
    // Final verification
    console.log('\nPerforming final verification...');
    const finalCheck = await storage.getCompanies(50000);
    const remainingUploads = finalCheck.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`\nFinal count of companies with uploads/: ${remainingUploads.length}`);
    
    if (remainingUploads.length === 0) {
      console.log('✅ SUCCESS: All uploads/ references have been converted to logos/');
    } else {
      console.log(`⚠️ ${remainingUploads.length} companies still have uploads/ references`);
      console.log('First 5 remaining:');
      remainingUploads.slice(0, 5).forEach((company, index) => {
        console.log(`  ${index + 1}. ID: ${company.id}, Name: ${company.name}, URL: ${company.logoUrl}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error in final comprehensive fix:', error);
    process.exit(1);
  }
}

finalComprehensiveFix();