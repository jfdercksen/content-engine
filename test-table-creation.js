async function testTableCreation() {
    console.log('🏗️ Testing Table and Field Creation');
    console.log('===================================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    const baseId = 207; // The base we just created
    
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
    console.log(`🎯 Target base ID: ${baseId}`);
    
    // Test different table creation endpoints
    console.log('\n📋 Testing Table Creation Endpoints');
    console.log('====================================');
    
    const tableEndpoints = [
        `/api/database/tables/`,
        `/api/applications/${baseId}/tables/`,
        `/api/tables/`,
        `/api/workspaces/129/tables/`,
        `/api/database/${baseId}/tables/`,
        `/api/baserow/database/${baseId}/tables/`
    ];
    
    for (const endpoint of tableEndpoints) {
        console.log(`\n📡 Testing endpoint: ${endpoint}`);
        
        const requestBodies = [
            { name: 'Content Ideas', order: 1 },
            { name: 'Content Ideas', order: 1, database_id: baseId },
            { name: 'Content Ideas', order: 1, application_id: baseId },
            { database: baseId, name: 'Content Ideas', order: 1 },
            { application: baseId, name: 'Content Ideas', order: 1 }
        ];
        
        for (let i = 0; i < requestBodies.length; i++) {
            const requestBody = requestBodies[i];
            console.log(`  📝 Request body ${i + 1}:`, JSON.stringify(requestBody));
            
            try {
                const url = `${baseUrl}${endpoint}`;
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
                    console.log(`    ✅ SUCCESS! Table created successfully`);
                    const result = JSON.parse(responseText);
                    console.log('    Created table:', result);
                    
                    // If table creation was successful, test field creation
                    if (result.id) {
                        console.log(`\n🔧 Testing Field Creation in Table ${result.id}`);
                        await testFieldCreation(accessToken, result.id, baseUrl);
                    }
                    
                    return result;
                } else {
                    console.log(`    ❌ Failed with status ${response.status}`);
                }
                
            } catch (error) {
                console.error(`    ❌ Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n🔍 Testing GET endpoints to understand table structure...');
    
    // Test GET endpoints to understand the structure
    const getEndpoints = [
        `/api/database/tables/`,
        `/api/applications/${baseId}/tables/`,
        `/api/tables/`,
        `/api/database/${baseId}/tables/`,
        `/api/applications/${baseId}/`
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

async function testFieldCreation(accessToken, tableId, baseUrl) {
    console.log(`\n🔧 Testing Field Creation in Table ${tableId}`);
    console.log('==========================================');
    
    const fieldEndpoints = [
        `/api/database/fields/table/${tableId}/`,
        `/api/tables/${tableId}/fields/`,
        `/api/database/tables/${tableId}/fields/`,
        `/api/fields/`
    ];
    
    const fieldTypes = [
        {
            name: 'Title',
            type: 'text',
            text_default: 'New Content Idea'
        },
        {
            name: 'Description', 
            type: 'long_text'
        },
        {
            name: 'Status',
            type: 'select',
            select_options: [
                { value: 'New', color: 'blue' },
                { value: 'In Progress', color: 'yellow' },
                { value: 'Completed', color: 'green' }
            ]
        }
    ];
    
    for (const endpoint of fieldEndpoints) {
        console.log(`\n📡 Testing field endpoint: ${endpoint}`);
        
        for (const field of fieldTypes) {
            console.log(`  📝 Creating field: ${field.name} (${field.type})`);
            
            try {
                const url = `${baseUrl}${endpoint}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `JWT ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(field)
                });
                
                console.log(`    Status: ${response.status}`);
                const responseText = await response.text();
                console.log(`    Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
                
                if (response.ok) {
                    console.log(`    ✅ SUCCESS! Field created successfully`);
                    const result = JSON.parse(responseText);
                    console.log('    Created field:', result);
                } else {
                    console.log(`    ❌ Failed with status ${response.status}`);
                }
                
            } catch (error) {
                console.error(`    ❌ Error: ${error.message}`);
            }
        }
    }
}

testTableCreation().catch(console.error);
