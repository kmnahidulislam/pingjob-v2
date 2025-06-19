import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { users } from './shared/schema';

async function importUsersFromCSV() {
  console.log('Starting direct user import...');
  
  try {
    // Read and parse CSV
    const csvContent = readFileSync('./attached_assets/users_MySQL_1750342630017.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} user records`);

    let successCount = 0;
    let errorCount = 0;

    // Process in smaller batches to avoid memory issues
    const batchSize = 50;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);

      try {
        // Prepare batch data
        const userData = batch.map(record => ({
          id: record.id,
          email: record.email,
          firstName: record.first_name,
          categoryId: record.category_id ? parseInt(record.category_id) : null,
          phone: record.phone || null,
          password: record.password,
          userType: record.user_type as 'job_seeker',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // Insert batch using Drizzle
        const result = await db.insert(users)
          .values(userData)
          .onConflictDoNothing({ target: users.id });

        successCount += userData.length;
        console.log(`  ✓ Processed ${userData.length} users`);

      } catch (error) {
        console.error(`  ✗ Batch failed:`, (error as Error).message);
        errorCount += batch.length;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n=== Import Summary ===');
    console.log(`✓ Successfully processed: ${successCount} users`);
    console.log(`✗ Errors: ${errorCount} users`);
    console.log(`📊 Total records: ${records.length}`);

    // Verify final count
    const finalCount = await db.select().from(users);
    console.log(`📈 Total users in database: ${finalCount.length}`);

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Run import
importUsersFromCSV()
  .then(() => {
    console.log('\n🎉 User import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ User import failed:', error);
    process.exit(1);
  });