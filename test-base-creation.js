// Read environment variables directly

async function testBaseCreation() {
    console.log('🧪 Testing Base Creation in Workspace 129');
    console.log('=====================================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const token = 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    
    console.log('Base URL:', baseUrl);
    console.log('Token:', token ? `${token.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!token) {
        console.error('❌ No token found in environment variables');
        return;
    }
    
    // Test 1: Try creating a base in workspace 129
    console.log('\n🔍 Test 1: Creating base in workspace 129');
    
    const endpoints = [
        `/api/workspaces/129/applications/`,
        `/api/applications/`,
        `/api/databases/`,
        `/api/workspaces/129/databases/`
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n📡 Trying endpoint: ${endpoint}`);
        
        try {
            const url = `${baseUrl}${endpoint}`;
            const requestBody = {
                name: 'Test Client Base',
                type: 'database'
            };
            
            console.log('Request URL:', url);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('Response body:', responseText);
            
            if (response.ok) {
                console.log('✅ SUCCESS! Base created successfully');
                const result = JSON.parse(responseText);
                console.log('Created base:', result);
                return result;
            } else {
                console.log(`❌ Failed with status ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
    
    console.log('\n🔍 Test 2: Trying JWT authentication');
    
    // Test 2: Try with JWT authentication
    try {
        const jwtUrl = `${baseUrl}/api/auth/login/`;
        const jwtResponse = await fetch(jwtUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        if (jwtResponse.ok) {
            const jwtData = await jwtResponse.json();
            console.log('✅ JWT login successful');
            console.log('Access token:', jwtData.access_token ? `${jwtData.access_token.substring(0, 20)}...` : 'NOT FOUND');
            
            // Try creating base with JWT
            const baseUrl_jwt = `${baseUrl}/api/applications/`;
            const baseResponse = await fetch(baseUrl_jwt, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${jwtData.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test Client Base JWT',
                    type: 'database'
                })
            });
            
            console.log('JWT Base creation status:', baseResponse.status);
            const baseResponseText = await baseResponse.text();
            console.log('JWT Base creation response:', baseResponseText);
            
        } else {
            console.log('❌ JWT login failed');
        }
        
    } catch (error) {
        console.error('❌ JWT test error:', error.message);
    }
}

testBaseCreation().catch(console.error);
