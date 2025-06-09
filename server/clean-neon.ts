import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// CLEAN NEON.TECH SETUP - COMPLETELY ISOLATED FROM REPLIT
const CLEAN_CONNECTION = {
  host: "ep-long-sun-a6hkn6ul.us-west-2.aws.neon.tech",
  port: 5432,
  database: "neondb", 
  user: "neondb_owner",
  password: "npg_Ipr7OmRBx3cb",
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
};

export const cleanPool = new Pool(CLEAN_CONNECTION);
export const cleanDb = drizzle(cleanPool, { schema });

// Initialize schema if needed
export async function initializeCleanDatabase() {
  try {
    // Create users table if it doesn't exist
    await cleanPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        user_type VARCHAR DEFAULT 'job_seeker',
        profile_image_url VARCHAR,
        category_id INTEGER,
        headline VARCHAR,
        summary TEXT,
        location VARCHAR,
        industry VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("CLEAN NEON DATABASE READY");
    return true;
  } catch (error) {
    console.error("CLEAN DATABASE SETUP FAILED:", error);
    return false;
  }
}