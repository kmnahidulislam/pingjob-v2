import { db } from './db.js';
import { jobs, companies } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function drizzleImport() {
  console.log('Starting Drizzle import to Neon database...');
  
  try {
    // Check current job count
    const currentJobs = await db.select().from(jobs);
    console.log(`Current job count: ${currentJobs.length}`);

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'jobs replit_1749150263370.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log(`Found ${lines.length - 1} job records in CSV`);

    // Clear existing jobs
    await db.delete(jobs);
    console.log('Cleared existing jobs');

    // Get available companies
    const allCompanies = await db.select().from(companies);
    console.log(`Available companies: ${allCompanies.length}`);

    let inserted = 0;
    const batchSize = 50;
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const jobsToInsert = [];
      
      for (const line of batch) {
        try {
          const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (cols.length < 4) continue;
          
          const jobTitle = cols[0] || 'Software Engineer';
          const companyName = cols[1] || 'Tech Company';
          const location = cols[2] || 'Remote';
          const description = cols[3] || 'Join our team';
          const requirements = cols[4] || 'Experience required';
          
          // Find company by name (case insensitive)
          let companyId = 7; // Default to existing company
          const matchingCompany = allCompanies.find(c => 
            c.name.toLowerCase().includes(companyName.toLowerCase()) ||
            companyName.toLowerCase().includes(c.name.toLowerCase())
          );
          
          if (matchingCompany) {
            companyId = matchingCompany.id;
          }
          
          jobsToInsert.push({
            companyId: companyId,
            recruiterId: 'admin-krupa',
            title: jobTitle.substring(0, 200),
            description: description.substring(0, 2000),
            requirements: requirements.substring(0, 1000),
            location: location.substring(0, 100),
            country: 'United States',
            employmentType: 'full-time',
            isActive: true,
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
        } catch (error) {
          console.error(`Error processing job ${i}:`, error.message);
        }
      }
      
      // Insert batch
      if (jobsToInsert.length > 0) {
        await db.insert(jobs).values(jobsToInsert);
        inserted += jobsToInsert.length;
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}, total: ${inserted} jobs`);
      }
    }

    // Final verification
    const finalJobs = await db.select().from(jobs);
    console.log(`Import complete! Jobs inserted: ${inserted}, Total in DB: ${finalJobs.length}`);
    
    // Show sample jobs with company info
    const sampleJobs = await db.select({
      id: jobs.id,
      title: jobs.title,
      companyName: companies.name
    }).from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .limit(5);
    
    console.log('Sample jobs:');
    sampleJobs.forEach(job => {
      console.log(`- ${job.id}: ${job.title} at ${job.companyName}`);
    });
    
  } catch (error) {
    console.error('Import error:', error);
  }
}

drizzleImport();