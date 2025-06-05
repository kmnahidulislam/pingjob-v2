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

async function completeJobsImport() {
  const client = await pool.connect();
  
  try {
    console.log('Starting complete jobs import...');
    
    // First, get all unique company IDs from the jobs CSV to create missing companies
    const csvData = fs.readFileSync('./attached_assets/jobs replit_1749150263370.csv', 'utf8');
    const companyIdsFromJobs = new Set();
    const categoryIdsFromJobs = new Set();
    
    const parser = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log('Analyzing jobs data for missing companies and categories...');
    
    for await (const record of parser) {
      if (record.company_id) {
        companyIdsFromJobs.add(parseInt(record.company_id));
      }
      if (record.category_id) {
        categoryIdsFromJobs.add(parseInt(record.category_id));
      }
    }
    
    console.log(`Found ${companyIdsFromJobs.size} unique company IDs in jobs data`);
    console.log(`Found ${categoryIdsFromJobs.size} unique category IDs in jobs data`);
    
    // Get existing company and category IDs
    const existingCompanies = await client.query('SELECT id FROM companies');
    const existingCategories = await client.query('SELECT id FROM categories');
    
    const existingCompanyIds = new Set(existingCompanies.rows.map(row => row.id));
    const existingCategoryIds = new Set(existingCategories.rows.map(row => row.id));
    
    console.log(`Existing companies: ${existingCompanyIds.size}`);
    console.log(`Existing categories: ${existingCategoryIds.size}`);
    
    // Create missing companies
    const missingCompanyIds = [...companyIdsFromJobs].filter(id => !existingCompanyIds.has(id));
    console.log(`Creating ${missingCompanyIds.length} missing companies...`);
    
    for (const companyId of missingCompanyIds) {
      try {
        await client.query(`
          INSERT INTO companies (id, user_id, name, industry, description, status, size)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          companyId,
          'admin-krupa',
          `Company ${companyId}`,
          'Technology',
          `Auto-generated company profile for company ID ${companyId}`,
          'approved',
          '50-200'
        ]);
      } catch (error) {
        console.error(`Error creating company ${companyId}:`, error.message);
      }
    }
    
    // Create missing categories
    const missingCategoryIds = [...categoryIdsFromJobs].filter(id => !existingCategoryIds.has(id));
    console.log(`Creating ${missingCategoryIds.length} missing categories...`);
    
    for (const categoryId of missingCategoryIds) {
      try {
        await client.query(`
          INSERT INTO categories (id, name, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO NOTHING
        `, [
          categoryId,
          `Category ${categoryId}`,
          `Auto-generated category for category ID ${categoryId}`
        ]);
      } catch (error) {
        console.error(`Error creating category ${categoryId}:`, error.message);
      }
    }
    
    console.log('Missing companies and categories created. Now importing jobs...');
    
    // Now import all jobs
    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50;
    let batch = [];
    
    const parser2 = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    for await (const record of parser2) {
      try {
        // Map experience level numbers to strings
        const experienceLevelMap = {
          1: 'entry', 2: 'entry', 3: 'entry',
          4: 'mid', 5: 'mid', 6: 'mid',
          7: 'senior', 8: 'senior', 9: 'executive'
        };
        
        const salaryMin = record.salary_min ? parseInt(record.salary_min) : null;
        const salaryMax = record.salary_max ? parseInt(record.salary_max) : null;
        let salary = '';
        if (salaryMin && salaryMax && salaryMin > 0) {
          salary = `$${salaryMin}k - $${salaryMax}k`;
        } else if (salaryMin && salaryMin > 0) {
          salary = `$${salaryMin}k+`;
        }
        
        const jobData = {
          companyId: record.company_id ? parseInt(record.company_id) : null,
          title: record.title?.trim() || '',
          recruiterId: record.recruiter_id?.trim() || 'admin-krupa',
          categoryId: record.category_id ? parseInt(record.category_id) : null,
          salary: salary,
          jobType: 'contract',
          description: record.description?.trim() || '',
          skills: record.skills?.trim() ? [record.skills.trim()] : [],
          requirements: record.requirements?.trim() || null,
          country: record.country?.trim() || 'United States',
          state: record.state?.trim() || '',
          city: record.city?.trim() || '',
          location: `${record.city?.trim() || ''}, ${record.state?.trim() || ''}`.replace(/^,\s*/, ''),
          zipCode: record.zip_code?.trim() || '',
          experienceLevel: experienceLevelMap[parseInt(record.experience_level)] || 'mid',
          isActive: record.is_active === 'TRUE' || record.is_active === true
        };
        
        // Skip if missing required fields
        if (!jobData.title || !jobData.companyId) {
          continue;
        }
        
        batch.push(jobData);
        
        if (batch.length >= batchSize) {
          await processBatch(client, batch);
          successCount += batch.length;
          batch = [];
          
          if (successCount % 1000 === 0) {
            console.log(`Successfully imported ${successCount} jobs...`);
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`Error processing job record ${totalProcessed + 1}:`, error.message);
        errorCount++;
      }
    }
    
    // Process remaining batch
    if (batch.length > 0) {
      await processBatch(client, batch);
      successCount += batch.length;
    }
    
    console.log(`\nJobs import completed!`);
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Final count
    const finalJobCount = await client.query('SELECT COUNT(*) as count FROM jobs');
    const finalCompanyCount = await client.query('SELECT COUNT(*) as count FROM companies');
    const finalCategoryCount = await client.query('SELECT COUNT(*) as count FROM categories');
    
    console.log(`\nFinal database counts:`);
    console.log(`Jobs: ${finalJobCount.rows[0].count}`);
    console.log(`Companies: ${finalCompanyCount.rows[0].count}`);
    console.log(`Categories: ${finalCategoryCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
  }
}

async function processBatch(client, batch) {
  const values = [];
  const placeholders = [];
  
  batch.forEach((job, index) => {
    const baseIndex = index * 16;
    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16})`
    );
    
    values.push(
      job.companyId, job.recruiterId, job.categoryId, job.title, job.description,
      job.requirements, job.location, job.country, job.state, job.city,
      job.zipCode, job.jobType, job.experienceLevel, job.salary, job.skills, job.isActive
    );
  });
  
  const query = `
    INSERT INTO jobs (
      company_id, recruiter_id, category_id, title, description, requirements, 
      location, country, state, city, zip_code, job_type, 
      experience_level, salary, skills, is_active
    ) VALUES ${placeholders.join(', ')}
    ON CONFLICT (id) DO NOTHING
  `;
  
  await client.query(query, values);
}

// Run the import
completeJobsImport().catch(console.error);