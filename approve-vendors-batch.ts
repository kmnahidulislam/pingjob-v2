import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function approveVendorsBatch() {
  try {
    console.log('Starting vendor approval process...');
    
    // Get current vendor counts by status
    const statusCheck = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status
    `);
    console.log('Current vendor status distribution:', statusCheck.rows);
    
    // Approve the first 100 pending vendors to ensure good coverage
    const approvalResult = await pool.query(`
      UPDATE vendors 
      SET status = 'approved', approved_by = 'admin'
      WHERE status = 'pending' 
      AND id IN (
        SELECT id FROM vendors 
        WHERE status = 'pending'
        ORDER BY created_at DESC 
        LIMIT 100
      )
      RETURNING id, name, company_id
    `);
    
    console.log(`Successfully approved ${approvalResult.rows.length} vendors:`);
    approvalResult.rows.forEach(vendor => {
      console.log(`- ID: ${vendor.id}, Name: ${vendor.name}, Company: ${vendor.company_id}`);
    });
    
    // Get updated status distribution
    const updatedStatusCheck = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status
    `);
    console.log('Updated vendor status distribution:', updatedStatusCheck.rows);
    
    console.log('Vendor approval batch completed successfully!');
    
  } catch (error) {
    console.error('Error approving vendors:', error);
  } finally {
    await pool.end();
  }
}

approveVendorsBatch();