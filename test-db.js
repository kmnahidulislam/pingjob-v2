import { Pool } from '@neondatabase/serverless';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  const pool = new Pool({ connectionString: NEON_DATABASE_URL });
  
  try {
    console.log("Testing database connection...");
    
    // Check current database and schema
    const schemaResult = await pool.query('SELECT current_database(), current_schema()');
    console.log("Database/Schema:", schemaResult.rows[0]);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log("Users table columns:", tableCheck.rows);
    
    // Try to insert a test user
    const testUser = await pool.query(`
      INSERT INTO users (id, email, password, first_name, last_name, user_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['test123', 'test@test.com', 'hashedpass', 'Test', 'User', 'job_seeker']);
    
    console.log("Successfully inserted user:", testUser.rows[0]);
    
    // Clean up
    await pool.query('DELETE FROM users WHERE id = $1', ['test123']);
    console.log("Test completed successfully!");
    
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await pool.end();
  }
}

testConnection();