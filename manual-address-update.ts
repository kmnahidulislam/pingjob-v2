import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { cleanPool, cleanDb } from './server/clean-neon';
import { sql } from 'drizzle-orm';

async function updateSampleCompanies() {
  try {
    console.log('Dropping unique email constraint from users table...');
    
    // Drop the unique constraint to allow same email with different categories
    await cleanPool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;`);
    console.log('Unique email constraint removed successfully');

    // Read and process CSV data
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Processing ${records.length} user records from CSV...`);

    // Create unique combinations of email + category
    const uniqueUsers = new Map();
    let idCounter = 1;
    
    records.forEach((record) => {
      const email = record.email.trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email.toLowerCase()}|${categoryId}`;
      
      if (!uniqueUsers.has(uniqueKey)) {
        const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
        const uniqueId = `${emailPrefix}_cat${categoryId}_${idCounter}`;
        
        uniqueUsers.set(uniqueKey, {
          id: uniqueId,
          email: email,
          password: record.password || 'encrypted_password',
          first_name: record.first_name || 'User',
          last_name: null,
          profile_image_url: null,
          user_type: 'job_seeker',
          category_id: categoryId,
          headline: null,
          summary: null,
          location: null,
          industry: null,
          reset_token: null,
          reset_token_expiry: null,
          phone: record.phone || null,
          created_at: new Date(),
          updated_at: new Date()
        });
        idCounter++;
      }
    });

    const allUsers = Array.from(uniqueUsers.values());
    console.log(`Found ${allUsers.length} unique email+category combinations`);

    // Clear existing job_seeker users
    console.log('Removing existing job_seeker users...');
    await cleanPool.query(`DELETE FROM users WHERE user_type = 'job_seeker'`);

    // Insert users in batches
    let successfulImports = 0;
    const batchSize = 25; // Smaller batches for stability
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      try {
        // Build parameterized query for batch insert
        const placeholders = batch.map((_, idx) => {
          const base = idx * 16;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`;
        }).join(', ');
        
        const values = batch.flatMap(user => [
          user.id,
          user.email,
          user.password,
          user.first_name,
          user.last_name,
          user.profile_image_url,
          user.user_type,
          user.category_id,
          user.headline,
          user.summary,
          user.location,
          user.industry,
          user.reset_token,
          user.reset_token_expiry,
          user.phone,
          user.created_at
        ]);
        
        const insertQuery = `
          INSERT INTO users (
            id, email, password, first_name, last_name, profile_image_url,
            user_type, category_id, headline, summary, location, industry,
            reset_token, reset_token_expiry, phone, created_at
          ) VALUES ${placeholders}
        `;
        
        await cleanPool.query(insertQuery, values);
        successfulImports += batch.length;
        console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allUsers.length/batchSize)} - Total: ${successfulImports}/${allUsers.length}`);
        
      } catch (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, (error as Error).message);
      }
    }

    // Verify final results
    const userCounts = await cleanPool.query(`
      SELECT user_type, COUNT(*) as count 
      FROM users 
      GROUP BY user_type
    `);
    
    console.log('\n=== Import Complete ===');
    console.log(`Original CSV records: ${records.length}`);
    console.log(`Unique email+category combinations: ${allUsers.length}`);
    console.log(`Successfully imported: ${successfulImports}`);
    console.log('User counts by type:');
    userCounts.rows.forEach((row: any) => {
      console.log(`  ${row.user_type}: ${row.count}`);
    });

    // Show examples of same email with different categories
    const sampleUsers = await cleanPool.query(`
      SELECT email, category_id, first_name
      FROM users 
      WHERE user_type = 'job_seeker'
      ORDER BY email, category_id
      LIMIT 10
    `);
    
    console.log('\nSample imported users:');
    sampleUsers.rows.forEach((row: any) => {
      console.log(`  ${row.email} - ${row.first_name} (Category: ${row.category_id})`);
    });

    // Check for same email with different categories
    const multiCategoryEmails = await cleanPool.query(`
      SELECT email, COUNT(DISTINCT category_id) as category_count,
             array_agg(DISTINCT category_id) as categories,
             array_agg(DISTINCT first_name) as names
      FROM users 
      WHERE user_type = 'job_seeker'
      GROUP BY email
      HAVING COUNT(DISTINCT category_id) > 1
      LIMIT 5
    `);
    
    if (multiCategoryEmails.rows.length > 0) {
      console.log('\nExamples of same email with different categories:');
      multiCategoryEmails.rows.forEach((row: any) => {
        console.log(`  ${row.email}: ${row.category_count} categories (${row.categories.join(', ')})`);
      });
    }

  } catch (error) {
    console.error('Import operation failed:', error);
  } finally {
    await cleanPool.end();
  }
}

updateSampleCompanies()
  .then(() => {
    console.log('\nUser import with email+category uniqueness completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });