#!/usr/bin/env node

/**
 * Fix Facebook Page ID Issue
 */

const newToken = "EAATkjnZC0P8UBPLM33eUHzXgMmMgpBVRi9aVZCAkBCcZBL11RFcdwqxukZCiXBVjv6at02dU1iyDD4agOvygjrzcwos4pheQhcucqyCZBZBxWQd9pYR7VZAjyvRZCwo0zMehf5uCRlGN166U0S7NC52VgyW0ZABEEtFkn0fvreVZBTQ8UccObUZCS2STCPJujzp4IcaRh45cyZBjt9nvl0bzGCZA2RuSAuNDK8F0h3MSBZCKEErwZDZD";

console.log('🔧 Finding Correct Facebook Page ID');
console.log('==================================');

async function findPages() {
  try {
    console.log('Fetching your Facebook pages...');
    const response = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${newToken}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error fetching pages:', data.error.message);
      return;
    }
    
    if (!data.data || data.data.length === 0) {
      console.log('❌ No pages found for this account');
      console.log('💡 Make sure you have admin access to the PingJob page');
      return;
    }
    
    console.log(`✅ Found ${data.data.length} page(s):`);
    
    data.data.forEach((page, index) => {
      console.log(`\n📄 Page ${index + 1}:`);
      console.log(`   Name: ${page.name}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   Category: ${page.category}`);
      console.log(`   Access Token: ${page.access_token ? 'Available' : 'Not available'}`);
      
      // Test if this is the PingJob page
      if (page.name.toLowerCase().includes('pingjob') || page.name.toLowerCase().includes('ping job')) {
        console.log(`   🎯 This looks like the PingJob page!`);
        testPagePosting(page.id, page.access_token || newToken);
      }
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testPagePosting(pageId, pageToken) {
  const testMessage = `🔧 Testing Facebook posting for PingJob - ${new Date().toLocaleString()}

This is a test to confirm the correct Page ID and posting permissions.

#PingJob #Testing`;

  try {
    console.log(`\n🧪 Testing posting to page ID: ${pageId}`);
    const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        access_token: pageToken,
      }),
    });

    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Test post failed:', result.error.message);
      return false;
    }
    
    console.log('✅ Test post successful!');
    console.log(`📝 Post ID: ${result.id}`);
    console.log(`\n🎉 SOLUTION FOUND:`);
    console.log(`   Use Page ID: ${pageId}`);
    console.log(`   Update your FACEBOOK_PAGE_ID secret to: ${pageId}`);
    return true;
  } catch (error) {
    console.log('❌ Error testing page posting:', error.message);
    return false;
  }
}

findPages();