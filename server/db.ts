import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force use only Neon.tech database, never Replit database
const NEON_DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Ipr7OmRBx3cb@ep-long-sun-a6hkn6ul.us-west-2.aws.neon.tech/neondb?sslmode=require";

console.log("EXCLUSIVELY USING NEON.TECH DATABASE:", NEON_DATABASE_URL.substring(0, 50) + "...");

export const pool = new Pool({ 
  connectionString: NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle({ client: pool, schema });