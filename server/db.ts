import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("Production mode - using environment DATABASE_URL");

const CONNECTION_CONFIG = {
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  reapIntervalMillis: 1000,
  createTimeoutMillis: 10000,
};

export const pool = new Pool(CONNECTION_CONFIG);
export const db = drizzle(pool, { schema });