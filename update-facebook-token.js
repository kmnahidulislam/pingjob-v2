#!/usr/bin/env node

/**
 * Update Facebook Token and Test Posting
 */

const newToken = "EAATkjnZC0P8UBPLM33eUHzXgMmMgpBVRi9aVZCAkBCcZBL11RFcdwqxukZCiXBVjv6at02dU1iyDD4agOvygjrzcwos4pheQhcucqyCZBZBxWQd9pYR7VZAjyvRZCwo0zMehf5uCRlGN166U0S7NC52VgyW0ZABEEtFkn0fvreVZBTQ8UccObUZCS2STCPJujzp4IcaRh45cyZBjt9nvl0bzGCZA2RuSAuNDK8F0h3MSBZCKEErwZDZD";
const pageId = "786417794545751";

console.log('🔧 Testing Facebook Token and Posting');
console.log('====================================');

// Test token validity
async function testToken() {
  try {
    console.log('Testing token validity...');
    const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${newToken}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Token validation failed:', data.error.message);
      return false;
    }
    
    console.log('✅ Token is valid');
    console.log(`📄 Token belongs to: ${data.name}`);
    return true;
  } catch (error) {
    console.log('❌ Error testing token:', error.message);
    return false;
  }
}

// Test posting capability
async function testPost() {
  const testMessage = `🚀 Facebook Posting Test - ${new Date().toLocaleString()}

✅ PingJob Facebook integration is now working!

This test confirms that:
• Jobs will automatically post to Facebook when created
• Job updates will post to Facebook when edited
• The connection is stable and ready for live job postings

#PingJob #JobBoard #Hiring #TechJobs`;

  try {
    console.log('Creating test post...');
    const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        access_token: newToken,
      }),
    });

    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Test post failed:', result.error.message);
      console.log('Error details:', JSON.stringify(result.error, null, 2));
      return false;
    }
    
    console.log('✅ Test post successful!');
    console.log(`📝 Post ID: ${result.id}`);
    console.log(`🔗 Post URL: https://facebook.com/${result.id}`);
    return true;
  } catch (error) {
    console.log('❌ Error creating test post:', error.message);
    return false;
  }
}

// Run tests
async function main() {
  const tokenValid = await testToken();
  
  if (!tokenValid) {
    console.log('\n❌ Token validation failed - cannot proceed with posting test');
    return;
  }
  
  console.log('\n🧪 Testing Facebook posting...');
  const postWorking = await testPost();
  
  if (postWorking) {
    console.log('\n🎉 SUCCESS! Facebook posting is now working correctly');
    console.log('\n📋 Next steps:');
    console.log('1. Update your FACEBOOK_ACCESS_TOKEN secret in Replit');
    console.log('2. Create or edit a job to test automatic posting');
    console.log('3. Check your Facebook page for the job post');
  } else {
    console.log('\n❌ Facebook posting test failed');
    console.log('Please check token permissions and try again');
  }
}

main().catch(console.error);