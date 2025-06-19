const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importUsersFromCSV() {
  console.log('Starting user import from CSV...');
  
  try {
    const csvData = [];
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    
    return new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, async (err, records) => {
        if (err) {
          console.error('CSV parsing error:', err);
          reject(err);
          return;
        }

        console.log(`Parsed ${records.length} user records from CSV`);
        
        try {
          let successCount = 0;
          let errorCount = 0;
          
          // Process all records
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            
            if (i % 100 === 0) {
              console.log(`Processing record ${i + 1}/${records.length}...`);
            }
            
            try {
              // Map CSV fields to database columns
              const userData = {
                id: record.id,
                email: record.email,
                first_name: record.first_name,
                category_id: record.category_id ? parseInt(record.category_id) : null,
                phone: record.phone || null,
                password: record.password,
                user_type: record.user_type === 'job_seeker' ? 'job_seeker' : record.user_type
              };

              // Insert user without validation
              const insertQuery = `
                INSERT INTO users (
                  id, email, first_name, category_id, phone, password, user_type,
                  created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
              `;
              
              await pool.query(insertQuery, [
                userData.id,
                userData.email,
                userData.first_name,
                userData.category_id,
                userData.phone,
                userData.password,
                userData.user_type
              ]);
              
              successCount++;
              
            } catch (error) {
              console.error(`Error importing user ${record.id}:`, error.message);
              errorCount++;
            }
          }
          
          console.log(`\nImport completed:`);
          console.log(`✓ Successfully imported: ${successCount} users`);
          console.log(`✗ Errors: ${errorCount} users`);
          console.log(`Total processed: ${records.length} records`);
          
          resolve({ successCount, errorCount, totalRecords: records.length });
          
        } catch (error) {
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importUsersFromCSV()
  .then((result) => {
    console.log('User import process finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('User import process failed:', error);
    process.exit(1);
  });