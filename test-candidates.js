import { Pool } from 'pg';

// Test to check if there are candidates with matching categories
async function testCandidates() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Testing candidate assignment system...");
    
    // Check total job seekers
    const totalJobSeekers = await pool.query("SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker'");
    console.log("Total job seekers:", totalJobSeekers.rows[0].count);
    
    // Check job seekers with categories
    const withCategories = await pool.query("SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker' AND category_id IS NOT NULL");
    console.log("Job seekers with categories:", withCategories.rows[0].count);
    
    // Check .NET category candidates specifically
    const netDevs = await pool.query("SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker' AND category_id = 4");
    console.log(".NET developers (category 4):", netDevs.rows[0].count);
    
    // Check what categories exist
    const categories = await pool.query("SELECT id, name FROM categories ORDER BY id LIMIT 10");
    console.log("Available categories:", categories.rows);
    
    // Check sample users with categories
    const sampleUsers = await pool.query("SELECT id, email, first_name, last_name, category_id FROM users WHERE user_type = 'job_seeker' AND category_id IS NOT NULL LIMIT 5");
    console.log("Sample users with categories:", sampleUsers.rows);
    
    pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

testCandidates();