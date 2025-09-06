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
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  reapIntervalMillis: 1000,
  createTimeoutMillis: 10000,
};

export const cleanPool = new Pool(CLEAN_CONNECTION);
export const cleanDb = drizzle(cleanPool, { schema });

// Initialize schema if needed
export async function initializeCleanDatabase() {
  let retries = 3;
  while (retries > 0) {
    try {
      // Test connection with a simple query
      const result = await cleanPool.query('SELECT 1 as test');
      console.log("✅ DATABASE CONNECTION VERIFIED:", result.rows[0]);
      return true;
    } catch (error) {
      retries--;
      const err = error as any;
      console.error(`❌ DATABASE CONNECTION ATTEMPT FAILED (${3-retries}/3):`, err.message);
      if (retries === 0) {
        console.error("💥 FINAL DATABASE CONNECTION FAILURE:", {
          message: err.message,
          code: err.code,
          detail: err.detail
        });
        return false;
      }
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}