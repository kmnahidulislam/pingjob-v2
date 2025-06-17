import { db } from './db';
import { companies } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateSampleCompanies() {
  try {
    console.log('Updating sample companies with address data...');
    
    // Sample companies from the CSV with their address data
    const sampleUpdates = [
      {
        name: 'VED Software Services Inc',
        country: 'United States',
        state: 'MI',
        city: 'Farmington Hills',
        zipCode: '48334'
      },
      {
        name: '3M Company',
        country: 'United States',
        state: 'Minnesota',
        city: 'School Village',
        zipCode: '55144'
      },
      {
        name: '1st Financial Bank USA',
        country: 'United States',
        state: 'South Dakota',
        city: 'North Sioux City',
        zipCode: '57049'
      },
      {
        name: '@Comm Corporation',
        country: 'United States',
        state: 'California',
        city: 'San Mateo',
        zipCode: '94403'
      },
      {
        name: '24 Hour Fitness',
        country: 'United States',
        state: 'California',
        city: 'Carlsbad',
        zipCode: '92018'
      }
    ];
    
    let updated = 0;
    
    for (const companyData of sampleUpdates) {
      try {
        const result = await db
          .update(companies)
          .set({
            country: companyData.country,
            state: companyData.state,
            city: companyData.city,
            zipCode: companyData.zipCode,
            updatedAt: new Date()
          })
          .where(eq(companies.name, companyData.name))
          .returning({ id: companies.id, name: companies.name });
        
        if (result.length > 0) {
          updated++;
          console.log(`Updated: ${companyData.name}`);
        } else {
          console.log(`Not found: ${companyData.name}`);
        }
        
      } catch (error) {
        console.error(`Error updating ${companyData.name}:`, error);
      }
    }
    
    console.log(`\nCompleted: ${updated} companies updated`);
    
    // Verify updates
    const vedSoftware = await db
      .select()
      .from(companies)
      .where(eq(companies.name, 'VED Software Services Inc'))
      .limit(1);
    
    if (vedSoftware.length > 0) {
      console.log('\nVED Software Services Inc address:', {
        city: vedSoftware[0].city,
        state: vedSoftware[0].state,
        zipCode: vedSoftware[0].zipCode,
        country: vedSoftware[0].country
      });
    }
    
  } catch (error) {
    console.error('Update failed:', error);
  }
}

updateSampleCompanies();