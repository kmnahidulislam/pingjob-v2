import { db } from './db';
import { sql } from 'drizzle-orm';

async function createSocialMediaTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS social_media_posts (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id),
        platforms_posted JSONB NOT NULL,
        results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Social media posts table created successfully');
  } catch (error) {
    console.error('Error creating social media posts table:', error);
  }
}

createSocialMediaTable();