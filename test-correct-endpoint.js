async function testCorrectEndpoint() {
    console.log('🎯 Testing Correct Application Creation Endpoint');
    console.log('===============================================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    
    // Get JWT token
    console.log('🔐 Getting JWT token...');
    const jwtResponse = await fetch(`${baseUrl}/api/user/token-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password: password })
    });
    
    if (!jwtResponse.ok) {
        console.error('❌ JWT login failed');
        return;
    }
    
    const jwtData = await jwtResponse.json();
    const accessToken = jwtData.access_token;
    console.log('✅ JWT token obtained');
    
    // Test the correct endpoint
    const endpoint = '/api/applications/workspace/129/';
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`\n📡 Testing endpoint: ${endpoint}`);
    console.log('Request URL:', url);
    
    const requestBodies = [
        { name: 'Test Client Base', type: 'database' },
        { name: 'Test Client Base' },
        { workspace: 129, name: 'Test Client Base', type: 'database' },
        { workspace: 129, name: 'Test Client Base' }
    ];
    
    for (let i = 0; i < requestBodies.length; i++) {
        const requestBody = requestBodies[i];
        console.log(`\n📝 Request body ${i + 1}:`, JSON.stringify(requestBody));
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('Response body:', responseText);
            
            if (response.ok) {
                console.log('✅ SUCCESS! Application created successfully');
                const result = JSON.parse(responseText);
                console.log('Created application:', result);
                return result;
            } else {
                console.log(`❌ Failed with status ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
    
    console.log('\n🔍 Testing with Token authentication instead of JWT...');
    
    // Try with Token authentication
    const token = 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1';
    
    for (let i = 0; i < requestBodies.length; i++) {
        const requestBody = requestBodies[i];
        console.log(`\n📝 Token auth - Request body ${i + 1}:`, JSON.stringify(requestBody));
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response body:', responseText);
            
            if (response.ok) {
                console.log('✅ SUCCESS with Token auth! Application created successfully');
                const result = JSON.parse(responseText);
                console.log('Created application:', result);
                return result;
            } else {
                console.log(`❌ Failed with status ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

testCorrectEndpoint().catch(console.error);
