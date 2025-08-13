import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function updateUserPasswords() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Hash password123 for both users
    const hashedPassword = await hashPassword('password123');
    
    // Update both users with the same password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email IN ($2, $3)',
      [hashedPassword, 'krupashankar@gmail.com', 'krupas@vedsoft.com']
    );

    console.log('✓ Updated passwords for both users');
    console.log('✓ Email: krupashankar@gmail.com - Password: password123');
    console.log('✓ Email: krupas@vedsoft.com - Password: password123');

    // Verify the update
    const result = await pool.query(
      'SELECT email, password FROM users WHERE email IN ($1, $2)',
      ['krupashankar@gmail.com', 'krupas@vedsoft.com']
    );

    console.log('\nVerification:');
    result.rows.forEach(row => {
      console.log(`Email: ${row.email}, Password hash: ${row.password.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updateUserPasswords();