import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

async function updateVEDAddress() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Dropping unique email constraint...');
    
    // Drop the unique constraint on email column
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
    `);
    
    console.log('Unique email constraint dropped successfully');

    // Now proceed with the user import
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Processing ${records.length} user records...`);

    // Create unique email+category combinations
    const uniqueUsers = new Map();
    let counter = 1;
    
    records.forEach((record) => {
      const email = record.email.trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email.toLowerCase()}|${categoryId}`;
      
      if (!uniqueUsers.has(uniqueKey)) {
        const emailBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        const uniqueId = `${emailBase}_${categoryId}_${counter}`;
        
        uniqueUsers.set(uniqueKey, {
          id: uniqueId,
          email: email,
          first_name: record.first_name || 'User',
          category_id: categoryId,
          phone: record.phone || null,
          password: record.password || 'default_password',
          user_type: 'job_seeker'
        });
        counter++;
      }
    });

    const allUsers = Array.from(uniqueUsers.values());
    console.log(`Found ${allUsers.length} unique email+category combinations`);

    // Clear existing job_seeker users
    console.log('Clearing existing job_seeker users...');
    await pool.query(`DELETE FROM users WHERE user_type = 'job_seeker'`);

    // Insert users in batches
    let imported = 0;
    const batchSize = 50;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      // Build batch insert query
      const values = batch.map((user, idx) => {
        const baseIdx = idx * 11;
        return `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, $${baseIdx + 11})`;
      }).join(', ');
      
      const params = batch.flatMap(user => [
        user.id,
        user.email,
        user.password,
        user.first_name,
        null, // lastName
        null, // profileImageUrl
        user.user_type,
        user.category_id,
        null, // headline
        null, // summary
        user.phone
      ]);
      
      const query = `
        INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, user_type, category_id, headline, summary, phone)
        VALUES ${values}
      `;
      
      try {
        await pool.query(query, params);
        imported += batch.length;
        console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allUsers.length/batchSize)} - Total: ${imported}/${allUsers.length}`);
      } catch (error) {
        console.error(`Batch failed:`, (error as Error).message);
      }
    }

    // Verify results
    const result = await pool.query('SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type');
    console.log('\n=== Final Results ===');
    console.log(`CSV records: ${records.length}`);
    console.log(`Unique combinations: ${allUsers.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log('User counts by type:', result.rows);

    // Show examples of same email with different categories
    const duplicateCheck = await pool.query(`
      SELECT email, category_id, first_name, COUNT(*) as count
      FROM users 
      WHERE user_type = 'job_seeker'
      GROUP BY email, category_id, first_name
      ORDER BY email
      LIMIT 10
    `);
    
    console.log('\nSample user records:');
    duplicateCheck.rows.forEach((row: any) => {
      console.log(`${row.email} - ${row.first_name} (Category: ${row.category_id})`);
    });

  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    await pool.end();
  }
}

updateVEDAddress()
  .then(() => {
    console.log('\nUser import with email+category combinations completed!');
    process.exit(0);
  })
  .catch(() => process.exit(1));