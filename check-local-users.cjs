const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '.data', 'app.db');

console.log('📁 Checking SQLite database at:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Check if users table exists and get all records
db.serialize(() => {
  // First, let's see what tables exist
  db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
    if (err) {
      console.error('❌ Error fetching tables:', err.message);
      return;
    }
    
    console.log('📊 Tables in database:', tables.map(t => t.name));
    
    // Check users table specifically
    db.all("SELECT * FROM users ORDER BY id DESC;", [], (err, users) => {
      if (err) {
        console.error('❌ Error fetching users:', err.message);
      } else {
        console.log(`\n👥 Found ${users.length} users in local SQLite database:`);
        if (users.length > 0) {
          users.forEach((user, index) => {
            console.log(`\n${index + 1}. User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Password Hash: ${user.password_hash ? '***exists***' : 'missing'}`);
          });
        } else {
          console.log('   No users found in local database');
        }
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('\n✅ Database connection closed');
        }
      });
    });
  });
});