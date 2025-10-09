# Content Engine - Troubleshooting Guide

## Authentication Issues (401 Unauthorized)

### Problem
You're getting a 401 Unauthorized error when creating clients:
```
Failed to create database: 401 - {"detail":"Authentication credentials were not provided."}
```

### Root Cause Analysis

The error occurs because the Baserow token being used doesn't have the necessary permissions to create databases. Here's what's happening:

1. **Token Permissions**: The token needs database creation permissions
2. **API Endpoint**: The `/api/applications/` endpoint requires admin-level access
3. **Token Format**: The token must be valid and properly formatted

### Solutions

#### Solution 1: Use Admin Token (Recommended)

You need a Baserow token with database creation permissions. Here's how to get one:

1. **Login to Baserow Admin Panel**
   - Go to your Baserow instance
   - Login with admin credentials

2. **Create Admin Token**
   - Navigate to User Settings → API Tokens
   - Create a new token with "Admin" permissions
   - Copy the token

3. **Use Admin Token**
   ```bash
   # Test the token first
   curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
        https://baserow.aiautomata.co.za/api/applications/
   ```

#### Solution 2: Use Existing Database (Alternative)

If you don't have admin permissions, you can modify the system to use an existing database:

1. **Modify Client Creation Logic**
   ```typescript
   // In src/app/api/admin/clients/create/route.ts
   // Replace database creation with existing database usage
   
   // Instead of:
   const database = await createBaserowDatabase(clientName, baserowToken)
   
   // Use:
   const database = { id: '176' } // Your existing database ID
   ```

2. **Update Table Creation**
   - Tables will be created in the existing database
   - Each client gets unique table names (e.g., `{clientName}_content_ideas`)

#### Solution 3: Hybrid Approach (Recommended for Production)

Create a hybrid system that supports both approaches:

```typescript
// In src/app/api/admin/clients/create/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, displayName, baserowToken, useExistingDatabase = false } = body

    let database: any

    if (useExistingDatabase) {
      // Use existing database
      database = { id: process.env.DEFAULT_DATABASE_ID || '176' }
      console.log('Using existing database:', database.id)
    } else {
      // Create new database
      database = await createBaserowDatabase(clientName, baserowToken)
      console.log('Created new database:', database.id)
    }

    // Rest of the process remains the same...
  } catch (error) {
    // Error handling...
  }
}
```

### Testing Your Fix

#### Test 1: Token Validation
```bash
# Test if your token works
curl -H "Authorization: Token YOUR_TOKEN" \
     https://baserow.aiautomata.co.za/api/applications/

# Should return: 200 OK with applications list
# If 401: Token is invalid or lacks permissions
```

#### Test 2: Database Creation
```bash
# Test database creation
curl -X POST \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Database","type":"database"}' \
     https://baserow.aiautomata.co.za/api/applications/

# Should return: 201 Created with database info
# If 401: Token lacks database creation permissions
```

#### Test 3: Client Creation
```bash
# Test client creation through your API
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "clientName": "test-client",
       "displayName": "Test Client",
       "baserowToken": "YOUR_TOKEN"
     }' \
     http://localhost:3000/api/admin/clients/create
```

### Environment Variables

Make sure these environment variables are set:

```bash
# .env.local
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_MODERN_MANAGEMENT_TOKEN=your-token-here
DEFAULT_DATABASE_ID=176  # If using existing database approach
```

### Common Token Issues

#### Issue 1: Token Format
```bash
# Wrong format
Authorization: Bearer YOUR_TOKEN

# Correct format
Authorization: Token YOUR_TOKEN
```

#### Issue 2: Token Permissions
- **Read-only tokens**: Can only read data
- **Write tokens**: Can create/update data
- **Admin tokens**: Can create databases and manage users

#### Issue 3: Token Expiration
- Check if token has expired
- Create a new token if needed
- Update environment variables

### Debugging Steps

#### Step 1: Check Token Validity
```typescript
// Add this to your API route for debugging
console.log('Token length:', baserowToken.length)
console.log('Token format:', baserowToken.substring(0, 8) + '...')
```

#### Step 2: Test Baserow API Directly
```bash
# Test with curl
curl -H "Authorization: Token YOUR_TOKEN" \
     https://baserow.aiautomata.co.za/api/applications/
```

#### Step 3: Check Network Requests
- Open browser dev tools
- Go to Network tab
- Try creating a client
- Check the request headers and response

#### Step 4: Enable Debug Logging
```typescript
// Add to your API route
console.log('Request headers:', {
  'Authorization': `Token ${baserowToken.substring(0, 8)}...`,
  'Content-Type': 'application/json'
})
```

### Prevention

#### 1. Token Validation
Add token validation before attempting operations:

```typescript
async function validateBaserowToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${baserowUrl}/api/user/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch {
    return false
  }
}
```

#### 2. Permission Checking
Check if token has required permissions:

```typescript
async function checkDatabaseCreationPermissions(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${baserowUrl}/api/applications/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch {
    return false
  }
}
```

#### 3. User-Friendly Error Messages
```typescript
if (!response.ok) {
  if (response.status === 401) {
    throw new Error('Invalid Baserow token. Please check your token and try again.')
  } else if (response.status === 403) {
    throw new Error('Token lacks required permissions. Please use an admin token.')
  }
  // ... other error handling
}
```

### Quick Fix for Testing

If you want to test the system immediately, you can temporarily modify the code to use an existing database:

```typescript
// In src/app/api/admin/clients/create/route.ts
// Replace the database creation step with:
const database = { id: '176' } // Use existing database
console.log('Using existing database for testing:', database.id)
```

This will allow you to test the table creation and client configuration parts while you work on getting the proper admin token.

---

## Other Common Issues

### Issue: Table Creation Fails
**Error**: `Failed to create table contentIdeas: 400 - Bad Request`

**Solution**: Check field template definitions and ensure all field types are valid.

### Issue: Field Mapping Generation Fails
**Error**: `Failed to fetch fields for table contentIdeas: 404 - Not Found`

**Solution**: Verify table was created successfully before trying to fetch fields.

### Issue: Client Configuration Not Stored
**Error**: Client created but not available in system

**Solution**: Check if `DynamicClientConfig.addClient()` is working properly.

---

*For additional support, check the main documentation or contact the development team.*
