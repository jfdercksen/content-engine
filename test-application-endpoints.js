async function testApplicationEndpoints() {
    console.log('🔍 Testing Application Creation Endpoints');
    console.log('========================================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    
    // First, get JWT token
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
    
    // Test different endpoints for creating applications
    const endpoints = [
        '/api/applications/',
        '/api/databases/',
        '/api/workspaces/129/applications/',
        '/api/workspaces/129/databases/',
        '/api/applications/create/',
        '/api/databases/create/',
        '/api/workspaces/129/applications/create/',
        '/api/workspaces/129/databases/create/'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n📡 Testing endpoint: ${endpoint}`);
        
        try {
            const url = `${baseUrl}${endpoint}`;
            
            // Try different request bodies
            const requestBodies = [
                { name: 'Test Client Base', type: 'database' },
                { name: 'Test Client Base' },
                { workspace: 129, name: 'Test Client Base', type: 'database' },
                { workspace: 129, name: 'Test Client Base' }
            ];
            
            for (let i = 0; i < requestBodies.length; i++) {
                const requestBody = requestBodies[i];
                console.log(`  📝 Request body ${i + 1}:`, JSON.stringify(requestBody));
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `JWT ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log(`    Status: ${response.status}`);
                const responseText = await response.text();
                console.log(`    Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
                
                if (response.ok) {
                    console.log(`    ✅ SUCCESS! Endpoint: ${endpoint}, Body: ${JSON.stringify(requestBody)}`);
                    const result = JSON.parse(responseText);
                    console.log('    Created application:', result);
                    return result;
                }
            }
            
        } catch (error) {
            console.error(`    ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n🔍 Testing GET endpoints to understand structure...');
    
    // Test GET endpoints to understand the structure
    const getEndpoints = [
        '/api/applications/',
        '/api/databases/',
        '/api/workspaces/129/applications/',
        '/api/workspaces/129/databases/',
        '/api/workspaces/129/'
    ];
    
    for (const endpoint of getEndpoints) {
        try {
            const url = `${baseUrl}${endpoint}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `JWT ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`\n📡 GET ${endpoint}:`);
            console.log(`  Status: ${response.status}`);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log(`  Response: ${responseText.substring(0, 300)}${responseText.length > 300 ? '...' : ''}`);
            }
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
}

testApplicationEndpoints().catch(console.error);
