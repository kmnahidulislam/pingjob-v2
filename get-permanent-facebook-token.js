// Script to get a permanent Facebook page access token
console.log('🔧 Getting a PERMANENT Facebook page access token...\n');

console.log('Current issue: Tokens expire every 1-2 hours, causing posting failures.\n');

console.log('📋 Steps to get a NEVER-EXPIRING page token:\n');

console.log('1. Get a long-lived user access token:');
console.log('   https://developers.facebook.com/tools/explorer/');
console.log('   - Select your app "PingJob Platform"');
console.log('   - Generate user token with: pages_show_list, pages_manage_posts, pages_read_engagement');
console.log('   - Copy the user token\n');

console.log('2. Exchange for long-lived user token:');
console.log('   curl -i -X GET "https://graph.facebook.com/oauth/access_token?');
console.log('   grant_type=fb_exchange_token&');
console.log('   client_id=1377200590045125&');
console.log('   client_secret=YOUR_APP_SECRET&');
console.log('   fb_exchange_token=YOUR_SHORT_USER_TOKEN"\n');

console.log('3. Get the page access token:');
console.log('   curl "https://graph.facebook.com/me/accounts?access_token=YOUR_LONG_USER_TOKEN"\n');

console.log('4. The page access token from step 3 should never expire!\n');

console.log('⚠️  Alternative: Check your Facebook App settings:');
console.log('   - Make sure app is in "Live" mode (not Development)');
console.log('   - Verify app has proper permissions approved');
console.log('   - Check if App Review is required for production tokens\n');

console.log('🎯 Goal: Get a page access token that never expires');
console.log('📝 This will solve the hourly token expiration issue');