// Test Facebook posting functionality directly
import fetch from 'node-fetch';

async function testFacebookPost() {
  const accessToken = 'EAAIazBhDPQIBO1vH1bZBWREUisDl2adipiT7Ewt1fJIVKW5QFcaoboZCiwxkq3CgLSNdLRUnlXlsYIsdn2TYQHtMugSmFRCEybHkAorZCnsZCB7j1sxIplQpzbYRlvBNx0ufEns4su8lnyGVvPwShpyVUWse1oxpI2lO2ECkBQZCzIcL9U3t8fxZCmi48acccLuq2hV9cvSma5QGMdJxgCKoDWge2RtfHk';
  
  // First, let's test the token validity
  console.log('Testing Facebook access token...');
  
  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Facebook token error:', tokenData.error);
      return;
    }
    
    console.log('✓ Facebook token is valid for user:', tokenData.name);
    
    // Test getting pages
    const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();
    
    console.log('Available Facebook pages:', pagesData.data?.length || 0);
    
    if (pagesData.data && pagesData.data.length > 0) {
      const page = pagesData.data[0];
      console.log('Using page:', page.name, 'ID:', page.id);
      
      // Test posting to the page
      const postContent = {
        message: `🚀 New Job Alert! 

Senior Software Engineer position available at PingJob Demo Company

📍 Location: San Francisco, CA
💰 Salary: $120,000 - $180,000
📋 Type: Full-time
🎯 Level: Senior

Join our amazing team as a Senior Software Engineer! We're looking for passionate developers to help build the future of recruitment technology.

Apply now through PingJob! #hiring #softwareengineer #techjobs`,
        access_token: page.access_token
      };
      
      const postResponse = await fetch(`https://graph.facebook.com/${page.id}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postContent)
      });
      
      const postResult = await postResponse.json();
      
      if (postResult.error) {
        console.error('Facebook posting error:', postResult.error);
      } else {
        console.log('✅ Successfully posted to Facebook!');
        console.log('Post ID:', postResult.id);
      }
    } else {
      console.log('No Facebook pages found for this user');
    }
    
  } catch (error) {
    console.error('Facebook test error:', error.message);
  }
}

testFacebookPost();