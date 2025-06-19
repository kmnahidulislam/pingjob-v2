import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';

async function importAllUniqueUsers() {
  console.log('Starting import of ALL user records (email + category_id uniqueness)...');
  
  try {
    // Read and parse CSV
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} user records from CSV`);

    // Use email + category_id combination for uniqueness
    const uniqueUsers = new Map();
    let duplicateCount = 0;
    
    records.forEach((record, index) => {
      const email = record.email.toLowerCase().trim();
      const categoryId = record.category_id ? parseInt(record.category_id) : null;
      const uniqueKey = `${email}|${categoryId}`;
      
      if (uniqueUsers.has(uniqueKey)) {
        duplicateCount++;
        console.log(`Duplicate email+category found: ${email} (category: ${categoryId}) - skipping record ${index + 1}`);
      } else {
        uniqueUsers.set(uniqueKey, {
          id: record.id,
          email: record.email,
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
    console.log(`Found ${uniqueUserArray.length} unique users by email+category combination`);
    console.log(`Removed ${duplicateCount} true duplicates`);

    // Clear existing users first (except admin)
    console.log('Clearing existing job_seeker users...');
    await db.delete(users).where(sql`user_type = 'job_seeker'`);

    let successCount = 0;
    let errorCount = 0;

    // Process in smaller batches for stability
    const batchSize = 20;
    
    for (let i = 0; i < uniqueUserArray.length; i += batchSize) {
      const batch = uniqueUserArray.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueUserArray.length/batchSize)} (${batch.length} users)`);

      try {
        await db.insert(users)
          .values(batch)
          .onConflictDoNothing({ target: users.id });

        successCount += batch.length;
        console.log(`  ✓ Imported ${batch.length} users successfully`);

      } catch (error) {
        console.error(`  ✗ Batch failed, trying individual inserts:`, (error as Error).message);
        
        // Try individual inserts for this batch
        for (const user of batch) {
          try {
            await db.insert(users)
              .values(user)
              .onConflictDoNothing({ target: users.id });
            successCount++;
            console.log(`    ✓ Imported user: ${user.email} (${user.firstName})`);
          } catch (individualError) {
            console.error(`    ✗ Failed user ${user.id}: ${(individualError as Error).message}`);
            errorCount++;
          }
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final verification
    const finalCount = await db.select().from(users);
    const jobSeekerCount = finalCount.filter(u => u.userType === 'job_seeker').length;
    
    console.log('\n=== Complete Import Summary ===');
    console.log(`📊 Original CSV Records: ${records.length}`);
    console.log(`🔄 Unique Users (email+category): ${uniqueUserArray.length}`);
    console.log(`✓ Successfully imported: ${successCount}`);
    console.log(`✗ Import errors: ${errorCount}`);
    console.log(`👥 Job seekers in database: ${jobSeekerCount}`);
    console.log(`📈 Total users in database: ${finalCount.length}`);
    console.log(`🗑️ True duplicates removed: ${duplicateCount}`);

    // Show some examples of users with same email but different categories
    const emailGroups = new Map();
    uniqueUserArray.forEach(user => {
      const email = user.email.toLowerCase();
      if (!emailGroups.has(email)) {
        emailGroups.set(email, []);
      }
      emailGroups.get(email).push(user);
    });

    const multiCategoryEmails = Array.from(emailGroups.entries())
      .filter(([email, users]) => users.length > 1)
      .slice(0, 5);

    if (multiCategoryEmails.length > 0) {
      console.log('\nExamples of users with same email but different categories:');
      multiCategoryEmails.forEach(([email, userList]) => {
        console.log(`📧 ${email}:`);
        userList.forEach(user => {
          console.log(`   - ${user.firstName} (Category: ${user.categoryId})`);
        });
      });
    }

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Import sql for delete operation
import { sql } from 'drizzle-orm';

// Run import
importAllUniqueUsers()
  .then(() => {
    console.log('\n🎉 Complete user import with email+category uniqueness finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ User import failed:', error);
    process.exit(1);
  });