// Test Facebook posting with new access token
import https from 'https';
import querystring from 'querystring';

const NEW_ACCESS_TOKEN = 'EAATkjnZC0P8UBPNS79fF5f6mTj54p1FKBBq0EFK6FSStGyciZA0E0xkqLITO7zJ63SiTuFqKrk1fLfeiQDMus2QpHFYsyHPnLFOvDvURcaJHtw8c1LdisB9prytiLIBpgMXND6b5W2GDxXV2o9kQfoS6PZA1IIAIG3V2R8J0Nk2lpvLyiJx0RZC3hlCb5rErbNz90HfWBVzaD7y9ZB7uyrWErLUylJ5ZCMSFDNOCVT9CoZD';
const PAGE_ID = '786417694545751';

async function testFacebookPosting() {
  console.log('🔍 Testing new Facebook access token...\n');
  
  try {
    // Step 1: Check token permissions
    console.log('Step 1: Checking token permissions...');
    const permissionsResponse = await makeRequest('GET', `/me/permissions?access_token=${NEW_ACCESS_TOKEN}`);
    console.log('📋 Token permissions:');
    permissionsResponse.data.forEach(perm => {
      const status = perm.status === 'granted' ? '✅' : '❌';
      console.log(`   ${status} ${perm.permission}`);
    });
    
    // Step 2: Check if this is a page token or user token
    console.log('\nStep 2: Checking token type...');
    const tokenInfo = await makeRequest('GET', `/me?access_token=${NEW_ACCESS_TOKEN}`);
    console.log('Token belongs to:', tokenInfo.name, '(ID:', tokenInfo.id + ')');
    
    // Step 3: Get page access token if this is a user token
    if (!tokenInfo.id.startsWith('786417694545751')) {
      console.log('\nStep 3: Getting page access token...');
      const accountsResponse = await makeRequest('GET', `/me/accounts?access_token=${NEW_ACCESS_TOKEN}`);
      
      const targetPage = accountsResponse.data.find(page => page.id === PAGE_ID);
      if (targetPage) {
        console.log('✅ Found target page:', targetPage.name);
        console.log('📄 Page access token available:', targetPage.access_token ? 'YES' : 'NO');
        
        if (targetPage.access_token) {
          console.log('\n🧪 Testing posting with page access token...');
          const testPostData = querystring.stringify({
            message: '🎯 Testing Facebook posting from PingJob Platform!\n\nNew job posting system is now live with enhanced social media integration. Join our professional networking platform for the latest job opportunities.\n\n#Jobs #PingJob #Networking #Career',
            access_token: targetPage.access_token
          });
          
          const postResponse = await makeRequest('POST', `/${PAGE_ID}/feed`, testPostData);
          console.log('✅ POSTING SUCCESSFUL!');
          console.log('📝 Post ID:', postResponse.id);
          console.log('🔗 Post URL: https://facebook.com/' + postResponse.id);
          
          return targetPage.access_token;
        }
      } else {
        console.log('❌ Target page not found in accounts');
      }
    } else {
      // This is already a page token
      console.log('\n🧪 Testing posting with provided token (appears to be page token)...');
      const testPostData = querystring.stringify({
        message: '🎯 Testing Facebook posting from PingJob Platform!\n\nNew job posting system is now live with enhanced social media integration. Join our professional networking platform for the latest job opportunities.\n\n#Jobs #PingJob #Networking #Career',
        access_token: NEW_ACCESS_TOKEN
      });
      
      const postResponse = await makeRequest('POST', `/${PAGE_ID}/feed`, testPostData);
      console.log('✅ POSTING SUCCESSFUL!');
      console.log('📝 Post ID:', postResponse.id);
      console.log('🔗 Post URL: https://facebook.com/' + postResponse.id);
      
      return NEW_ACCESS_TOKEN;
    }
    
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

// Run the test
testFacebookPosting().then(pageToken => {
  if (pageToken) {
    console.log('\n🎉 SUCCESS! Facebook posting is now working!');
    console.log('📋 Next steps:');
    console.log('1. Use this page access token in your environment secrets');
    console.log('2. Update FACEBOOK_ACCESS_TOKEN with the working token');
    console.log('3. Test job editing to see automatic Facebook posting');
  } else {
    console.log('\n⚠️  Still need to configure proper permissions');
  }
});