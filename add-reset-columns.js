import { db } from './db.ts';

async function addResetColumns() {
  try {
    console.log('Adding reset_token and reset_token_expiry columns...');
    
    // Use the existing database connection
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    
    console.log('Successfully added password reset columns to users table');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

addResetColumns();