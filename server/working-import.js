import { readFileSync } from 'fs';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function workingImport() {
  console.log('Starting working company import...');
  
  try {
    // Read CSV file
    const csvContent = readFileSync('./attached_assets/Replit_1749131418658.csv', 'utf-8');
    const lines = csvContent.trim().split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1);
    
    console.log(`Found ${dataLines.length} companies to import`);
    
    let imported = 0;
    let errors = 0;
    
    // Process in smaller batches for reliability
    const batchSize = 500;
    
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const insertValues = [];
      
      for (const line of batch) {
        if (!line.trim()) continue;
        
        // Parse CSV line with proper quote handling
        const fields = parseCSVLine(line);
        if (fields.length < 13) continue;
        
        const id = parseInt(fields[0]);
        if (!id || id <= 0) continue;
        
        const name = cleanString(fields[1]);
        if (!name || name === 'name') continue; // Skip header
        
        const country = cleanString(fields[2]);
        const state = cleanString(fields[3]);
        const city = cleanString(fields[4]);
        const location = cleanString(fields[5]) || `${city}, ${state}, ${country}`;
        const zipCode = fields[6] === 'NULL' ? null : cleanString(fields[6]);
        const website = fields[7] === 'NULL' ? null : cleanString(fields[7]);
        const phone = fields[8] === 'NULL' ? null : cleanString(fields[8]);
        const status = cleanString(fields[9]) || 'approved';
        const approvedBy = cleanString(fields[10]) || 'admin-krupa';
        const userId = cleanString(fields[11]) || 'admin-krupa';
        const logoUrl = (fields[12] === 'uploads/NULL' || fields[12] === 'NULL') ? null : cleanString(fields[12]);
        
        insertValues.push([
          id, userId, name, 'Not specified', '1-50', website, null, logoUrl, 0,
          country, state, city, zipCode, location, phone, status, approvedBy
        ]);
      }
      
      if (insertValues.length > 0) {
        try {
          // Use parameterized query for safety
          const placeholders = insertValues.map((_, idx) => {
            const start = idx * 17;
            return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8}, $${start + 9}, $${start + 10}, $${start + 11}, $${start + 12}, $${start + 13}, $${start + 14}, $${start + 15}, $${start + 16}, $${start + 17})`;
          }).join(', ');
          
          const flatValues = insertValues.flat();
          
          const query = `
            INSERT INTO companies (id, user_id, name, industry, size, website, description, logo_url, followers, country, state, city, zip_code, location, phone, status, approved_by)
            VALUES ${placeholders}
            ON CONFLICT (id) DO NOTHING
          `;
          
          await pool.query(query, flatValues);
          imported += insertValues.length;
          console.log(`Imported ${imported} companies...`);
          
        } catch (batchError) {
          console.error(`Batch error: ${batchError.message}`);
          errors += insertValues.length;
          
          // Try individual inserts for failed batch
          for (const values of insertValues) {
            try {
              const singleQuery = `
                INSERT INTO companies (id, user_id, name, industry, size, website, description, logo_url, followers, country, state, city, zip_code, location, phone, status, approved_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (id) DO NOTHING
              `;
              await pool.query(singleQuery, values);
              imported++;
              errors--;
            } catch (singleError) {
              console.error(`Failed to import company ${values[0]}: ${values[2]}`);
            }
          }
        }
      }
    }
    
    console.log(`Import completed: ${imported} companies imported, ${errors} errors`);
    return imported;
    
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function cleanString(str) {
  if (!str || str === 'NULL') return null;
  return str.replace(/^"|"$/g, '').trim();
}

workingImport().then((count) => {
  console.log(`Successfully imported ${count} companies`);
  process.exit(0);
}).catch((error) => {
  console.error('Import error:', error);
  process.exit(1);
});