import { db } from './server/db';
import { jobs, companies } from './shared/schema';
import fs from 'fs';
import { parse } from 'csv-parse';
import { sql, eq } from 'drizzle-orm';

async function directCommCorpFix() {
  console.log('Direct fix: Moving all @Comm Corporation jobs to correct companies...');
  
  // Get @Comm Corporation jobs
  const commCorpJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));
  console.log(`Found ${commCorpJobs.length} jobs assigned to @Comm Corporation`);
  
  if (commCorpJobs.length === 0) {
    console.log('@Comm Corporation already has zero jobs!');
    return { moved: 0, assigned: 0 };
  }

  // Build CSV mapping for these specific job IDs
  const csvFilePath = './attached_assets/jobs_MySQL - Copy_1750348930531.csv';
  const jobCompanyMap = new Map<number, number>();
  
  // Get valid company IDs
  const validCompanies = await db.select({ id: companies.id }).from(companies);
  const validCompanyIds = new Set(validCompanies.map(c => c.id));
  
  // Find "Unknown Company" or create it
  let unknownCompany = await db.select().from(companies).where(eq(companies.name, 'Unknown Company'));
  if (unknownCompany.length === 0) {
    const [created] = await db.insert(companies).values({
      name: 'Unknown Company',
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown'
    }).returning();
    unknownCompany = [created];
  }
  const unknownCompanyId = unknownCompany[0].id;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        if (!row.id || row.id === 'id') return;
        
        const jobId = parseInt(row.id);
        const companyId = parseInt(row.company_id);
        
        if (jobId && companyId && validCompanyIds.has(companyId)) {
          jobCompanyMap.set(jobId, companyId);
        }
      })
      .on('end', async () => {
        console.log(`CSV mapping loaded: ${jobCompanyMap.size} valid job-company pairs`);

        try {
          let movedToCorrectCompany = 0;
          let assignedToUnknown = 0;

          // Process each @Comm Corporation job
          for (const job of commCorpJobs) {
            const correctCompanyId = jobCompanyMap.get(job.id);
            
            if (correctCompanyId && correctCompanyId !== 1) {
              // Move to correct company
              await db.update(jobs)
                .set({ companyId: correctCompanyId })
                .where(eq(jobs.id, job.id));
              movedToCorrectCompany++;
            } else {
              // No valid mapping, assign to Unknown Company
              await db.update(jobs)
                .set({ companyId: unknownCompanyId })
                .where(eq(jobs.id, job.id));
              assignedToUnknown++;
            }
            
            if ((movedToCorrectCompany + assignedToUnknown) % 1000 === 0) {
              console.log(`Progress: ${movedToCorrectCompany + assignedToUnknown}/${commCorpJobs.length} jobs processed`);
            }
          }

          // Verify @Comm Corporation now has zero jobs
          const remainingCommJobs = await db.select().from(jobs).where(eq(jobs.companyId, 1));
          
          // Get new top companies
          const topCompanies = await db.execute(sql`
            SELECT c.name, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            GROUP BY c.id, c.name
            HAVING COUNT(j.id) > 0
            ORDER BY job_count DESC
            LIMIT 10
          `);

          console.log(`\n=== @COMM CORPORATION FIX COMPLETED ===`);
          console.log(`Jobs moved to correct companies: ${movedToCorrectCompany}`);
          console.log(`Jobs assigned to Unknown Company: ${assignedToUnknown}`);
          console.log(`@Comm Corporation remaining jobs: ${remainingCommJobs.length}`);
          
          console.log(`\nNew top 10 companies by job count:`);
          topCompanies.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}: ${row.job_count} jobs`);
          });

          resolve({ 
            moved: movedToCorrectCompany, 
            assigned: assignedToUnknown,
            remaining: remainingCommJobs.length
          });
        } catch (error) {
          console.error('Direct fix error:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

directCommCorpFix()
  .then((result) => {
    console.log(`Direct fix completed: ${result.moved} moved, ${result.assigned} assigned to unknown`);
    console.log(`@Comm Corporation final job count: ${result.remaining}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Direct fix failed:', error);
    process.exit(1);
  });