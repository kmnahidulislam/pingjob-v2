import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment DATABASE_URL (from Replit's database)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("Using database URL:", DATABASE_URL.substring(0, 50) + "...");

const CLEAN_CONNECTION = {
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
};

export const cleanPool = new Pool(CLEAN_CONNECTION);
export const cleanDb = drizzle(cleanPool, { schema });

// Initialize schema if needed
export async function initializeCleanDatabase() {
  try {
    // Test connection first
    await cleanPool.query('SELECT 1');
    console.log("NEON DATABASE CONNECTION VERIFIED");
    return true;
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED:", error);
    return false;
  }
}