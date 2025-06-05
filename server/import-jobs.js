import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import fs from 'fs';
import { parse } from 'csv-parse';

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: NEON_DATABASE_URL });

async function importJobs() {
  const client = await pool.connect();
  
  try {
    console.log('Starting jobs import...');
    
    // Read and parse CSV
    const csvData = fs.readFileSync('./attached_assets/jobs replit_1749150263370.csv', 'utf8');
    
    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    for await (const record of parser) {
      try {
        // Clean and validate data
        const salaryMin = record.salary_min ? parseInt(record.salary_min) : null;
        const salaryMax = record.salary_max ? parseInt(record.salary_max) : null;
        let salary = '';
        if (salaryMin && salaryMax) {
          salary = `$${salaryMin}k - $${salaryMax}k`;
        } else if (salaryMin) {
          salary = `$${salaryMin}k+`;
        }
        
        // Map experience level numbers to strings
        const experienceLevelMap = {
          1: 'entry',
          2: 'entry', 
          3: 'entry',
          4: 'mid',
          5: 'mid',
          6: 'mid',
          7: 'senior',
          8: 'senior',
          9: 'executive'
        };
        
        const jobData = {
          companyId: record.company_id ? parseInt(record.company_id) : null,
          title: record.title?.trim() || '',
          recruiterId: record.recruiter_id?.trim() || 'admin-krupa',
          categoryId: record.category_id ? parseInt(record.category_id) : null,
          salary: salary,
          employmentType: 'contract',
          description: record.description?.trim() || '',
          skills: record.skills?.trim() ? [record.skills.trim()] : [],
          requirements: record.requirements?.trim() || null,
          country: record.country?.trim() || '',
          state: record.state?.trim() || '',
          city: record.city?.trim() || '',
          location: `${record.city?.trim() || ''}, ${record.state?.trim() || ''}`.replace(/^,\s*/, ''),
          zipCode: record.zip_code?.trim() || '',
          experienceLevel: experienceLevelMap[parseInt(record.experience_level)] || 'mid',
          isActive: record.is_active === 'TRUE' || record.is_active === true
        };
        
        // Skip records with missing required fields
        if (!jobData.title || !jobData.companyId) {
          console.log(`Skipping record ${totalProcessed + 1}: Missing title or company_id`);
          continue;
        }
        
        batch.push(jobData);
        
        // Process batch when it reaches the specified size
        if (batch.length >= batchSize) {
          await processBatch(client, batch);
          successCount += batch.length;
          batch = [];
          
          if (successCount % 1000 === 0) {
            console.log(`Processed ${successCount} jobs successfully...`);
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`Error processing record ${totalProcessed + 1}:`, error.message);
        errorCount++;
      }
    }
    
    // Process any remaining records in the final batch
    if (batch.length > 0) {
      await processBatch(client, batch);
      successCount += batch.length;
    }
    
    console.log(`\nJobs import completed!`);
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
  }
}

async function processBatch(client, batch) {
  try {
    const values = [];
    const placeholders = [];
    
    batch.forEach((job, index) => {
      const baseIndex = index * 16;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16})`
      );
      
      values.push(
        job.companyId,
        job.recruiterId,
        job.categoryId,
        job.title,
        job.description,
        job.requirements,
        job.location,
        job.country,
        job.state,
        job.city,
        job.zipCode,
        job.employmentType,
        job.experienceLevel,
        job.salary,
        job.skills,
        job.isActive
      );
    });
    
    const query = `
      INSERT INTO jobs (
        company_id, recruiter_id, category_id, title, description, requirements, 
        location, country, state, city, zip_code, employment_type, 
        experience_level, salary, skills, is_active
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await client.query(query, values);
    
  } catch (error) {
    console.error('Batch processing error:', error.message);
    // Try individual inserts for this batch
    for (const job of batch) {
      try {
        await insertSingleJob(client, job);
      } catch (singleError) {
        console.error(`Failed to insert job: ${job.title}`, singleError.message);
      }
    }
  }
}

async function insertSingleJob(client, job) {
  const query = `
    INSERT INTO jobs (
      company_id, recruiter_id, category_id, title, description, requirements, 
      location, country, state, city, zip_code, employment_type, 
      experience_level, salary, skills, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  `;
  
  await client.query(query, [
    job.companyId,
    job.recruiterId,
    job.categoryId,
    job.title,
    job.description,
    job.requirements,
    job.location,
    job.country,
    job.state,
    job.city,
    job.zipCode,
    job.employmentType,
    job.experienceLevel,
    job.salary,
    job.skills,
    job.isActive
  ]);
}

// Run the import
importJobs().catch(console.error);