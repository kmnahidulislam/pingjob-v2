import { db } from './server/db';
import { jobs } from './shared/schema';
import { sql } from 'drizzle-orm';

async function analyzeJobsData() {
  console.log('Analyzing jobs data discrepancy...');
  
  try {
    // Count total jobs
    const totalCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM jobs`);
    const totalCount = totalCountResult.rows[0].count;
    console.log(`Total jobs count: ${totalCount}`);

    // Get min and max IDs
    const rangeResult = await db.execute(sql`SELECT MIN(id) as min_id, MAX(id) as max_id FROM jobs`);
    const minId = rangeResult.rows[0].min_id;
    const maxId = rangeResult.rows[0].max_id;
    console.log(`ID range: ${minId} to ${maxId}`);

    // Check for gaps in ID sequence
    const gapResult = await db.execute(sql`
      SELECT COUNT(*) as expected_count 
      FROM generate_series(${minId}, ${maxId}) 
      WHERE generate_series NOT IN (SELECT id FROM jobs)
    `);
    const gapsCount = gapResult.rows[0].expected_count;
    console.log(`Missing IDs in sequence: ${gapsCount}`);

    // Sample recent jobs
    const recentJobs = await db.execute(sql`
      SELECT id, title, company_id, created_at 
      FROM jobs 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log('\nRecent jobs:');
    recentJobs.rows.forEach(job => {
      console.log(`ID: ${job.id}, Title: ${job.title}, Company: ${job.company_id}`);
    });

    // Check if there are jobs with very high IDs
    const highIdJobs = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE id > 10000
    `);
    console.log(`\nJobs with ID > 10000: ${highIdJobs.rows[0].count}`);

    return {
      totalCount,
      minId,
      maxId,
      gapsCount
    };
  } catch (error) {
    console.error('Analysis error:', error);
  }
}

analyzeJobsData();