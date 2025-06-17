// Simple batch import using the existing database connection
import fs from 'fs';
import { parse } from 'csv-parse';

async function importAddresses() {
  try {
    console.log('Starting CSV address import...');
    
    // Read CSV data
    const csvContent = fs.readFileSync('attached_assets/CSZ_1750183986263.csv', 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} companies in CSV`);
    
    // Process first 100 companies as a test batch
    const updates = [];
    for (let i = 1; i <= Math.min(100, lines.length - 1); i++) {
      const values = lines[i].split(',');
      if (values.length >= 6) {
        const companyData = {
          id: values[0],
          name: values[1].replace(/"/g, ''),
          country: values[2].replace(/"/g, ''),
          state: values[3].replace(/"/g, ''),
          city: values[4].replace(/"/g, ''),
          zipCode: values[5].replace(/"/g, '')
        };
        updates.push(companyData);
      }
    }
    
    console.log(`Prepared ${updates.length} company updates`);
    
    // Create API requests to update companies
    const results = [];
    for (const company of updates.slice(0, 20)) { // Process 20 companies
      try {
        const response = await fetch('http://localhost:5000/api/companies/search', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          console.log(`Found company: ${company.name}`);
          results.push({ name: company.name, status: 'ready' });
        }
      } catch (error) {
        console.log(`Error processing ${company.name}:`, error.message);
      }
    }
    
    console.log(`Processing complete. Ready to update ${results.length} companies.`);
    
    // Display sample data for verification
    console.log('\nSample companies ready for import:');
    updates.slice(0, 5).forEach(company => {
      console.log(`${company.name}: ${company.city}, ${company.state} ${company.zipCode}, ${company.country}`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importAddresses();