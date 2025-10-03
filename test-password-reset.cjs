const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SERVER_URL = 'http://localhost:3001';

console.log('🔐 Testing Password Reset Functionality...\n');

async function testPasswordReset() {
  try {
    // Step 1: Request password reset for an existing user
    console.log('📧 Step 1: Requesting password reset for hello01@gmail.com');
    
    const resetResponse = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hello01@gmail.com' })
    });

    const resetResult = await resetResponse.json();
    console.log('✅ Reset request response:', resetResult);

    if (!resetResult.resetToken) {
      console.log('❌ No reset token received');
      return false;
    }

    const resetToken = resetResult.resetToken;
    console.log(`🔑 Reset token: ${resetToken}`);
    console.log(`🔗 Reset URL: ${resetResult.resetUrl}`);

    // Step 2: Use the reset token to change password
    console.log('\n🔄 Step 2: Using reset token to change password');
    
    const newPassword = 'NewPassword123!';
    const passwordChangeResponse = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: resetToken,
        newPassword: newPassword
      })
    });

    const passwordChangeResult = await passwordChangeResponse.json();
    console.log('✅ Password change response:', passwordChangeResult);

    if (passwordChangeResponse.ok) {
      console.log('✅ Password reset successful!');
      
      // Step 3: Test login with new password
      console.log('\n🔑 Step 3: Testing login with new password');
      
      const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'hello01@gmail.com',
          password: newPassword
        })
      });

      const loginResult = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login with new password successful!');
        console.log('👤 User:', loginResult.user);
        return true;
      } else {
        console.log('❌ Login with new password failed:', loginResult);
        return false;
      }
    } else {
      console.log('❌ Password reset failed:', passwordChangeResult);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testInvalidScenarios() {
  console.log('\n🧪 Testing invalid scenarios...\n');

  // Test with non-existent email
  console.log('📧 Testing with non-existent email');
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' })
    });
    const result = await response.json();
    console.log('✅ Non-existent email response:', result.message);
  } catch (error) {
    console.log('❌ Error testing non-existent email:', error.message);
  }

  // Test with invalid token
  console.log('\n🔑 Testing with invalid token');
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: 'invalid-token',
        newPassword: 'NewPassword123!'
      })
    });
    const result = await response.json();
    console.log('✅ Invalid token response:', result.error);
  } catch (error) {
    console.log('❌ Error testing invalid token:', error.message);
  }
}

async function showActiveTokens() {
  console.log('\n📋 Active reset tokens:');
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/reset-tokens`);
    const result = await response.json();
    
    if (result.tokens && result.tokens.length > 0) {
      result.tokens.forEach((token, index) => {
        console.log(`${index + 1}. Email: ${token.email}`);
        console.log(`   Token: ${token.token}`);
        console.log(`   Expires: ${token.expires_at}`);
        console.log(`   Created: ${token.created_at}\n`);
      });
    } else {
      console.log('No active reset tokens found.');
    }
  } catch (error) {
    console.log('❌ Error fetching tokens:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Password Reset Tests...\n');

  await showActiveTokens();
  
  const success = await testPasswordReset();
  await testInvalidScenarios();
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 SUCCESS: Password reset functionality is working!');
    console.log('✅ Users can now reset their passwords through the portal.');
  } else {
    console.log('❌ FAILED: Password reset functionality has issues.');
    console.log('💡 Please check the server logs for more details.');
  }
  console.log('='.repeat(60));
}

// Run all tests
runAllTests().catch(console.error);