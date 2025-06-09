import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// HARDCODED CLEAN NEON.TECH CONNECTION - IGNORE ALL ENVIRONMENT VARIABLES
const CLEAN_NEON_URL = "postgresql://neondb_owner:npg_Ipr7OmRBx3cb@ep-long-sun-a6hkn6ul.us-west-2.aws.neon.tech/neondb?sslmode=require";

console.log("CLEAN NEON.TECH CONNECTION:", CLEAN_NEON_URL.substring(0, 50) + "...");

export const pool = new Pool({ 
  connectionString: CLEAN_NEON_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });