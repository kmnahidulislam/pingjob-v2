import fs from 'fs';
import { parse } from 'csv-parse';

async function processCSVImport() {
  console.log('Processing CSV address data for import...');
  
  const csvData = [];
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  const stream = fs.createReadStream('attached_assets/CSZ_1750183986263.csv');
  
  stream.pipe(parser);
  
  parser.on('data', (row) => {
    csvData.push(row);
  });
  
  parser.on('end', async () => {
    console.log(`Processing ${csvData.length} companies from CSV...`);
    
    // Process first 50 companies for testing
    const batch = csvData.slice(0, 50);
    let successCount = 0;
    
    for (const company of batch) {
      try {
        // Make authenticated API call to update company
        const response = await fetch('http://localhost:5000/api/companies/update-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'connect.sid=s%3AY3NoRG29oGV3DcuvG0IJqDmkBxYtINMA.xutF%2FZ%2BHfvsaAn6NPl%2BM0%2BEeiJBOAsnqlwbjBrkjF5U'
          },
          body: JSON.stringify({
            name: company.name,
            country: company.country,
            state: company.state,
            city: company.city.trim(),
            zipCode: company.zip_code
          })
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✓ Updated: ${company.name} - ${company.city}, ${company.state}`);
        } else {
          console.log(`✗ Failed: ${company.name} - ${response.status}`);
        }
        
      } catch (error) {
        console.log(`✗ Error updating ${company.name}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nImport completed: ${successCount}/${batch.length} companies updated`);
    
    // Verify a sample update
    console.log('\nVerifying import results...');
    try {
      const checkResponse = await fetch('http://localhost:5000/api/companies?q=VED%20Software');
      if (checkResponse.ok) {
        const companies = await checkResponse.json();
        if (companies.length > 0) {
          const ved = companies[0];
          console.log('VED Software Services Inc after import:', {
            name: ved.name,
            city: ved.city,
            state: ved.state,
            zipCode: ved.zipCode,
            country: ved.country
          });
        }
      }
    } catch (error) {
      console.log('Verification failed:', error.message);
    }
  });
  
  parser.on('error', (error) => {
    console.error('CSV parsing error:', error);
  });
}

processCSVImport();