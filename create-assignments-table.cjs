const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAssignmentsTable() {
  try {
    console.log('Creating job_candidate_assignments table...');
    
    // Create the table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_candidate_assignments (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) NOT NULL,
        candidate_id VARCHAR REFERENCES users(id) NOT NULL,
        recruiter_id VARCHAR REFERENCES users(id) NOT NULL,
        status VARCHAR DEFAULT 'assigned' CHECK (status IN ('assigned', 'contacted', 'interested', 'not_interested')),
        assigned_at TIMESTAMP DEFAULT NOW(),
        contacted_at TIMESTAMP,
        notes TEXT,
        UNIQUE(job_id, candidate_id, recruiter_id)
      );
    `);
    
    console.log('Table created successfully');
    
    // Check if table exists and show structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'job_candidate_assignments'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:', result.rows);
    
    // Check for existing data
    const count = await pool.query(`SELECT COUNT(*) FROM job_candidate_assignments`);
    console.log('Existing records:', count.rows[0].count);
    
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createAssignmentsTable();