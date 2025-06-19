import { pool } from './server/db.ts';

async function fixJobSequence() {
  try {
    console.log('Fixing job sequence after deletions...');
    
    // Get the current max ID in the jobs table
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM jobs');
    const maxId = maxIdResult.rows[0].max_id || 0;
    console.log(`Current max job ID: ${maxId}`);
    
    // Get the current sequence value
    const seqResult = await pool.query("SELECT currval('jobs_id_seq') as current_val");
    const currentSeq = seqResult.rows[0].current_val;
    console.log(`Current sequence value: ${currentSeq}`);
    
    // Reset the sequence to start from max_id + 1
    const newSeqValue = maxId + 1;
    await pool.query(`SELECT setval('jobs_id_seq', ${newSeqValue}, false)`);
    console.log(`Reset sequence to: ${newSeqValue}`);
    
    // Verify the fix
    const verifyResult = await pool.query("SELECT currval('jobs_id_seq') as new_val");
    const newVal = verifyResult.rows[0].new_val;
    console.log(`Verified new sequence value: ${newVal}`);
    
    // Test that next value will be correct
    const nextResult = await pool.query("SELECT nextval('jobs_id_seq') as next_val");
    const nextVal = nextResult.rows[0].next_val;
    console.log(`Next ID will be: ${nextVal}`);
    
    // Reset back to correct position (since we used nextval)
    await pool.query(`SELECT setval('jobs_id_seq', ${newSeqValue}, false)`);
    console.log('Sequence fixed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing sequence:', error);
    process.exit(1);
  }
}

fixJobSequence();