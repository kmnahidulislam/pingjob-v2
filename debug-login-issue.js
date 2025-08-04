#!/usr/bin/env node

/**
 * Debug Login Issue - Test Complete Flow
 */

console.log('🔍 Testing Complete Login Flow');
console.log('==============================');

async function testLoginFlow() {
  try {
    // Step 1: Test registration
    console.log('\n1️⃣ Testing Registration...');
    const testEmail = `debug${Date.now()}@example.com`;
    const regResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        firstName: 'Debug',
        lastName: 'User',
        userType: 'job_seeker'
      })
    });
    
    const regData = await regResponse.json();
    if (regResponse.ok) {
      console.log('✅ Registration successful:', regData.firstName, regData.lastName);
    } else {
      console.log('❌ Registration failed:', regData.message);
      return;
    }

    // Step 2: Test login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginResponse.json();
    if (loginResponse.ok) {
      console.log('✅ Login successful:', loginData.firstName, loginData.lastName);
    } else {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    // Step 3: Test session persistence
    console.log('\n3️⃣ Testing Session Persistence...');
    const userResponse = await fetch('http://localhost:5000/api/user', {
      credentials: 'include'
    });
    
    const userData = await userResponse.json();
    if (userResponse.ok) {
      console.log('✅ Session working:', userData.firstName, userData.lastName);
    } else {
      console.log('❌ Session failed:', userData.message);
      return;
    }

    // Step 4: Test dashboard endpoint
    console.log('\n4️⃣ Testing Dashboard Access...');
    const dashResponse = await fetch('http://localhost:5000/dashboard', {
      credentials: 'include'
    });
    
    if (dashResponse.ok) {
      console.log('✅ Dashboard accessible (status:', dashResponse.status + ')');
    } else {
      console.log('❌ Dashboard not accessible (status:', dashResponse.status + ')');
    }

    console.log('\n🎉 Complete login flow test finished!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Backend registration works');
    console.log('   ✓ Backend login works');
    console.log('   ✓ Session persistence works');
    console.log('   ? Dashboard route status:', dashResponse.status);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginFlow();