async function testCorrectTableCreation() {
    console.log('🎯 Testing Correct Table and Field Creation');
    console.log('==========================================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    const databaseId = 207; // The base we just created
    
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
    console.log(`🎯 Target database ID: ${databaseId}`);
    
    // Test table creation with the correct endpoint
    console.log('\n📋 Creating Table with Correct Endpoint');
    console.log('========================================');
    
    const tableEndpoint = `/api/database/tables/database/${databaseId}/`;
    const tableName = 'Content Ideas';
    
    console.log(`📡 Table endpoint: ${tableEndpoint}`);
    console.log(`📝 Creating table: ${tableName}`);
    
    try {
        const url = `${baseUrl}${tableEndpoint}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `JWT ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: tableName
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.ok) {
            console.log('✅ SUCCESS! Table created successfully');
            const tableResult = JSON.parse(responseText);
            console.log('Created table:', tableResult);
            
            const tableId = tableResult.id;
            console.log(`\n🎯 Table ID: ${tableId}`);
            
            // Now test field creation
            await testCorrectFieldCreation(accessToken, tableId, baseUrl);
            
            return tableResult;
        } else {
            console.log(`❌ Table creation failed with status ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testCorrectFieldCreation(accessToken, tableId, baseUrl) {
    console.log(`\n🔧 Creating Fields with Correct Endpoint`);
    console.log('=======================================');
    
    const fieldEndpoint = `/api/database/fields/table/${tableId}/`;
    console.log(`📡 Field endpoint: ${fieldEndpoint}`);
    
    const fields = [
        {
            name: 'Title',
            type: 'text',
            primary: true
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
        },
        {
            name: 'Created At',
            type: 'date'
        }
    ];
    
    const createdFields = [];
    
    for (const field of fields) {
        console.log(`\n📝 Creating field: ${field.name} (${field.type})`);
        
        try {
            const url = `${baseUrl}${fieldEndpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(field)
            });
            
            console.log('Response status:', response.status);
            
            const responseText = await response.text();
            console.log('Response body:', responseText);
            
            if (response.ok) {
                console.log(`✅ SUCCESS! Field '${field.name}' created successfully`);
                const fieldResult = JSON.parse(responseText);
                console.log('Created field:', fieldResult);
                createdFields.push(fieldResult);
            } else {
                console.log(`❌ Field '${field.name}' creation failed with status ${response.status}`);
            }
            
        } catch (error) {
            console.error(`❌ Error creating field '${field.name}':`, error.message);
        }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`✅ Created ${createdFields.length} fields successfully`);
    console.log('Field IDs:', createdFields.map(f => `${f.name} (ID: ${f.id})`).join(', '));
    
    return createdFields;
}

testCorrectTableCreation().catch(console.error);
