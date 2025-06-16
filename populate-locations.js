import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populateLocations() {
  try {
    // Insert countries
    const countries = [
      { name: 'United States', code: 'US' },
      { name: 'Canada', code: 'CA' },
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Germany', code: 'DE' },
      { name: 'France', code: 'FR' },
      { name: 'Australia', code: 'AU' },
      { name: 'India', code: 'IN' },
      { name: 'China', code: 'CN' },
      { name: 'Japan', code: 'JP' },
      { name: 'Brazil', code: 'BR' }
    ];

    console.log('Inserting countries...');
    for (const country of countries) {
      await pool.query(
        'INSERT INTO countries (name, code) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
        [country.name, country.code]
      );
    }

    // Get US country ID for states
    const usResult = await pool.query('SELECT id FROM countries WHERE code = $1', ['US']);
    const usId = usResult.rows[0]?.id;

    if (usId) {
      // Insert US states
      const states = [
        { name: 'California', code: 'CA' },
        { name: 'New York', code: 'NY' },
        { name: 'Texas', code: 'TX' },
        { name: 'Florida', code: 'FL' },
        { name: 'Illinois', code: 'IL' },
        { name: 'Pennsylvania', code: 'PA' },
        { name: 'Ohio', code: 'OH' },
        { name: 'Georgia', code: 'GA' },
        { name: 'North Carolina', code: 'NC' },
        { name: 'Michigan', code: 'MI' }
      ];

      console.log('Inserting US states...');
      for (const state of states) {
        await pool.query(
          'INSERT INTO states (country_id, name, code) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [usId, state.name, state.code]
        );
      }

      // Get California state ID for cities
      const caResult = await pool.query('SELECT id FROM states WHERE name = $1 AND country_id = $2', ['California', usId]);
      const caId = caResult.rows[0]?.id;

      if (caId) {
        // Insert California cities
        const cities = [
          'Los Angeles',
          'San Francisco',
          'San Diego',
          'San Jose',
          'Sacramento',
          'Oakland',
          'Santa Ana',
          'Anaheim',
          'Riverside',
          'Stockton'
        ];

        console.log('Inserting California cities...');
        for (const city of cities) {
          await pool.query(
            'INSERT INTO cities (state_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [caId, city]
          );
        }
      }

      // Get New York state ID for cities
      const nyResult = await pool.query('SELECT id FROM states WHERE name = $1 AND country_id = $2', ['New York', usId]);
      const nyId = nyResult.rows[0]?.id;

      if (nyId) {
        // Insert New York cities
        const cities = [
          'New York City',
          'Buffalo',
          'Rochester',
          'Yonkers',
          'Syracuse',
          'Albany',
          'New Rochelle',
          'Mount Vernon',
          'Schenectady',
          'Utica'
        ];

        console.log('Inserting New York cities...');
        for (const city of cities) {
          await pool.query(
            'INSERT INTO cities (state_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [nyId, city]
          );
        }
      }
    }

    console.log('Location data populated successfully!');
  } catch (error) {
    console.error('Error populating location data:', error);
  } finally {
    await pool.end();
  }
}

populateLocations();