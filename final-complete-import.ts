import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';
import { sql } from 'drizzle-orm';

async function finalCompleteImport() {
  console.log('Starting final complete import of all unique email+category combinations...');
  
  try {
    // Read and parse CSV
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} user records from CSV`);

    // Generate unique IDs for each email+category combination
    const uniqueUsers = new Map();
    let idCounter = 1;
    
    records.forEach((record, index) => {
      const email = record.email.toLowerCase().trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email}|${categoryId}`;
      
      if (!uniqueUsers.has(uniqueKey)) {
        // Generate a unique ID based on email and category
        const baseId = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const uniqueId = `${baseId}_cat${categoryId}_${idCounter++}`;
        
        uniqueUsers.set(uniqueKey, {
          id: uniqueId,
          email: record.email.trim(),
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

    const uniqueUserArray = Array.from(uniqueUsers.values());
    console.log(`Created ${uniqueUserArray.length} unique user records from ${records.length} CSV rows`);

    // Clear existing job_seeker users
    console.log('Clearing existing job_seeker users...');
    await db.delete(users).where(sql`user_type = 'job_seeker'`);

    let successCount = 0;
    let errorCount = 0;

    // Import each user individually to handle any remaining conflicts
    for (let i = 0; i < uniqueUserArray.length; i++) {
      const user = uniqueUserArray[i];
      
      if (i % 100 === 0) {
        console.log(`Processing user ${i + 1}/${uniqueUserArray.length}...`);
      }

      try {
        await db.insert(users).values(user);
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${user.email} (${user.firstName}): ${(error as Error).message}`);
        errorCount++;
      }
    }

    // Final verification
    const finalUsers = await db.select().from(users);
    const jobSeekerUsers = finalUsers.filter(u => u.userType === 'job_seeker');
    
    console.log('\n=== Final Import Summary ===');
    console.log(`📊 Original CSV Records: ${records.length}`);
    console.log(`🔄 Unique Email+Category Combinations: ${uniqueUserArray.length}`);
    console.log(`✓ Successfully imported: ${successCount}`);
    console.log(`✗ Import errors: ${errorCount}`);
    console.log(`👥 Job seekers in database: ${jobSeekerUsers.length}`);
    console.log(`📈 Total users in database: ${finalUsers.length}`);

    // Show examples of same email with different categories
    const emailGroups = new Map();
    jobSeekerUsers.forEach(user => {
      const email = user.email.toLowerCase();
      if (!emailGroups.has(email)) {
        emailGroups.set(email, []);
      }
      emailGroups.get(email).push(user);
    });

    const multiCategoryEmails = Array.from(emailGroups.entries())
      .filter(([email, userList]) => userList.length > 1)
      .slice(0, 5);

    if (multiCategoryEmails.length > 0) {
      console.log('\nExamples of users with same email but different categories:');
      multiCategoryEmails.forEach(([email, userList]) => {
        console.log(`📧 ${email}:`);
        userList.forEach(user => {
          console.log(`   - ${user.firstName} (Category: ${user.categoryId}, ID: ${user.id})`);
        });
      });
    }

    console.log(`\nImport completed! Database now contains all unique email+category combinations.`);

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Run import
finalCompleteImport()
  .then(() => {
    console.log('\nFinal complete import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFinal import failed:', error);
    process.exit(1);
  });