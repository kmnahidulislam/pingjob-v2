import { Pool } from 'pg';

// Fix assignment table and create proper assignments
async function fixAssignmentTable() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Fixing job_candidate_assignments table...");
    
    // Add the unique constraint
    await pool.query(`
      ALTER TABLE job_candidate_assignments 
      ADD CONSTRAINT unique_job_candidate_recruiter 
      UNIQUE (job_id, candidate_id, recruiter_id)
    `);
    
    console.log("Added unique constraint successfully");
    
    // Now create assignments for job 83573
    const jobId = 83573;
    const recruiterId = 'user_1751050337717_6m7wx40s5';
    
    const candidatesQuery = await pool.query(`
      SELECT id, email, first_name, last_name, category_id
      FROM users 
      WHERE user_type = 'job_seeker' 
      AND category_id = 4 
      LIMIT 10
    `);
    
    console.log("Found candidates for category 4:", candidatesQuery.rows.length);
    
    // Create assignments
    for (const candidate of candidatesQuery.rows) {
      try {
        await pool.query(`
          INSERT INTO job_candidate_assignments (job_id, candidate_id, recruiter_id, status)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (job_id, candidate_id, recruiter_id) DO NOTHING
        `, [jobId, candidate.id, recruiterId, 'assigned']);
        
        console.log(`Assigned candidate: ${candidate.email}`);
      } catch (error) {
        console.log(`Assignment error for ${candidate.email}:`, error.message);
      }
    }
    
    // Test the retrieval query
    const assignments = await pool.query(`
      SELECT 
        jca.id as assignment_id,
        jca.job_id,
        jca.candidate_id,
        jca.recruiter_id,
        jca.status,
        jca.assigned_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.headline,
        u.location,
        u.category_id
      FROM job_candidate_assignments jca
      INNER JOIN users u ON jca.candidate_id = u.id
      WHERE jca.job_id = $1 AND jca.recruiter_id = $2
      ORDER BY jca.assigned_at DESC
    `, [jobId, recruiterId]);
    
    console.log("Retrieved assignments:", assignments.rows.length);
    console.log("Sample assignments:", assignments.rows.slice(0, 3));
    
    pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

fixAssignmentTable();