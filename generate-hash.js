const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'sifrasifra';
  const rounds = 12;
  
  console.log('Generating bcrypt hash for password:', password);
  console.log('Rounds:', rounds);
  
  const hash = await bcrypt.hash(password, rounds);
  console.log('\nGenerated hash:');
  console.log(hash);
  
  console.log('\nSQL to insert test client user:');
  console.log(`INSERT INTO users (username, email, password, role) VALUES ('fkzeljeznicar', 'fkzeljeznicar@scoutnetworking.com', '${hash}', 'client');`);
  
  console.log('\nThen create client record:');
  console.log(`INSERT INTO clients (user_id, name) VALUES ((SELECT id FROM users WHERE username = 'fkzeljeznicar'), 'FK Željezničar');`);
}

generateHash().catch(console.error);