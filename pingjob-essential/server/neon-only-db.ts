import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// COMPLETELY ISOLATED NEON.TECH CONNECTION
// This bypasses ALL Replit database infrastructure
const ISOLATED_NEON_URL = "postgresql://neondb_owner:npg_Ipr7OmRBx3cb@ep-long-sun-a6hkn6ul.us-west-2.aws.neon.tech/neondb?sslmode=require";

console.log("ISOLATED NEON.TECH CONNECTION ONLY - NO REPLIT DB");

// Create properly configured pool with connection limits
export const isolatedPool = new Pool({ 
  connectionString: ISOLATED_NEON_URL,
  max: 3, // Limit connections to avoid pool exhaustion
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const isolatedDb = drizzle(isolatedPool, { schema });

// Test connection without holding it open
isolatedPool.query('SELECT 1 as test').then(() => {
  console.log("✅ CONFIRMED CONNECTION TO NEON.TECH ONLY");
}).catch(err => {
  console.error("❌ NEON CONNECTION FAILED:", err);
});