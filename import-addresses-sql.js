import fs from 'fs';
import { parse } from 'csv-parse';

async function generateSQLUpdates() {
  console.log('Generating SQL update statements from CSV...');
  
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
  
  parser.on('end', () => {
    console.log(`Processing ${csvData.length} companies...`);
    
    let sqlStatements = [];
    
    // Generate UPDATE statements for each company
    csvData.forEach((company, index) => {
      if (index < 1000) { // Process first 1000 companies for testing
        const sql = `UPDATE companies SET 
          country = '${company.country.replace(/'/g, "''")}',
          state = '${company.state.replace(/'/g, "''")}',
          city = '${company.city.trim().replace(/'/g, "''")}',
          zip_code = '${company.zip_code}',
          updated_at = NOW()
          WHERE name = '${company.name.replace(/'/g, "''")}';`;
        
        sqlStatements.push(sql);
      }
    });
    
    // Write SQL statements to file
    const sqlContent = sqlStatements.join('\n\n');
    fs.writeFileSync('update-company-addresses.sql', sqlContent);
    
    console.log(`Generated ${sqlStatements.length} SQL update statements`);
    console.log('SQL file saved as: update-company-addresses.sql');
    
    // Also create a smaller batch for testing
    const testBatch = sqlStatements.slice(0, 20);
    fs.writeFileSync('test-batch-addresses.sql', testBatch.join('\n\n'));
    console.log('Test batch (20 companies) saved as: test-batch-addresses.sql');
  });
  
  parser.on('error', (error) => {
    console.error('CSV parsing error:', error);
  });
}

generateSQLUpdates();