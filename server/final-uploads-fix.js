import { storage } from './storage.ts';

async function finalUploadsFix() {
  console.log('Starting final comprehensive uploads/ fix...');
  
  try {
    // Get ALL companies
    const allCompanies = await storage.getCompanies(100000);
    console.log(`Total companies in database: ${allCompanies.length}`);
    
    // Filter companies that still have uploads/ in their logoUrl
    const uploadsCompanies = allCompanies.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`Companies still with uploads/: ${uploadsCompanies.length}`);
    
    if (uploadsCompanies.length === 0) {
      console.log('No companies found with uploads/ in logoUrl');
      process.exit(0);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log('Starting batch updates...');
    
    for (let i = 0; i < uploadsCompanies.length; i++) {
      const company = uploadsCompanies[i];
      
      try {
        // Replace ALL occurrences of uploads/ with logos/
        const newLogoUrl = company.logoUrl.replace(/uploads\//g, 'logos/');
        
        await storage.updateCompany(company.id, {
          logoUrl: newLogoUrl
        });
        
        successCount++;
        
        // Log progress every 500 updates
        if (successCount % 500 === 0) {
          console.log(`Updated ${successCount}/${uploadsCompanies.length} companies...`);
        }
        
        // Log first few updates for verification
        if (successCount <= 5) {
          console.log(`${successCount}. ${company.name}: ${company.logoUrl} → ${newLogoUrl}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`Error updating company ${company.id} (${company.name}): ${error.message}`);
      }
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Successfully updated: ${successCount} companies`);
    console.log(`Errors: ${errorCount} companies`);
    console.log(`Total processed: ${uploadsCompanies.length} companies`);
    
    // Final verification
    console.log('\nVerifying fix...');
    const verifyCompanies = await storage.getCompanies(100000);
    const remainingUploads = verifyCompanies.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`Remaining companies with uploads/: ${remainingUploads.length}`);
    
    if (remainingUploads.length > 0) {
      console.log('Still remaining (first 10):');
      remainingUploads.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ID: ${company.id}, Name: ${company.name}, URL: ${company.logoUrl}`);
      });
    } else {
      console.log('SUCCESS: All uploads/ references have been converted to logos/');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error in final uploads fix:', error);
    process.exit(1);
  }
}

finalUploadsFix();