import { db } from '../db.ts';
import { companies } from '../shared/schema.ts';
import { sql } from 'drizzle-orm';

async function completeUploadsFix() {
  console.log('Starting complete uploads/ to logos/ fix...');
  
  try {
    // Update all logo_url fields that contain 'uploads/' to use 'logos/' instead
    const result = await db
      .update(companies)
      .set({
        logoUrl: sql`REPLACE(logo_url, 'uploads/', 'logos/')`
      })
      .where(sql`logo_url LIKE '%uploads/%'`);

    console.log('SQL Update completed');
    
    // Check how many rows still have uploads/
    const remainingCount = await db
      .select({ count: sql`COUNT(*)` })
      .from(companies)
      .where(sql`logo_url LIKE '%uploads/%'`);
    
    console.log(`Remaining rows with uploads/: ${remainingCount[0].count}`);
    
    // Show some examples of updated URLs
    const sampleUpdated = await db
      .select({ name: companies.name, logoUrl: companies.logoUrl })
      .from(companies)
      .where(sql`logo_url LIKE '%logos/%'`)
      .limit(10);
    
    console.log('Sample updated URLs:');
    sampleUpdated.forEach(company => {
      console.log(`- ${company.name}: ${company.logoUrl}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating logo URLs:', error);
    process.exit(1);
  }
}

completeUploadsFix();