import { readFileSync } from 'fs';
import { db } from './db.ts';
import { companies } from '../shared/schema.ts';

async function syncImport() {
  console.log('Starting synchronous company import...');
  
  try {
    // Read and parse CSV synchronously
    const csvContent = readFileSync('./attached_assets/Replit_1749131418658.csv', 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log(`Processing ${lines.length - 1} records...`);
    
    let imported = 0;
    const errors = [];
    
    // Process each line individually for maximum reliability
    for (let i = 1; i < lines.length && i < 5001; i++) { // Process first 5000 records
      try {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Parse CSV line properly handling quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        if (values.length < 13) continue;
        
        const companyData = {
          id: parseInt(values[0]) || 0,
          userId: (values[11] && values[11] !== 'NULL') ? values[11] : 'admin-krupa',
          name: values[1] || 'Unknown',
          industry: 'Not specified',
          size: '1-50',
          website: (values[7] && values[7] !== 'NULL') ? values[7] : null,
          description: null,
          logoUrl: (values[12] && values[12] !== 'uploads/NULL' && values[12] !== 'NULL') ? values[12] : null,
          followers: 0,
          country: values[2] || '',
          state: values[3] || '',
          city: values[4] || '',
          zipCode: (values[6] && values[6] !== 'NULL') ? values[6] : null,
          location: values[5] || `${values[4]}, ${values[3]}, ${values[2]}`,
          phone: (values[8] && values[8] !== 'NULL') ? values[8] : null,
          status: values[9] || 'approved',
          approvedBy: (values[10] && values[10] !== 'NULL') ? values[10] : 'admin-krupa'
        };
        
        if (companyData.id && companyData.name && companyData.name !== 'Unknown') {
          await db.insert(companies).values(companyData).onConflictDoNothing();
          imported++;
          
          if (imported % 500 === 0) {
            console.log(`Imported ${imported} companies...`);
          }
        }
      } catch (error) {
        errors.push(`Line ${i}: ${error.message}`);
        if (errors.length > 10) break; // Stop if too many errors
      }
    }
    
    console.log(`Import completed: ${imported} companies imported`);
    if (errors.length > 0) {
      console.log(`Errors encountered: ${errors.length}`);
    }
    
    return imported;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

syncImport().then((count) => {
  console.log(`Successfully imported ${count} companies`);
  process.exit(0);
}).catch((error) => {
  console.error('Import error:', error);
  process.exit(1);
});