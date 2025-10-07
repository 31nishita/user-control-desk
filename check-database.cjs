const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '.data', 'app.db');

console.log('🗄️  DATABASE INSPECTOR');
console.log('='.repeat(50));
console.log(`Database location: ${dbPath}`);
console.log('='.repeat(50));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database successfully!');
});

// Get all tables
db.serialize(() => {
    console.log('\n📋 TABLES IN DATABASE:');
    console.log('-'.repeat(30));
    
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('Error fetching tables:', err.message);
            return;
        }
        
        if (tables.length === 0) {
            console.log('No tables found in database.');
            db.close();
            return;
        }
        
        tables.forEach(table => {
            console.log(`📄 ${table.name}`);
        });
        
        console.log('\n👥 USERS TABLE DATA:');
        console.log('-'.repeat(30));
        
        // Get users table structure
        db.all("PRAGMA table_info(users)", [], (err, columns) => {
            if (err) {
                console.log('Users table does not exist yet.');
            } else {
                console.log('\n🏗️  Table Structure:');
                columns.forEach(col => {
                    console.log(`  ${col.name} (${col.type})`);
                });
            }
            
            // Get users data
            db.all("SELECT * FROM users", [], (err, users) => {
                if (err) {
                    console.log('No users table or error reading data.');
                } else {
                    console.log(`\n📊 Found ${users.length} users in database:`);
                    if (users.length > 0) {
                        console.log('\nUser Details:');
                        users.forEach((user, index) => {
                            console.log(`\n${index + 1}. User ID: ${user.id}`);
                            console.log(`   Name: ${user.name}`);
                            console.log(`   Email: ${user.email}`);
                            console.log(`   Status: ${user.status || 'N/A'}`);
                            console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
                            console.log(`   Created: ${user.created_at}`);
                        });
                        
                        // Stats
                        const activeUsers = users.filter(u => u.is_active === 1).length;
                        const inactiveUsers = users.length - activeUsers;
                        
                        console.log('\n📈 STATISTICS:');
                        console.log(`   Total Users: ${users.length}`);
                        console.log(`   Active Users: ${activeUsers}`);
                        console.log(`   Inactive Users: ${inactiveUsers}`);
                    } else {
                        console.log('   No users found in database.');
                    }
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('\n✅ Database connection closed.');
                    }
                });
            });
        });
    });
});