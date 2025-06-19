import { db } from './server/db.js';
import { vendors } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function approveSomeVendors() {
  try {
    console.log('Approving some vendors for company 74699...');
    
    // Approve specific vendors by ID
    const vendorIds = [18569, 18568, 19664];
    
    for (const vendorId of vendorIds) {
      await db
        .update(vendors)
        .set({ 
          status: 'approved',
          approvedBy: 'admin'
        })
        .where(eq(vendors.id, vendorId));
      
      console.log(`Approved vendor ${vendorId}`);
    }
    
    console.log('Vendor approval complete');
    
  } catch (error) {
    console.error('Error approving vendors:', error);
  } finally {
    process.exit(0);
  }
}

approveSomeVendors();