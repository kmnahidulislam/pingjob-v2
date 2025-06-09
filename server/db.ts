import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to database:", NEON_DATABASE_URL.substring(0, 50) + "...");

export const pool = new Pool({ 
  connectionString: NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle({ client: pool, schema });