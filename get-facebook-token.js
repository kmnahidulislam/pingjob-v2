// Script to get Facebook access token with proper permissions
import https from 'https';
import querystring from 'querystring';

const APP_ID = '1377200590045125';
const APP_SECRET = '6ecf77a7322215522efb9b795fc283ad';
const PAGE_ID = '786417694545751'; // Your existing page ID

async function getFacebookAccessToken() {
  console.log('🔑 Getting Facebook access token with posting permissions...\n');
  
  // Step 1: Get App Access Token
  console.log('Step 1: Getting App Access Token...');
  const appTokenParams = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: APP_ID,
    client_secret: APP_SECRET
  });
  
  try {
    const appTokenResponse = await makeRequest('GET', `/oauth/access_token?${appTokenParams}`);
    const appToken = appTokenResponse.access_token;
    console.log('✅ App Access Token obtained');
    
    // Step 2: Get User Access Token URL (manual step)
    console.log('\nStep 2: Manual User Access Token Generation Required');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Please follow these steps to get a User Access Token with posting permissions:');
    console.log('');
    console.log('1. Open this URL in your browser:');
    console.log(`   https://developers.facebook.com/tools/explorer/`);
    console.log('');
    console.log('2. Select your app: "PingJob Platform" (App ID: 1377200590045125)');
    console.log('');
    console.log('3. Click "Get Token" → "Get User Access Token"');
    console.log('');
    console.log('4. Add these permissions (click "Add a Permission"):');
    console.log('   ✓ pages_show_list');
    console.log('   ✓ pages_manage_posts');
    console.log('   ✓ pages_read_engagement');
    console.log('   ✓ publish_to_groups (optional)');
    console.log('');
    console.log('5. Click "Generate Access Token" and copy the token');
    console.log('');
    console.log('6. Test the token by clicking "Submit" with this query:');
    console.log('   me/accounts');
    console.log('');
    console.log('7. Look for your page in the response and copy the "access_token" field');
    console.log('   This will be your Page Access Token with posting permissions');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Step 3: Test current token permissions
    console.log('\nStep 3: Testing your current token permissions...');
    const currentToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (currentToken) {
      try {
        const permissionsResponse = await makeRequest('GET', `/me/permissions?access_token=${currentToken}`);
        console.log('\n📋 Current token permissions:');
        permissionsResponse.data.forEach(perm => {
          const status = perm.status === 'granted' ? '✅' : '❌';
          console.log(`   ${status} ${perm.permission}`);
        });
        
        // Test posting capability
        console.log('\n🧪 Testing posting capability...');
        const testPostData = querystring.stringify({
          message: 'Test post from PingJob Platform - checking posting permissions',
          access_token: currentToken
        });
        
        try {
          await makeRequest('POST', `/${PAGE_ID}/feed`, testPostData);
          console.log('✅ Posting test SUCCESSFUL! Your token works for posting.');
        } catch (postError) {
          console.log('❌ Posting test FAILED:', postError.message);
          console.log('💡 You need to get a new token with pages_manage_posts permission');
        }
        
      } catch (error) {
        console.log('❌ Failed to check current token:', error.message);
      }
    } else {
      console.log('⚠️  No current FACEBOOK_ACCESS_TOKEN found in environment');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    if (data && method === 'POST') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data && method === 'POST') {
      req.write(data);
    }
    
    req.end();
  });
}

// Run the script
getFacebookAccessToken();