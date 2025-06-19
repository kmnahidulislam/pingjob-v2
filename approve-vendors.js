import { db } from './server/db.ts';
import { vendors } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function approveRandomVendors() {
  try {
    console.log('Approving vendors to make them visible to unauthenticated users...');
    
    // Update vendors to approved status (every 3rd vendor to create a mix)
    const result = await db
      .update(vendors)
      .set({ 
        status: 'approved',
        approvedBy: 'admin' 
      })
      .where(eq(vendors.status, 'pending'))
      .returning();
    
    console.log(`Successfully approved ${result.length} vendors`);
    
    // Check status distribution
    const statusCounts = await db
      .select()
      .from(vendors);
    
    const approved = statusCounts.filter(v => v.status === 'approved').length;
    const pending = statusCounts.filter(v => v.status === 'pending').length;
    
    console.log(`Current vendor status: ${approved} approved, ${pending} pending`);
    
  } catch (error) {
    console.error('Error approving vendors:', error);
  } finally {
    process.exit(0);
  }
}

approveRandomVendors();