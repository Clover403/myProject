// Script untuk test ambil user dan cek role dari database
const db = require('./models');
const User = db.User;

async function testUserRole() {
  try {
    console.log('🔍 Fetching all users from database...\n');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'googleId', 'password'],
      order: [['id', 'ASC']]
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      const hasPassword = user.password ? '🔒' : '🔓';
      const hasGoogle = user.googleId ? '🟢 Google' : '⚪ Local';
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role} ${user.role === 'admin' ? '👑' : user.role === 'ethack' ? '🛡️' : '👤'}`);
      console.log(`   Auth: ${hasGoogle} ${hasPassword}`);
      console.log('');
    });

    // Test specific users
    console.log('\n📋 Looking for admin and ethack users...');
    
    const adminUsers = users.filter(u => u.role === 'admin');
    const ethackUsers = users.filter(u => u.role === 'ethack');
    
    console.log(`\n👑 Admins: ${adminUsers.length}`);
    adminUsers.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
    
    console.log(`\n🛡️  Ethical Hackers: ${ethackUsers.length}`);
    ethackUsers.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testUserRole();
