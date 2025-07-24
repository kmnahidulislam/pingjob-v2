import { readFileSync } from 'fs';
import { pool } from './db.ts';

async function directImport() {
  console.log('Starting direct SQL import...');
  
  try {
    const csvContent = readFileSync('./attached_assets/Replit_1749131418658.csv', 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    console.log(`Processing ${lines.length - 1} companies...`);
    
    let imported = 0;
    const batchSize = 1000;
    
    // Process in batches
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const values = [];
      
      for (const line of batch) {
        if (!line.trim()) continue;
        
        // Simple CSV parsing
        const parts = line.split(',');
        if (parts.length < 13) continue;
        
        const id = parseInt(parts[0]) || 0;
        const name = parts[1]?.replace(/"/g, '').replace(/'/g, "''") || '';
        const country = parts[2]?.replace(/"/g, '') || '';
        const state = parts[3]?.replace(/"/g, '') || '';
        const city = parts[4]?.replace(/"/g, '') || '';
        const location = parts[5]?.replace(/"/g, '').replace(/'/g, "''") || '';
        const zipCode = parts[6] === 'NULL' ? null : parts[6]?.replace(/"/g, '');
        const website = parts[7] === 'NULL' ? null : parts[7]?.replace(/"/g, '');
        const phone = parts[8] === 'NULL' ? null : parts[8]?.replace(/"/g, '');
        const status = parts[9]?.replace(/"/g, '') || 'approved';
        const approvedBy = parts[10]?.replace(/"/g, '') || 'admin-krupa';
        const userId = parts[11]?.replace(/"/g, '') || 'admin-krupa';
        const logoUrl = parts[12] === 'uploads/NULL' ? null : parts[12]?.replace(/"/g, '');
        
        if (id && name && name !== 'name') { // Skip header and invalid records
          values.push(`(${id}, '${userId}', '${name}', 'Not specified', '1-50', ${website ? `'${website}'` : 'NULL'}, NULL, ${logoUrl ? `'${logoUrl}'` : 'NULL'}, 0, '${country}', '${state}', '${city}', ${zipCode ? `'${zipCode}'` : 'NULL'}, '${location}', ${phone ? `'${phone}'` : 'NULL'}, '${status}', '${approvedBy}', NOW(), NOW())`);
        }
      }
      
      if (values.length > 0) {
        const query = `
          INSERT INTO companies (id, user_id, name, industry, size, website, description, logo_url, followers, country, state, city, zip_code, location, phone, status, approved_by, created_at, updated_at)
          VALUES ${values.join(', ')}
          ON CONFLICT (id) DO NOTHING
        `;
        
        try {
          const result = await pool.query(query);
          imported += values.length;
          console.log(`Imported ${imported} companies...`);
        } catch (error) {
          console.error(`Batch error at ${i}: ${error.message}`);
          // Try smaller batches if this fails
          for (const value of values) {
            try {
              const singleQuery = `
                INSERT INTO companies (id, user_id, name, industry, size, website, description, logo_url, followers, country, state, city, zip_code, location, phone, status, approved_by, created_at, updated_at)
                VALUES ${value}
                ON CONFLICT (id) DO NOTHING
              `;
              await pool.query(singleQuery);
              imported++;
            } catch (singleError) {
              console.error(`Single insert error: ${singleError.message}`);
            }
          }
        }
      }
    }
    
    console.log(`Import completed: ${imported} companies imported`);
    return imported;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

directImport().then((count) => {
  console.log(`Successfully imported ${count} companies`);
  process.exit(0);
}).catch((error) => {
  console.error('Import error:', error);
  process.exit(1);
});