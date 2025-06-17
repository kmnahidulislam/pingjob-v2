import fs from 'fs';
import { parse } from 'csv-parse';
import { db } from './db.ts';
import { companies } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function importCompanyAddresses() {
  try {
    console.log('Starting company address import...');
    
    // Read and parse the CSV file
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
      console.log(`Parsed ${csvData.length} companies from CSV`);
      
      let updated = 0;
      let notFound = 0;
      
      // Process each company from CSV
      for (const csvCompany of csvData) {
        try {
          // Update company with address data by matching name
          const result = await db
            .update(companies)
            .set({
              country: csvCompany.country,
              state: csvCompany.state,
              city: csvCompany.city.trim(), // Remove trailing spaces
              zipCode: csvCompany.zip_code,
              updatedAt: new Date()
            })
            .where(eq(companies.name, csvCompany.name))
            .returning({ id: companies.id, name: companies.name });
          
          if (result.length > 0) {
            updated++;
            if (updated % 100 === 0) {
              console.log(`Updated ${updated} companies so far...`);
            }
          } else {
            notFound++;
            console.log(`Company not found in database: ${csvCompany.name}`);
          }
          
        } catch (error) {
          console.error(`Error updating company ${csvCompany.name}:`, error.message);
        }
      }
      
      console.log('\nImport completed:');
      console.log(`- Companies updated: ${updated}`);
      console.log(`- Companies not found: ${notFound}`);
      console.log(`- Total processed: ${csvData.length}`);
      
      // Verify a few updates
      console.log('\nVerifying updates...');
      const sampleCompanies = await db
        .select()
        .from(companies)
        .where(eq(companies.name, '3M Company'))
        .limit(1);
      
      if (sampleCompanies.length > 0) {
        console.log('Sample updated company:', {
          name: sampleCompanies[0].name,
          city: sampleCompanies[0].city,
          state: sampleCompanies[0].state,
          zipCode: sampleCompanies[0].zipCode,
          country: sampleCompanies[0].country
        });
      }
      
      process.exit(0);
    });
    
    parser.on('error', (error) => {
      console.error('CSV parsing error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importCompanyAddresses();