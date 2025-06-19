import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';

async function importAllUsersFromCSV() {
  console.log('Starting complete user import from CSV...');
  
  try {
    // Read and parse CSV
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} user records from CSV`);

    // Remove duplicates by email and ID
    const uniqueUsers = new Map();
    const duplicateEmails = new Set();
    
    records.forEach((record, index) => {
      const email = record.email.toLowerCase().trim();
      const id = record.id.trim();
      
      if (uniqueUsers.has(email)) {
        duplicateEmails.add(email);
        console.log(`Duplicate email found: ${email} (skipping record ${index + 1})`);
      } else {
        uniqueUsers.set(email, {
          id,
          email: record.email,
          firstName: record.first_name,
          categoryId: record.category_id ? parseInt(record.category_id) : null,
          phone: record.phone || null,
          password: record.password,
          userType: 'job_seeker' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    const uniqueUserArray = Array.from(uniqueUsers.values());
    console.log(`Found ${uniqueUserArray.length} unique users (${duplicateEmails.size} duplicate emails removed)`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches of 25 for better stability
    const batchSize = 25;
    
    for (let i = 0; i < uniqueUserArray.length; i += batchSize) {
      const batch = uniqueUserArray.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueUserArray.length/batchSize)} (${batch.length} users)`);

      try {
        await db.insert(users)
          .values(batch)
          .onConflictDoNothing({ target: users.id });

        successCount += batch.length;
        console.log(`  ✓ Processed ${batch.length} users successfully`);

      } catch (error) {
        console.error(`  ✗ Batch failed:`, (error as Error).message);
        
        // Try individual inserts for this batch
        for (const user of batch) {
          try {
            await db.insert(users)
              .values(user)
              .onConflictDoNothing({ target: users.id });
            successCount++;
          } catch (individualError) {
            console.error(`    ✗ Failed to insert user ${user.id}: ${(individualError as Error).message}`);
            errorCount++;
          }
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final verification
    const finalCount = await db.select().from(users);
    
    console.log('\n=== Complete Import Summary ===');
    console.log(`📊 CSV Records: ${records.length}`);
    console.log(`🔄 Unique Users: ${uniqueUserArray.length}`);
    console.log(`✓ Successfully imported: ${successCount}`);
    console.log(`✗ Import errors: ${errorCount}`);
    console.log(`📈 Total users in database: ${finalCount.length}`);
    console.log(`📧 Duplicate emails found: ${duplicateEmails.size}`);

    if (duplicateEmails.size > 0) {
      console.log('\nDuplicate emails removed:');
      Array.from(duplicateEmails).slice(0, 10).forEach(email => {
        console.log(`  - ${email}`);
      });
      if (duplicateEmails.size > 10) {
        console.log(`  ... and ${duplicateEmails.size - 10} more`);
      }
    }

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Run import
importAllUsersFromCSV()
  .then(() => {
    console.log('\n🎉 Complete user import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Complete user import failed:', error);
    process.exit(1);
  });