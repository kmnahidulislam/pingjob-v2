const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateVEDAddress() {
  try {
    console.log('Updating VED Software Services Inc address...');
    
    // Update VED Software Services Inc with proper address data
    const updateQuery = `
      UPDATE companies 
      SET 
        city = $1,
        state = $2,
        zip_code = $3,
        country = $4,
        updated_at = NOW()
      WHERE name ILIKE '%VED Software%'
      RETURNING id, name, location, city, state, zip_code, country
    `;
    
    const result = await pool.query(updateQuery, [
      'Farmington Hills',
      'MI', 
      '48334',
      'United States'
    ]);
    
    if (result.rows.length > 0) {
      console.log('Successfully updated:');
      result.rows.forEach(company => {
        console.log(`ID: ${company.id}`);
        console.log(`Name: ${company.name}`);
        console.log(`Location: ${company.location}`);
        console.log(`City: ${company.city}`);
        console.log(`State: ${company.state}`);
        console.log(`Zip: ${company.zip_code}`);
        console.log(`Country: ${company.country}`);
      });
    } else {
      console.log('No VED Software companies found to update');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Check if we're running this directly
if (require.main === module) {
  updateVEDAddress();
}

module.exports = { updateVEDAddress };