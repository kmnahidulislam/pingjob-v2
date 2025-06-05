import { readFileSync } from 'fs';
import { pool } from './db.ts';

async function bulkImport() {
  console.log('Starting bulk company import...');
  
  try {
    // Read the entire CSV file
    const csvContent = readFileSync('./attached_assets/Replit_1749131418658.csv', 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} records to import`);
    
    // Process in chunks of 1000
    const chunkSize = 1000;
    let imported = 0;
    
    for (let i = 1; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize);
      const values = [];
      
      for (const line of chunk) {
        if (!line.trim()) continue;
        
        const cols = line.split(',');
        if (cols.length < 13) continue;
        
        const id = parseInt(cols[0]) || 0;
        const name = cols[1]?.replace(/"/g, '') || '';
        const country = cols[2]?.replace(/"/g, '') || '';
        const state = cols[3]?.replace(/"/g, '') || '';
        const city = cols[4]?.replace(/"/g, '') || '';
        const location = cols[5]?.replace(/"/g, '') || '';
        const zipCode = cols[6] === 'NULL' ? null : cols[6]?.replace(/"/g, '');
        const website = cols[7] === 'NULL' ? null : cols[7]?.replace(/"/g, '');
        const phone = cols[8] === 'NULL' ? null : cols[8]?.replace(/"/g, '');
        const status = cols[9]?.replace(/"/g, '') || 'approved';
        const approvedBy = cols[10]?.replace(/"/g, '') || 'admin-krupa';
        const userId = cols[11]?.replace(/"/g, '') || 'admin-krupa';
        const logoUrl = cols[12] === 'uploads/NULL' ? null : cols[12]?.replace(/"/g, '');
        
        if (name && id) {
          values.push(`(${id}, '${userId}', '${name.replace(/'/g, "''")}', 'Not specified', '1-50', ${website ? `'${website}'` : 'NULL'}, NULL, ${logoUrl ? `'${logoUrl}'` : 'NULL'}, 0, '${country}', '${state}', '${city}', ${zipCode ? `'${zipCode}'` : 'NULL'}, '${location.replace(/'/g, "''")}', ${phone ? `'${phone}'` : 'NULL'}, '${status}', '${approvedBy}', NOW(), NOW())`);
        }
      }
      
      if (values.length > 0) {
        const query = `
          INSERT INTO companies (id, user_id, name, industry, size, website, description, logo_url, followers, country, state, city, zip_code, location, phone, status, approved_by, created_at, updated_at)
          VALUES ${values.join(', ')}
          ON CONFLICT (id) DO NOTHING
        `;
        
        await pool.query(query);
        imported += values.length;
        console.log(`Imported ${imported} companies so far...`);
      }
    }
    
    console.log(`Successfully imported ${imported} companies`);
    return imported;
  } catch (error) {
    console.error('Error during bulk import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

bulkImport().then((count) => {
  console.log(`Import completed: ${count} companies imported`);
  process.exit(0);
}).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});