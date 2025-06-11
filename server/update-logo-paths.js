import { storage } from './storage.ts';

async function updateLogoPaths() {
  console.log('Starting logo path update...');
  
  try {
    // Get all companies
    const companies = await storage.getCompanies(50000);
    console.log(`Found ${companies.length} companies`);
    
    let updatedCount = 0;
    
    for (const company of companies) {
      if (company.logoUrl && company.logoUrl.startsWith('/uploads/')) {
        const newLogoUrl = company.logoUrl.replace('/uploads/', '/logos/');
        
        await storage.updateCompany(company.id, {
          logoUrl: newLogoUrl
        });
        
        console.log(`Updated ${company.name}: ${company.logoUrl} → ${newLogoUrl}`);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} company logo paths from /uploads/ to /logos/`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating logo paths:', error);
    process.exit(1);
  }
}

updateLogoPaths();