#!/usr/bin/env node

// Test script to verify Baserow admin token
const https = require('https');

const BASEROW_URL = 'https://baserow.aiautomata.co.za';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.log('❌ Usage: node test-token.js YOUR_ADMIN_TOKEN');
  console.log('');
  console.log('Example:');
  console.log('node test-token.js SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1');
  process.exit(1);
}

async function testToken() {
  console.log('🔍 Testing Baserow admin token...');
  console.log(`Token: ${TOKEN.substring(0, 8)}...`);
  console.log('');

  try {
    // Test 1: Check user info
    console.log('📋 Test 1: Checking user info...');
    const userResponse = await makeRequest('/api/user/');
    
    if (userResponse.status === 200) {
      const userData = JSON.parse(userResponse.body);
      console.log('✅ User info retrieved successfully');
      console.log(`   User: ${userData.username || 'Unknown'}`);
      console.log(`   Email: ${userData.email || 'Unknown'}`);
    } else {
      console.log(`❌ User info failed: ${userResponse.status} ${userResponse.statusText}`);
      console.log(`   Response: ${userResponse.body}`);
      return false;
    }

    console.log('');

    // Test 2: List applications (databases)
    console.log('📋 Test 2: Listing applications (databases)...');
    const appsResponse = await makeRequest('/api/applications/');
    
    if (appsResponse.status === 200) {
      const appsData = JSON.parse(appsResponse.body);
      console.log('✅ Applications list retrieved successfully');
      console.log(`   Found ${appsData.results?.length || 0} applications`);
      
      if (appsData.results && appsData.results.length > 0) {
        console.log('   Applications:');
        appsData.results.forEach(app => {
          console.log(`     - ${app.name} (ID: ${app.id})`);
        });
      }
    } else {
      console.log(`❌ Applications list failed: ${appsResponse.status} ${appsResponse.statusText}`);
      console.log(`   Response: ${appsResponse.body}`);
      return false;
    }

    console.log('');

    // Test 3: Try to create a test database
    console.log('📋 Test 3: Testing database creation...');
    const testDbName = `test-db-${Date.now()}`;
    const createResponse = await makeRequest('/api/applications/', 'POST', {
      name: testDbName,
      type: 'database'
    });
    
    if (createResponse.status === 201) {
      const createData = JSON.parse(createResponse.body);
      console.log('✅ Database creation successful!');
      console.log(`   Created database: ${createData.name} (ID: ${createData.id})`);
      
      // Clean up: Delete the test database
      console.log('🧹 Cleaning up test database...');
      const deleteResponse = await makeRequest(`/api/applications/${createData.id}/`, 'DELETE');
      
      if (deleteResponse.status === 204) {
        console.log('✅ Test database deleted successfully');
      } else {
        console.log(`⚠️ Failed to delete test database: ${deleteResponse.status}`);
      }
      
      return true;
    } else {
      console.log(`❌ Database creation failed: ${createResponse.status} ${createResponse.statusText}`);
      console.log(`   Response: ${createResponse.body}`);
      
      if (createResponse.status === 401) {
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   - Token is invalid or expired');
        console.log('   - Check if token is copied correctly');
        console.log('   - Regenerate token in Baserow admin panel');
      } else if (createResponse.status === 403) {
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   - Token lacks database creation permissions');
        console.log('   - Use admin account to create token');
        console.log('   - Ensure token has "Admin" or "Create databases" permissions');
      }
      
      return false;
    }

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASEROW_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run the test
testToken().then(success => {
  console.log('');
  if (success) {
    console.log('🎉 SUCCESS: Your token has admin permissions!');
    console.log('   You can now use this token for client creation.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your .env.local file with this token');
    console.log('2. Restart your development server');
    console.log('3. Try creating a client through the admin dashboard');
  } else {
    console.log('❌ FAILED: Token does not have required permissions.');
    console.log('');
    console.log('Please:');
    console.log('1. Login to Baserow with an admin account');
    console.log('2. Create a new token with "Admin" permissions');
    console.log('3. Run this test again with the new token');
  }
}).catch(error => {
  console.log(`❌ Test failed: ${error.message}`);
});
