import { storage } from './server/storage.js';

async function addLocationData() {
  try {
    console.log('Adding location data...');
    
    // Add countries directly using storage methods
    const countries = [
      { name: 'United States', code: 'US' },
      { name: 'Canada', code: 'CA' },
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Germany', code: 'DE' },
      { name: 'France', code: 'FR' }
    ];

    for (const country of countries) {
      try {
        await storage.db.insert(storage.countries).values(country).onConflictDoNothing();
        console.log(`Added country: ${country.name}`);
      } catch (err) {
        console.log(`Country ${country.name} already exists or error:`, err.message);
      }
    }

    console.log('Location data setup complete!');
  } catch (error) {
    console.error('Error adding location data:', error);
  }
}

addLocationData();