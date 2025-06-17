import { db } from './db';
import { companies } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateVEDAddress() {
  try {
    console.log('Updating VED Software Services Inc with address data...');
    
    const result = await db
      .update(companies)
      .set({
        city: 'Farmington Hills',
        state: 'MI',
        zipCode: '48334',
        country: 'United States',
        updatedAt: new Date()
      })
      .where(eq(companies.name, 'VED Software Services Inc'))
      .returning();
    
    console.log('Update result:', result);
    
    // Verify the update
    const updated = await db
      .select()
      .from(companies)
      .where(eq(companies.name, 'VED Software Services Inc'));
    
    console.log('Updated company data:', updated[0]);
    
  } catch (error) {
    console.error('Error updating address:', error);
  }
}

updateVEDAddress();