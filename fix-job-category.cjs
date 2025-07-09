const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixJobCategory() {
  try {
    // First, let's see what categories have job seekers
    const categoriesWithUsers = await pool.query(`
      SELECT u.category_id, c.name, COUNT(u.id) as user_count
      FROM users u
      JOIN categories c ON u.category_id = c.id
      WHERE u.user_type = 'job_seeker'
      GROUP BY u.category_id, c.name
      ORDER BY user_count DESC
      LIMIT 5
    `);
    
    console.log('Categories with job seekers:');
    categoriesWithUsers.rows.forEach(row => {
      console.log(`- Category ${row.category_id} (${row.name}): ${row.user_count} users`);
    });
    
    if (categoriesWithUsers.rows.length > 0) {
      const targetCategory = categoriesWithUsers.rows[0]; // Use the category with most users
      
      // Update the recruiter's job to use this category
      const updateResult = await pool.query(`
        UPDATE jobs 
        SET category_id = $1
        WHERE recruiter_id = 'user_1751050337717_6m7wx40s5'
        AND id = 83571
      `, [targetCategory.category_id]);
      
      console.log(`\nUpdated job 83571 to use category ${targetCategory.category_id} (${targetCategory.name})`);
      console.log(`This category has ${targetCategory.user_count} job seekers`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixJobCategory();