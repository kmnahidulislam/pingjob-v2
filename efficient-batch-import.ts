import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';
import { sql } from 'drizzle-orm';

async function efficientBatchImport() {
  console.log('Starting efficient batch import for all email+category combinations...');
  
  try {
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Processing ${records.length} CSV records...`);

    // Create unique users based on email+category combination
    const uniqueUsers = new Map();
    let counter = 1;
    
    records.forEach((record) => {
      const email = record.email.trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email.toLowerCase()}|${categoryId}`;
      
      if (!uniqueUsers.has(uniqueKey)) {
        // Generate unique ID for each combination
        const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
        const uniqueId = `user_${emailPrefix}_${categoryId}_${counter++}`;
        
        uniqueUsers.set(uniqueKey, {
          id: uniqueId,
          email: email,
          firstName: record.first_name,
          categoryId: categoryId,
          phone: record.phone || null,
          password: record.password,
          userType: 'job_seeker' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    const allUsers = Array.from(uniqueUsers.values());
    console.log(`Created ${allUsers.length} unique email+category combinations`);

    // Clear existing job seekers
    await db.delete(users).where(sql`user_type = 'job_seeker'`);
    console.log('Cleared existing job_seeker users');

    // Insert in larger batches for efficiency
    const batchSize = 100;
    let totalImported = 0;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      try {
        await db.insert(users).values(batch);
        totalImported += batch.length;
        console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allUsers.length/batchSize)} (${totalImported}/${allUsers.length} total)`);
      } catch (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed, trying smaller batches...`);
        
        // Try in smaller chunks
        for (let j = 0; j < batch.length; j += 10) {
          const smallBatch = batch.slice(j, j + 10);
          try {
            await db.insert(users).values(smallBatch);
            totalImported += smallBatch.length;
          } catch (smallError) {
            console.error(`Small batch failed: ${(smallError as Error).message}`);
          }
        }
      }
    }

    // Verify results
    const finalUsers = await db.select().from(users);
    const jobSeekers = finalUsers.filter(u => u.userType === 'job_seeker');
    
    console.log('\n=== Import Complete ===');
    console.log(`Original CSV records: ${records.length}`);
    console.log(`Unique email+category combinations: ${allUsers.length}`);
    console.log(`Successfully imported: ${totalImported}`);
    console.log(`Job seekers in database: ${jobSeekers.length}`);
    console.log(`Total users in database: ${finalUsers.length}`);

    // Show examples of same email with different categories
    const emailMap = new Map();
    jobSeekers.forEach(user => {
      const email = user.email.toLowerCase();
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email).push(user);
    });

    const multiCategory = Array.from(emailMap.entries())
      .filter(([_, users]) => users.length > 1)
      .slice(0, 3);

    if (multiCategory.length > 0) {
      console.log('\nSame email, different categories:');
      multiCategory.forEach(([email, userList]) => {
        console.log(`${email}:`);
        userList.forEach(u => console.log(`  - ${u.firstName} (Category: ${u.categoryId})`));
      });
    }

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

efficientBatchImport()
  .then(() => {
    console.log('\nImport completed successfully!');
    process.exit(0);
  })
  .catch(() => process.exit(1));