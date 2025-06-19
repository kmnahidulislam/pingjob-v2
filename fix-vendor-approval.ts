import { storage } from './server/storage';

async function fixVendorApproval() {
  try {
    console.log('Approving vendors to make them visible...');
    
    // Get some pending vendors to approve
    const pendingVendors = await storage.getPendingVendors();
    console.log(`Found ${pendingVendors.length} pending vendors`);
    
    if (pendingVendors.length > 0) {
      // Approve the first 20 vendors
      const vendorsToApprove = pendingVendors.slice(0, 20);
      
      for (const vendor of vendorsToApprove) {
        await storage.approveVendor(vendor.id, 'admin');
        console.log(`Approved vendor: ${vendor.name} (ID: ${vendor.id})`);
      }
      
      console.log(`Successfully approved ${vendorsToApprove.length} vendors`);
    } else {
      console.log('No pending vendors found to approve');
    }
    
  } catch (error) {
    console.error('Error approving vendors:', error);
  }
}

fixVendorApproval();