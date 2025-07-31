// Get proper Facebook page access token
import https from 'https';
import querystring from 'querystring';

const USER_TOKEN = 'EAATkjnZC0P8UBPNS79fF5f6mTj54p1FKBBq0EFK6FSStGyciZA0E0xkqLITO7zJ63SiTuFqKrk1fLfeiQDMus2QpHFYsyHPnLFOvDvURcaJHtw8c1LdisB9prytiLIBpgMXND6b5W2GDxXV2o9kQfoS6PZA1IIAIG3V2R8J0Nk2lpvLyiJx0RZC3hlCb5rErbNz90HfWBVzaD7y9ZB7uyrWErLUylJ5ZCMSFDNOCVT9CoZD';
const PAGE_ID = '786417694545751';

async function getPageAccessToken() {
  console.log('🔍 Getting proper page access token...\n');
  
  try {
    // Get user's pages
    console.log('Step 1: Getting user pages...');
    const accountsResponse = await makeRequest('GET', `/me/accounts?access_token=${USER_TOKEN}`);
    
    console.log(`Found ${accountsResponse.data.length} pages:`);
    accountsResponse.data.forEach(page => {
      console.log(`  - ${page.name} (ID: ${page.id})`);
      if (page.id === PAGE_ID) {
        console.log(`    ✅ Target page found! Access token: ${page.access_token ? 'Available' : 'Missing'}`);
        console.log(`    📋 Permissions: ${page.perms ? page.perms.join(', ') : 'Not shown'}`);
      }
    });
    
    const targetPage = accountsResponse.data.find(page => page.id === PAGE_ID);
    if (!targetPage) {
      console.log('❌ Target page not found in accounts');
      return null;
    }
    
    if (!targetPage.access_token) {
      console.log('❌ No access token available for target page');
      return null;
    }
    
    const pageToken = targetPage.access_token;
    console.log('\nStep 2: Testing page access token...');
    
    // Test the page token
    const testMessage = `🎯 Testing Facebook posting from PingJob Platform!

NEW JOB ALERT: Kronos Expert at PayPal Inc

We're looking for a Technical Subject Matter Expert with 5+ years of experience to lead global UKG Pro Workforce Management implementation.

Location: San Jose, CA
Type: Contract
Experience: Senior Level

Join our professional networking platform for more opportunities!

#Jobs #PingJob #Kronos #PayPal #TechJobs`;

    const testPostData = querystring.stringify({
      message: testMessage,
      access_token: pageToken
    });
    
    const postResponse = await makeRequest('POST', `/${PAGE_ID}/feed`, testPostData);
    console.log('✅ POSTING SUCCESSFUL with page token!');
    console.log('📝 Post ID:', postResponse.id);
    console.log('🔗 View post: https://facebook.com/' + postResponse.id);
    
    console.log('\n🎉 SUCCESS! Use this page access token:');
    console.log('📋 Page Access Token:', pageToken);
    
    return pageToken;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
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
getPageAccessToken();