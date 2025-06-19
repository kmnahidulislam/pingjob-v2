import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';
import { sql } from 'drizzle-orm';

async function importUsersFromCSV() {
  console.log('Starting user import with email+category combinations...');
  
  try {
    // Read CSV file
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Processing ${records.length} user records...`);

    // Process unique email+category combinations
    const uniqueUsers = new Map();
    let counter = 1;
    
    records.forEach((record) => {
      const email = record.email.trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email.toLowerCase()}|${categoryId}`;
      
      if (!uniqueUsers.has(uniqueKey)) {
        // Create unique ID for each email+category combination
        const emailBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        const uniqueId = `${emailBase}_${categoryId}_${counter}`;
        
        uniqueUsers.set(uniqueKey, {
          id: uniqueId,
          email: email,
          firstName: record.first_name || 'User',
          lastName: null,
          profileImageUrl: null,
          userType: 'job_seeker' as const,
          categoryId: categoryId,
          headline: null,
          summary: null,
          location: null,
          industry: null,
          resetToken: null,
          resetTokenExpiry: null,
          password: record.password || 'default_password',
          phone: record.phone || null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        counter++;
      }
    });

    const allUsers = Array.from(uniqueUsers.values());
    console.log(`Found ${allUsers.length} unique email+category combinations`);

    // Clear existing job_seeker users but keep admin
    console.log('Removing existing job_seeker users...');
    await db.execute(sql`DELETE FROM users WHERE user_type = 'job_seeker'`);

    // Import users in batches
    const batchSize = 50;
    let importedCount = 0;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      try {
        await db.insert(users).values(batch);
        importedCount += batch.length;
        console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allUsers.length/batchSize)} - Total: ${importedCount}/${allUsers.length}`);
      } catch (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, (error as Error).message);
        
        // Try individual inserts for failed batch
        for (const user of batch) {
          try {
            await db.insert(users).values(user);
            importedCount++;
          } catch (individualError) {
            console.error(`Failed to import user ${user.email} (${user.categoryId}):`, (individualError as Error).message);
          }
        }
      }
    }

    // Verify import
    const totalUsers = await db.select().from(users);
    const jobSeekers = totalUsers.filter(u => u.userType === 'job_seeker');
    
    console.log('\n=== Import Results ===');
    console.log(`CSV records processed: ${records.length}`);
    console.log(`Unique email+category combinations: ${allUsers.length}`); 
    console.log(`Successfully imported: ${importedCount}`);
    console.log(`Job seekers in database: ${jobSeekers.length}`);
    console.log(`Total users in database: ${totalUsers.length}`);

    // Show examples of same email with different categories
    const emailGroups = new Map();
    jobSeekers.forEach(user => {
      const email = user.email.toLowerCase();
      if (!emailGroups.has(email)) emailGroups.set(email, []);
      emailGroups.get(email).push(user);
    });

    const multiCategory = Array.from(emailGroups.entries())
      .filter(([_, userList]) => userList.length > 1)
      .slice(0, 3);

    if (multiCategory.length > 0) {
      console.log('\nExamples of same email with different categories:');
      multiCategory.forEach(([email, userList]) => {
        console.log(`${email}:`);
        userList.forEach(u => console.log(`  - ${u.firstName} (Category: ${u.categoryId}, ID: ${u.id})`));
      });
    }

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

importUsersFromCSV()
  .then(() => {
    console.log('\nUser import completed!');
    process.exit(0);
  })
  .catch(() => process.exit(1));