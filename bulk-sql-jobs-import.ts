import { db } from './server/db';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function bulkSQLJobsImport() {
  console.log('Starting bulk SQL jobs import...');
  
  // Get existing job IDs
  const existingResult = await db.execute(sql`SELECT id FROM jobs ORDER BY id`);
  const existingIds = new Set(existingResult.rows.map(row => row.id));
  console.log(`Current jobs in database: ${existingIds.size}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const newJobs: any[] = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (existingIds.has(jobId)) return;

        // Prepare cleaned data
        const companyId = parseInt(row.company_id) || 1;
        const categoryId = parseInt(row.category_id) || null;
        const title = (row.title || 'Position Available').replace(/'/g, "''").substring(0, 200);
        const description = (row.description || row.title || 'Description available upon request').replace(/'/g, "''");
        const requirements = (row.requirements || '').replace(/'/g, "''");
        
        newJobs.push({
          id: jobId,
          companyId: companyId > 100000 ? 1 : companyId,
          title,
          description,
          requirements,
          categoryId: categoryId && categoryId <= 200 ? categoryId : null,
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zip_code || '',
          employmentType: row.employment_type || 'Contract',
          experienceLevel: row.experience_level || 'senior',
          salary: row.salary || '75',
        });
      })
      .on('end', async () => {
        console.log(`Total CSV rows processed: ${rowCount}`);
        console.log(`New jobs to import: ${newJobs.length}`);

        if (newJobs.length === 0) {
          console.log('All jobs already imported!');
          resolve(0);
          return;
        }

        try {
          // Process in chunks of 1000 for efficient bulk inserts
          const chunkSize = 1000;
          let totalImported = 0;

          for (let i = 0; i < newJobs.length; i += chunkSize) {
            const chunk = newJobs.slice(i, i + chunkSize);
            const chunkNum = Math.floor(i / chunkSize) + 1;
            const totalChunks = Math.ceil(newJobs.length / chunkSize);
            
            console.log(`Processing chunk ${chunkNum}/${totalChunks} (${chunk.length} jobs)`);

            // Build VALUES clause for bulk insert
            const values = chunk.map(job => {
              return `(${job.id}, ${job.companyId}, '${job.title}', '${job.description}', '${job.requirements}', ${job.categoryId}, '${job.country}', '${job.state}', '${job.city}', '${job.zipCode}', '${job.employmentType}', '${job.experienceLevel}', '${job.salary}', true, NOW(), NOW(), 'admin')`;
            }).join(',\n');

            const insertSQL = `
              INSERT INTO jobs (
                id, company_id, title, description, requirements, category_id, 
                country, state, city, zip_code, employment_type, experience_level, 
                salary, is_active, created_at, updated_at, recruiter_id
              ) VALUES ${values}
              ON CONFLICT (id) DO NOTHING
            `;

            try {
              const result = await db.execute(sql.raw(insertSQL));
              totalImported += chunk.length;
              console.log(`✓ Chunk ${chunkNum} completed successfully`);
            } catch (chunkError: any) {
              console.error(`✗ Chunk ${chunkNum} failed:`, chunkError.message);
              
              // Fallback: try smaller batches of 100
              for (let j = 0; j < chunk.length; j += 100) {
                const subChunk = chunk.slice(j, j + 100);
                const subValues = subChunk.map(job => {
                  return `(${job.id}, ${job.companyId}, '${job.title}', '${job.description}', '${job.requirements}', ${job.categoryId}, '${job.country}', '${job.state}', '${job.city}', '${job.zipCode}', '${job.employmentType}', '${job.experienceLevel}', '${job.salary}', true, NOW(), NOW(), 'admin')`;
                }).join(',\n');

                const subInsertSQL = `
                  INSERT INTO jobs (
                    id, company_id, title, description, requirements, category_id, 
                    country, state, city, zip_code, employment_type, experience_level, 
                    salary, is_active, created_at, updated_at, recruiter_id
                  ) VALUES ${subValues}
                  ON CONFLICT (id) DO NOTHING
                `;

                try {
                  await db.execute(sql.raw(subInsertSQL));
                  totalImported += subChunk.length;
                } catch (subError) {
                  console.error(`Sub-batch failed, skipping ${subChunk.length} jobs`);
                }
              }
            }
          }

          // Final verification
          const finalResult = await db.execute(sql`SELECT COUNT(*) as count FROM jobs`);
          const finalCount = finalResult.rows[0].count;

          console.log(`\n=== BULK SQL IMPORT COMPLETED ===`);
          console.log(`Jobs processed: ${newJobs.length}`);
          console.log(`Jobs imported: ${totalImported}`);
          console.log(`Total jobs in database: ${finalCount}`);
          console.log(`Success rate: ${((totalImported / newJobs.length) * 100).toFixed(1)}%`);

          resolve(totalImported);
        } catch (error) {
          console.error('Bulk import error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

bulkSQLJobsImport()
  .then((count) => {
    console.log(`Bulk SQL import completed: ${count} jobs imported`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Bulk SQL import failed:', error);
    process.exit(1);
  });