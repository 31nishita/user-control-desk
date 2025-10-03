const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SERVER_URL = 'http://localhost:3001';

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function listUsers() {
  console.log('📋 Current users in the system:');
  console.log('=' .repeat(50));
  
  // We'll use our existing script to show users
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('node check-local-users.cjs', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error fetching users:', error.message);
        resolve();
        return;
      }
      
      // Extract just the user list from the output
      const lines = stdout.split('\n');
      let userSection = false;
      
      lines.forEach(line => {
        if (line.includes('Found') && line.includes('users')) {
          userSection = true;
          console.log(line);
          return;
        }
        
        if (userSection && (line.includes('User ID:') || line.includes('Email:') || line.includes('Name:'))) {
          console.log(line);
        }
        
        if (line.includes('Database connection closed')) {
          userSection = false;
        }
      });
      
      console.log('=' .repeat(50));
      resolve();
    });
  });
}

async function resetUserPassword() {
  try {
    console.log('🔐 Admin Password Reset Tool\n');
    
    await listUsers();
    
    const email = await askQuestion('\n📧 Enter the email address of the user: ');
    
    if (!email || !email.includes('@')) {
      console.log('❌ Please enter a valid email address');
      return;
    }

    console.log(`\n🔄 Requesting password reset for: ${email}`);
    
    // Step 1: Request password reset
    const resetResponse = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const resetResult = await resetResponse.json();

    if (!resetResponse.ok || !resetResult.resetToken) {
      console.log('❌ Failed to generate reset token:', resetResult.error || 'Unknown error');
      return;
    }

    console.log('✅ Reset token generated successfully!');
    console.log(`🔑 Token: ${resetResult.resetToken}`);
    console.log(`⏰ Expires: ${new Date(resetResult.expires).toLocaleString()}`);

    const newPassword = await askQuestion('\n🔒 Enter new password (min 6 characters): ');
    
    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      return;
    }

    // Step 2: Reset password using token
    console.log('\n🔄 Setting new password...');
    
    const passwordResponse = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: resetResult.resetToken,
        newPassword: newPassword
      })
    });

    const passwordResult = await passwordResponse.json();

    if (passwordResponse.ok) {
      console.log('🎉 SUCCESS: Password updated successfully!');
      console.log(`✅ User ${email} can now login with the new password`);
      
      // Step 3: Test the new password
      const testLogin = await askQuestion('\n🧪 Test login with new password? (y/n): ');
      
      if (testLogin.toLowerCase() === 'y') {
        console.log('\n🔄 Testing login...');
        
        const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email,
            password: newPassword
          })
        });

        const loginResult = await loginResponse.json();
        
        if (loginResponse.ok) {
          console.log('✅ Login test successful!');
          console.log(`👤 User: ${loginResult.user.name} (${loginResult.user.email})`);
          console.log('🎯 The password reset is working perfectly!');
        } else {
          console.log('❌ Login test failed:', loginResult.error);
        }
      }
      
    } else {
      console.log('❌ Failed to reset password:', passwordResult.error);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

async function showActiveTokens() {
  try {
    console.log('\n📋 Active Reset Tokens:');
    console.log('=' .repeat(40));
    
    const response = await fetch(`${SERVER_URL}/api/auth/reset-tokens`);
    const result = await response.json();
    
    if (result.tokens && result.tokens.length > 0) {
      result.tokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.email}`);
        console.log(`   Token: ${token.token}`);
        console.log(`   Expires: ${new Date(token.expires_at).toLocaleString()}\n`);
      });
    } else {
      console.log('No active reset tokens found.\n');
    }
  } catch (error) {
    console.log('❌ Error fetching tokens:', error.message);
  }
}

async function main() {
  console.log('🔐 Password Reset Administration Tool');
  console.log('====================================\n');
  
  while (true) {
    console.log('Options:');
    console.log('1. Reset user password');
    console.log('2. Show active reset tokens');
    console.log('3. List all users');
    console.log('4. Exit');
    
    const choice = await askQuestion('\nSelect option (1-4): ');
    
    switch (choice) {
      case '1':
        await resetUserPassword();
        break;
      case '2':
        await showActiveTokens();
        break;
      case '3':
        await listUsers();
        break;
      case '4':
        console.log('👋 Goodbye!');
        rl.close();
        return;
      default:
        console.log('❌ Invalid option. Please choose 1-4.');
    }
    
    if (choice !== '4') {
      await askQuestion('\nPress Enter to continue...');
      console.log('\n' + '='.repeat(50) + '\n');
    }
  }
}

// Run the admin tool
main().catch(console.error);