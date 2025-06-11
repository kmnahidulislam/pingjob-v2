import { storage } from './storage.ts';

async function findUploads() {
  console.log('Searching for remaining uploads/ references...');
  
  try {
    // Get a large sample of companies
    const companies = await storage.getCompanies(50000);
    console.log(`Checking ${companies.length} companies...`);
    
    const uploadsCompanies = companies.filter(company => 
      company.logoUrl && company.logoUrl.includes('uploads/')
    );
    
    console.log(`Found ${uploadsCompanies.length} companies with uploads/ in logoUrl`);
    
    if (uploadsCompanies.length > 0) {
      console.log('\nFirst 20 examples:');
      uploadsCompanies.slice(0, 20).forEach((company, index) => {
        console.log(`${index + 1}. ID: ${company.id}, Name: ${company.name}, URL: ${company.logoUrl}`);
      });
    }
    
    // Also check for any other patterns
    const hasUploadsPrefix = companies.filter(company => 
      company.logoUrl && company.logoUrl.startsWith('uploads/')
    );
    
    console.log(`\nCompanies with logoUrl starting with 'uploads/': ${hasUploadsPrefix.length}`);
    
    if (hasUploadsPrefix.length > 0) {
      console.log('Examples:');
      hasUploadsPrefix.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}: ${company.logoUrl}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error finding uploads:', error);
    process.exit(1);
  }
}

findUploads();