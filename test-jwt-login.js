async function testJWTLogin() {
    console.log('🔐 Testing JWT Login');
    console.log('==================');
    
    const baseUrl = 'https://baserow.aiautomata.co.za';
    const username = 'johan@aiautomations.co.za';
    const password = 'P@ssw0rd.123';
    
    console.log('Base URL:', baseUrl);
    console.log('Username:', username);
    console.log('Password:', password ? '***' : 'NOT FOUND');
    
    try {
        const jwtUrl = `${baseUrl}/api/user/token-auth/`;
        console.log('\n📡 JWT Login URL:', jwtUrl);
        
        const jwtResponse = await fetch(jwtUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                password: password
            })
        });
        
        console.log('Response status:', jwtResponse.status);
        console.log('Response headers:', Object.fromEntries(jwtResponse.headers.entries()));
        
        const responseText = await jwtResponse.text();
        console.log('Response body:', responseText);
        
        if (jwtResponse.ok) {
            const jwtData = JSON.parse(responseText);
            console.log('✅ JWT login successful!');
            console.log('Access token:', jwtData.access_token ? `${jwtData.access_token.substring(0, 20)}...` : 'NOT FOUND');
            console.log('Refresh token:', jwtData.refresh_token ? `${jwtData.refresh_token.substring(0, 20)}...` : 'NOT FOUND');
            console.log('User:', jwtData.user ? JSON.stringify(jwtData.user, null, 2) : 'NOT FOUND');
            
            // Now test creating a base with JWT
            console.log('\n🏗️ Testing base creation with JWT...');
            
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
            
            console.log('Base creation status:', baseResponse.status);
            console.log('Base creation headers:', Object.fromEntries(baseResponse.headers.entries()));
            const baseResponseText = await baseResponse.text();
            console.log('Base creation response:', baseResponseText);
            
            if (baseResponse.ok) {
                console.log('✅ Base creation successful!');
                const baseData = JSON.parse(baseResponseText);
                console.log('Created base:', baseData);
            } else {
                console.log('❌ Base creation failed');
            }
            
        } else {
            console.log('❌ JWT login failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testJWTLogin().catch(console.error);
