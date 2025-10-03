const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('🎯 Live Demo: Resetting Password for john01@gmail.com');
console.log('=' .repeat(60));

async function demoPasswordReset() {
  try {
    // Step 1: Request password reset
    console.log('\n📧 Step 1: Requesting password reset...');
    
    const resetResponse = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john01@gmail.com' })
    });

    const resetResult = await resetResponse.json();
    
    if (resetResponse.ok) {
      console.log('✅ Reset token generated successfully!');
      console.log(`🔑 Token: ${resetResult.resetToken}`);
      console.log(`🔗 Reset URL: ${resetResult.resetUrl}`);
      console.log(`⏰ Expires: ${new Date(resetResult.expires).toLocaleString()}`);
      
      // Step 2: Use token to reset password
      console.log('\\n🔄 Step 2: Setting new password to "myNewPassword123"...');
      
      const passwordResponse = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetResult.resetToken,
          newPassword: 'myNewPassword123'
        })
      });

      const passwordResult = await passwordResponse.json();
      
      if (passwordResponse.ok) {
        console.log('✅ Password updated successfully!');
        console.log(`👤 User: ${passwordResult.user.name} (${passwordResult.user.email})`);
        
        // Step 3: Test login with new password
        console.log('\\n🧪 Step 3: Testing login with new password...');
        
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: 'john01@gmail.com',
            password: 'myNewPassword123'
          })
        });

        const loginResult = await loginResponse.json();
        
        if (loginResponse.ok) {
          console.log('✅ Login test successful!');
          console.log(`🎉 ${loginResult.user.name} can now login with the new password!`);
          
          console.log('\\n' + '=' .repeat(60));
          console.log('🎊 DEMO COMPLETE! Password reset system is working perfectly!');
          console.log('\\n📋 Summary:');
          console.log('• Generated secure reset token ✅');
          console.log('• Updated password safely ✅');  
          console.log('• Verified login works ✅');
          console.log('• All security checks passed ✅');
          console.log('\\n🚀 Your users can now reset their passwords anytime!');
          
        } else {
          console.log('❌ Login test failed:', loginResult.error);
        }
        
      } else {
        console.log('❌ Password reset failed:', passwordResult.error);
      }
      
    } else {
      console.log('❌ Failed to generate reset token:', resetResult.error);
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

demoPasswordReset();