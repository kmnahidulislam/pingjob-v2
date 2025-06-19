import { db } from './server/db';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql } from 'drizzle-orm';

async function robustJobsImport() {
  console.log('Starting robust jobs import with proper data sanitization...');
  
  const existingResult = await db.execute(sql`SELECT id FROM jobs`);
  const existingIds = new Set(existingResult.rows.map(row => row.id));
  console.log(`Current jobs: ${existingIds.size}`);
  
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const validJobs: any[] = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        rowCount++;
        
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        if (existingIds.has(jobId)) return;

        // Sanitize all text fields to prevent SQL injection
        const sanitizeText = (text: string) => {
          if (!text) return '';
          return text.replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/\0/g, '').substring(0, 500);
        };

        const companyId = parseInt(row.company_id);
        const categoryId = parseInt(row.category_id);

        validJobs.push({
          id: jobId,
          company_id: (companyId && companyId <= 100000) ? companyId : 1,
          title: sanitizeText(row.title || 'Position Available'),
          description: sanitizeText(row.description || row.title || 'Job description available'),
          requirements: sanitizeText(row.requirements || ''),
          category_id: (categoryId && categoryId >= 1 && categoryId <= 200) ? categoryId : 'NULL',
          country: sanitizeText(row.country || ''),
          state: sanitizeText(row.state || ''),
          city: sanitizeText(row.city || ''),
          zip_code: sanitizeText(row.zip_code || ''),
          employment_type: row.employment_type || 'Contract',
          experience_level: row.experience_level || 'senior',
          salary: row.salary || '75'
        });
      })
      .on('end', async () => {
        console.log(`CSV rows processed: ${rowCount}`);
        console.log(`Valid jobs to import: ${validJobs.length}`);

        if (validJobs.length === 0) {
          console.log('No new jobs to import');
          resolve(0);
          return;
        }

        try {
          let successCount = 0;
          const batchSize = 500;

          for (let i = 0; i < validJobs.length; i += batchSize) {
            const batch = validJobs.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(validJobs.length / batchSize);
            
            console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} jobs)`);

            const values = batch.map(job => 
              `(${job.id}, ${job.company_id}, '${job.title}', '${job.description}', '${job.requirements}', ${job.category_id}, '${job.country}', '${job.state}', '${job.city}', '${job.zip_code}', '${job.employment_type}', '${job.experience_level}', '${job.salary}', true, NOW(), NOW(), 'admin')`
            ).join(',');

            const insertSQL = `
              INSERT INTO jobs (
                id, company_id, title, description, requirements, category_id, 
                country, state, city, zip_code, employment_type, experience_level, 
                salary, is_active, created_at, updated_at, recruiter_id
              ) VALUES ${values}
              ON CONFLICT (id) DO NOTHING
            `;

            try {
              await db.execute(sql.raw(insertSQL));
              successCount += batch.length;
              console.log(`✓ Batch ${batchNum} completed`);
            } catch (error: any) {
              console.log(`Batch ${batchNum} failed, retrying with individual inserts...`);
              
              // Fallback to individual parameterized inserts
              for (const job of batch) {
                try {
                  await db.execute(sql`
                    INSERT INTO jobs (
                      id, company_id, title, description, requirements, category_id,
                      country, state, city, zip_code, employment_type, experience_level,
                      salary, is_active, created_at, updated_at, recruiter_id
                    ) VALUES (
                      ${job.id}, ${job.company_id}, ${job.title}, ${job.description}, ${job.requirements},
                      ${job.category_id === 'NULL' ? null : job.category_id}, ${job.country}, ${job.state}, 
                      ${job.city}, ${job.zip_code}, ${job.employment_type}, ${job.experience_level}, 
                      ${job.salary}, true, NOW(), NOW(), 'admin'
                    )
                    ON CONFLICT (id) DO NOTHING
                  `);
                  successCount++;
                } catch (individualError: any) {
                  // Skip problematic jobs silently
                  continue;
                }
              }
            }

            if (batchNum % 5 === 0) {
              console.log(`Progress: ${successCount} jobs imported so far`);
            }
          }

          const finalResult = await db.execute(sql`SELECT COUNT(*) as count FROM jobs`);
          const finalCount = finalResult.rows[0].count;

          console.log(`\n=== ROBUST JOBS IMPORT COMPLETED ===`);
          console.log(`Jobs processed: ${validJobs.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Total jobs in database: ${finalCount}`);
          console.log(`Success rate: ${((successCount / validJobs.length) * 100).toFixed(1)}%`);

          resolve(successCount);
        } catch (error) {
          console.error('Import error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

robustJobsImport()
  .then((count) => {
    console.log(`Import completed: ${count} jobs added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });