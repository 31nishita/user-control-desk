const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SERVER_URL = 'http://localhost:3001';
const DB_PATH = path.join(__dirname, '.data', 'app.db');

// Generate unique test user data
const timestamp = new Date().getTime();
const testUser = {
  email: `testuser${timestamp}@example.com`,
  password: 'TestPassword123!',
  name: `TestUser${timestamp}`
};

console.log('🧪 Testing User Registration System...\n');

async function testUserRegistration() {
  try {
    console.log('📝 Creating new user:', testUser.email);
    
    // Test user registration via API
    const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response Success:', {
        user: result.user,
        tokenReceived: !!result.token
      });
    } else {
      console.log('❌ API Response Error:', result);
      return false;
    }

    // Now check if the user was actually saved to SQLite
    console.log('\n🔍 Checking SQLite database...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        return false;
      }
    });

    return new Promise((resolve) => {
      db.get("SELECT * FROM users WHERE email = ?", [testUser.email], (err, row) => {
        if (err) {
          console.error('❌ Database query error:', err.message);
          resolve(false);
        } else if (row) {
          console.log('✅ User found in SQLite database:');
          console.log(`   ID: ${row.id}`);
          console.log(`   Email: ${row.email}`);
          console.log(`   Name: ${row.name}`);
          console.log(`   Created: ${row.created_at}`);
          console.log(`   Password Hash: ${row.password_hash ? 'EXISTS' : 'MISSING'}`);
          
          // Count total users
          db.get("SELECT COUNT(*) as count FROM users", [], (err, countRow) => {
            if (!err) {
              console.log(`\n📊 Total users in database: ${countRow.count}`);
            }
            db.close();
            resolve(true);
          });
        } else {
          console.log('❌ User NOT found in SQLite database');
          db.close();
          resolve(false);
        }
      });
    });

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function runTest() {
  console.log(`🎯 Testing with user: ${testUser.email}\n`);
  
  const success = await testUserRegistration();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 SUCCESS: New users are being saved to SQLite database!');
    console.log('✅ Your user management system is working correctly.');
  } else {
    console.log('❌ FAILED: There might be an issue with user registration.');
    console.log('💡 Please check if the server is running on port 3001');
  }
  console.log('='.repeat(50));
}

// Run the test
runTest().catch(console.error);