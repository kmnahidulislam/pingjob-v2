import { storage } from './server/storage.ts';

async function fixVendors() {
  try {
    console.log('Approving all vendors...');
    const result = await storage.approveAllVendors();
    console.log(`Successfully approved ${result.updated} vendors`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixVendors();