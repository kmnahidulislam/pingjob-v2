import { cleanDb as db } from './server/clean-neon';

async function addTestProfileData() {
  try {
    console.log('Adding test profile data for admin-krupa user...');
    
    // Add skills
    await db.execute(`
      INSERT INTO skills (user_id, name, level) VALUES 
      ('admin-krupa', 'JavaScript', 'Expert'),
      ('admin-krupa', 'React', 'Expert'),
      ('admin-krupa', 'Node.js', 'Advanced'),
      ('admin-krupa', 'TypeScript', 'Advanced'),
      ('admin-krupa', 'Python', 'Intermediate'),
      ('admin-krupa', 'SAP', 'Beginner'),
      ('admin-krupa', 'SQL', 'Advanced')
    `);
    console.log('✓ Skills added');
    
    // Add experience
    await db.execute(`
      INSERT INTO experiences (user_id, title, company, start_date, end_date, description) VALUES 
      ('admin-krupa', 'Senior Software Developer', 'Tech Corporation', '2020-01-01', '2023-12-31', 'Led development of web applications using React and Node.js. Managed team of 5 developers.'),
      ('admin-krupa', 'Software Developer', 'StartupCo', '2018-06-01', '2019-12-31', 'Developed full-stack applications using JavaScript, React, and Express.js.')
    `);
    console.log('✓ Experience added');
    
    // Add education
    await db.execute(`
      INSERT INTO education (user_id, institution, degree, field_of_study, start_date, end_date, grade) VALUES 
      ('admin-krupa', 'MIT', 'Bachelor of Science', 'Computer Science', '2014-09-01', '2018-05-31', '3.8')
    `);
    console.log('✓ Education added');
    
    console.log('✓ Test profile data added successfully');
    
  } catch (error) {
    console.error('Error adding test profile data:', error);
  } finally {
    process.exit(0);
  }
}

addTestProfileData();