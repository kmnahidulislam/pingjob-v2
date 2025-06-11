import { storage } from './storage.ts';

async function removeSlashFromLogos() {
  console.log('Starting logo URL slash removal...');
  
  try {
    // Get all companies
    const companies = await storage.getCompanies(50000);
    console.log(`Found ${companies.length} companies`);
    
    let updatedCount = 0;
    
    for (const company of companies) {
      if (company.logoUrl && company.logoUrl.startsWith('/logos/')) {
        // Remove the leading slash from /logos/
        const newLogoUrl = company.logoUrl.substring(1); // Remove first character
        
        await storage.updateCompany(company.id, {
          logoUrl: newLogoUrl
        });
        
        console.log(`Updated ${company.name}: ${company.logoUrl} → ${newLogoUrl}`);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} company logo URLs`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating logo URLs:', error);
    process.exit(1);
  }
}

removeSlashFromLogos();