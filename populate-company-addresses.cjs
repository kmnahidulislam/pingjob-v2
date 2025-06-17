const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function populateCompanyAddresses() {
  try {
    console.log('Starting company address population...');
    
    // Get companies with location data but missing city/state/zip
    const companiesQuery = `
      SELECT id, name, location, city, state, zip_code, country 
      FROM companies 
      WHERE location IS NOT NULL 
      AND location != ''
      AND (city IS NULL OR state IS NULL OR zip_code IS NULL)
      LIMIT 100
    `;
    
    const companies = await pool.query(companiesQuery);
    console.log(`Found ${companies.rows.length} companies with incomplete address data`);
    
    let updatedCount = 0;
    
    for (const company of companies.rows) {
      console.log(`\nProcessing: ${company.name}`);
      console.log(`Current location: ${company.location}`);
      
      // Try to extract zip code from location using regex
      const zipMatch = company.location.match(/\b\d{5}(-\d{4})?\b/);
      let extractedZip = zipMatch ? zipMatch[0] : null;
      
      // Try to extract state abbreviations
      const stateMatch = company.location.match(/\b[A-Z]{2}\b/);
      let extractedState = stateMatch ? stateMatch[0] : null;
      
      // Common state name patterns
      const stateNames = {
        'Michigan': 'MI',
        'California': 'CA',
        'Texas': 'TX',
        'Florida': 'FL',
        'New York': 'NY',
        'Illinois': 'IL',
        'Pennsylvania': 'PA',
        'Ohio': 'OH',
        'Georgia': 'GA',
        'North Carolina': 'NC',
        'Virginia': 'VA',
        'Washington': 'WA',
        'Arizona': 'AZ',
        'Massachusetts': 'MA',
        'Tennessee': 'TN',
        'Indiana': 'IN',
        'Missouri': 'MO',
        'Maryland': 'MD',
        'Wisconsin': 'WI',
        'Colorado': 'CO'
      };
      
      // Try to find state name in location
      if (!extractedState) {
        for (const [stateName, stateCode] of Object.entries(stateNames)) {
          if (company.location.toLowerCase().includes(stateName.toLowerCase())) {
            extractedState = stateCode;
            break;
          }
        }
      }
      
      // Try to extract city - look for patterns before state or zip
      let extractedCity = null;
      if (extractedState || extractedZip) {
        // Remove street address and try to find city
        let locationParts = company.location.split(',').map(p => p.trim());
        
        // If we have multiple parts, the city is likely before state/zip
        if (locationParts.length > 1) {
          for (let part of locationParts) {
            // Skip parts that look like street addresses (contain numbers at start)
            if (!/^\d+/.test(part) && part.length > 2 && !stateNames[part] && !/^\d{5}/.test(part)) {
              extractedCity = part;
              break;
            }
          }
        }
        
        // Alternative: try to find city name patterns
        if (!extractedCity) {
          // Look for common city patterns
          const cityPattern = /([A-Za-z\s]+?)(?:\s+(?:MI|CA|TX|FL|NY|IL|PA|OH|GA|NC|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|\d{5}))/;
          const cityMatch = company.location.match(cityPattern);
          if (cityMatch) {
            extractedCity = cityMatch[1].trim();
          }
        }
      }
      
      // Update the company if we found any new information
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (extractedCity && !company.city) {
        updates.push(`city = $${paramIndex++}`);
        values.push(extractedCity);
      }
      
      if (extractedState && !company.state) {
        updates.push(`state = $${paramIndex++}`);
        values.push(extractedState);
      }
      
      if (extractedZip && !company.zip_code) {
        updates.push(`zip_code = $${paramIndex++}`);
        values.push(extractedZip);
      }
      
      // Set country to USA if we found US state
      if (extractedState && !company.country) {
        updates.push(`country = $${paramIndex++}`);
        values.push('United States');
      }
      
      if (updates.length > 0) {
        values.push(company.id);
        const updateQuery = `
          UPDATE companies 
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id = $${paramIndex}
        `;
        
        await pool.query(updateQuery, values);
        updatedCount++;
        
        console.log(`  Updated with:`);
        if (extractedCity) console.log(`    City: ${extractedCity}`);
        if (extractedState) console.log(`    State: ${extractedState}`);
        if (extractedZip) console.log(`    Zip: ${extractedZip}`);
      } else {
        console.log(`  No extractable data found`);
      }
    }
    
    console.log(`\nCompleted! Updated ${updatedCount} companies with address data.`);
    
    // Show some examples of updated companies
    const updatedCompanies = await pool.query(`
      SELECT name, location, city, state, zip_code, country 
      FROM companies 
      WHERE city IS NOT NULL AND state IS NOT NULL
      ORDER BY updated_at DESC 
      LIMIT 10
    `);
    
    console.log('\nExample updated companies:');
    updatedCompanies.rows.forEach(company => {
      console.log(`${company.name}: ${company.city}, ${company.state} ${company.zip_code || ''}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

populateCompanyAddresses();