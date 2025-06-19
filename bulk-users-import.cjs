const fs = require('fs');
const { parse } = require('csv-parse');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

async function bulkImportUsers() {
  console.log('Starting bulk user import from CSV...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read CSV file
    const csvContent = fs.readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    
    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    console.log(`Parsed ${records.length} user records`);

    let successCount = 0;
    let errorCount = 0;

    // Import users in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} records)`);

      // Build batch insert query
      const values = [];
      const placeholders = [];
      
      batch.forEach((record, index) => {
        const baseIndex = index * 7;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`);
        
        values.push(
          record.id,
          record.email,
          record.first_name,
          record.category_id ? parseInt(record.category_id) : null,
          record.phone || null,
          record.password,
          record.user_type === 'job_seeker' ? 'job_seeker' : record.user_type
        );
      });

      const insertQuery = `
        INSERT INTO users (id, email, first_name, category_id, phone, password, user_type)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
      `;

      try {
        const result = await pool.query(insertQuery, values);
        const insertedCount = result.rowCount || 0;
        successCount += insertedCount;
        console.log(`  ✓ Inserted ${insertedCount} users in this batch`);
      } catch (error) {
        console.error(`  ✗ Batch failed:`, error.message);
        errorCount += batch.length;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`\n=== Import Summary ===`);
    console.log(`✓ Successfully imported: ${successCount} users`);
    console.log(`✗ Errors/Conflicts: ${errorCount} users`);
    console.log(`📊 Total processed: ${records.length} records`);

    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`📈 Total users in database: ${countResult.rows[0].total}`);

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run import
bulkImportUsers()
  .then(() => {
    console.log('\n🎉 User import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ User import failed:', error);
    process.exit(1);
  });