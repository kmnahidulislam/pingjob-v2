#!/usr/bin/env node

/**
 * Facebook Posting Fix Script
 * 
 * This script helps diagnose and fix Facebook posting issues
 * The main issue is that Facebook access tokens expire and need to be refreshed
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Facebook Posting Diagnostic Tool');
console.log('=====================================');

// Check current token status
async function checkFacebookToken() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  
  if (!token) {
    console.log('❌ FACEBOOK_ACCESS_TOKEN environment variable is missing');
    return false;
  }
  
  if (!pageId) {
    console.log('❌ FACEBOOK_PAGE_ID environment variable is missing');
    return false;
  }
  
  console.log('✅ Facebook credentials found');
  console.log(`📄 Page ID: ${pageId}`);
  console.log(`🔑 Token starts with: ${token.substring(0, 20)}...`);
  
  // Test token validity
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Token validation failed:', data.error.message);
      return false;
    }
    
    console.log('✅ Token is valid');
    return true;
  } catch (error) {
    console.log('❌ Error testing token:', error.message);
    return false;
  }
}

// Test posting to Facebook
async function testFacebookPost() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  
  const testMessage = `🔧 Test post from PingJob - ${new Date().toISOString()}
  
This is a test to verify Facebook posting is working correctly.
  
#PingJob #Testing #JobBoard`;

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        access_token: token,
      }),
    });

    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Test post failed:', result.error.message);
      console.log('💡 Error details:', JSON.stringify(result.error, null, 2));
      return false;
    }
    
    console.log('✅ Test post successful!');
    console.log(`📝 Post ID: ${result.id}`);
    return true;
  } catch (error) {
    console.log('❌ Error creating test post:', error.message);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('\n1. Checking Facebook token...');
  const tokenValid = await checkFacebookToken();
  
  if (!tokenValid) {
    console.log('\n❌ Facebook token is invalid or expired');
    console.log('\n🛠️ TO FIX THIS ISSUE:');
    console.log('1. Go to https://developers.facebook.com/tools/explorer/');
    console.log('2. Select your app');
    console.log('3. Select your page');
    console.log('4. Generate a new Page Access Token with these permissions:');
    console.log('   - pages_manage_posts');
    console.log('   - pages_read_engagement');
    console.log('   - pages_show_list');
    console.log('5. Copy the new token and update your FACEBOOK_ACCESS_TOKEN secret');
    console.log('\n📚 For long-lived tokens, use:');
    console.log('https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN');
    return;
  }
  
  console.log('\n2. Testing Facebook posting...');
  const postWorking = await testFacebookPost();
  
  if (postWorking) {
    console.log('\n✅ Facebook posting is working correctly!');
    console.log('🎉 Jobs should now post to your Facebook page automatically');
  } else {
    console.log('\n❌ Facebook posting is still not working');
    console.log('📋 Common issues:');
    console.log('- Token expired (generate new one)');
    console.log('- Missing permissions (pages_manage_posts required)');
    console.log('- Page not connected to app');
    console.log('- App not approved for business use');
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);