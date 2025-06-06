import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use your specific Neon database endpoint
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString: NEON_DATABASE_URL });
export const db = drizzle({ client: pool, schema });