const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'YourSecureAdminPassword123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('\n--- Admin Password Hash Generated ---');
  console.log(`Password: ${password}`);
  console.log(`Bcrypt Hash: ${hash}`);
  console.log('-------------------------------------\n');
});
