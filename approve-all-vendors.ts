import { Pool } from 'pg';

// Use the same connection as the server
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function approveAllVendors() {
  try {
    console.log('Updating all vendors to approved status...');
    
    // Check current vendor status distribution
    const statusCheck = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status
    `);
    console.log('Current vendor status distribution:', statusCheck.rows);
    
    // Update all vendors to approved status
    const updateResult = await pool.query(`
      UPDATE vendors 
      SET status = 'approved', approved_by = 'system'
      WHERE status != 'approved'
      RETURNING id, name, company_id
    `);
    
    console.log(`Updated ${updateResult.rows.length} vendors to approved status`);
    
    // Show updated status distribution
    const updatedStatusCheck = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status
    `);
    console.log('Updated vendor status distribution:', updatedStatusCheck.rows);
    
    console.log('All vendors are now approved and will display for all users!');
    
  } catch (error) {
    console.error('Error approving vendors:', error);
  } finally {
    await pool.end();
  }
}

approveAllVendors();