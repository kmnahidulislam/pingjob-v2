import { storage } from './storage.ts';

async function bulkUploadsFix() {
  console.log('Starting bulk uploads/ to logos/ replacement...');
  
  try {
    // Get all companies with uploads/ in their logo URL
    const allCompanies = await storage.getCompanies(100000); // Get all companies
    console.log(`Checking ${allCompanies.length} companies for uploads/ references...`);
    
    const companiesToUpdate = allCompanies.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`Found ${companiesToUpdate.length} companies with uploads/ in logo URLs`);
    
    let updatedCount = 0;
    let batchCount = 0;
    
    for (const company of companiesToUpdate) {
      const newLogoUrl = company.logoUrl.replace(/uploads\//g, 'logos/');
      
      try {
        await storage.updateCompany(company.id, {
          logoUrl: newLogoUrl
        });
        
        updatedCount++;
        batchCount++;
        
        if (batchCount % 100 === 0) {
          console.log(`Updated ${batchCount} companies so far...`);
        }
        
        // Show first 10 updates
        if (updatedCount <= 10) {
          console.log(`${updatedCount}. ${company.name}: ${company.logoUrl} → ${newLogoUrl}`);
        }
      } catch (error) {
        console.error(`Failed to update ${company.name}:`, error.message);
      }
    }
    
    console.log(`\nBulk update completed: ${updatedCount} companies updated`);
    
    // Verify the fix by checking for remaining uploads/ references
    const remainingCompanies = await storage.getCompanies(100000);
    const stillHaveUploads = remainingCompanies.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`Remaining companies with uploads/: ${stillHaveUploads.length}`);
    
    if (stillHaveUploads.length > 0) {
      console.log('First 5 remaining uploads/ references:');
      stillHaveUploads.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}: ${company.logoUrl}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error in bulk uploads fix:', error);
    process.exit(1);
  }
}

bulkUploadsFix();