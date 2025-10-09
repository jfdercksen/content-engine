# Content Engine - Quick Start Guide

## Getting Started with Client Onboarding

This guide will help you quickly set up and test the client onboarding system.

---

## Prerequisites

### Required Tools
- Node.js 18+ 
- npm or yarn
- Baserow account with admin access
- Git

### Required Access
- Baserow instance with database creation permissions
- Admin access to Content Engine system

---

## Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd content-engine

# Install dependencies
npm install

# Install MCP server dependencies
cd mcp-server
npm install
cd ..
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
# Baserow Configuration
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_MODERN_MANAGEMENT_TOKEN=your-admin-token-here

# Optional: Default database for testing
DEFAULT_DATABASE_ID=176

# Development
NODE_ENV=development
```

### 3. Get Baserow Admin Token

1. **Login to Baserow**
   - Go to your Baserow instance
   - Login with admin credentials

2. **Create Admin Token**
   - Navigate to User Settings → API Tokens
   - Click "Create Token"
   - Name: "Content Engine Admin"
   - Permissions: Select "Admin" or "Create databases"
   - Copy the token

3. **Test Token**
   ```bash
   curl -H "Authorization: Token YOUR_TOKEN" \
        https://baserow.aiautomata.co.za/api/applications/
   ```
   Should return: `200 OK` with applications list

### 4. Start Development Server

```bash
# Start main application
npm run dev

# In another terminal, start MCP server
cd mcp-server
npm run build
node dist/index.js
```

---

## Testing Client Creation

### Method 1: Admin Dashboard (Recommended)

1. **Open Admin Dashboard**
   - Go to http://localhost:3000/admin/clients
   - Click "Add New Client"

2. **Fill Form**
   - Client ID: `test-client`
   - Display Name: `Test Client`
   - Baserow Token: `your-admin-token`

3. **Submit and Monitor**
   - Click "Create Client"
   - Watch browser console for progress
   - Check terminal logs for detailed output

### Method 2: API Direct

```bash
curl -X POST http://localhost:3000/api/admin/clients/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "test-client",
    "displayName": "Test Client",
    "baserowToken": "your-admin-token"
  }'
```

### Method 3: MCP Server

```bash
# Test MCP server connection
# (This requires Cursor MCP integration)
```

---

## Expected Results

### Successful Creation

**Console Output**:
```
Creating new client: { clientName: 'test-client', displayName: 'Test Client' }
Creating real Baserow resources...
Step 1: Creating Baserow database...
Database created: 177
Step 2: Creating tables...
✅ Table contentIdeas created successfully with ID: table-id-1
✅ Table socialMediaContent created successfully with ID: table-id-2
✅ Table images created successfully with ID: table-id-3
✅ Table brandAssets created successfully with ID: table-id-4
✅ Table emailIdeas created successfully with ID: table-id-5
✅ Table templates created successfully with ID: table-id-6
Step 3: Generating field mappings...
Field mappings generated: { contentIdeas: {...}, socialMediaContent: {...} }
Step 4: Storing client configuration...
Client configuration stored successfully
```

**API Response**:
```json
{
  "success": true,
  "clientConfig": {
    "id": "test-client",
    "displayName": "Test Client",
    "baserowDatabaseId": "177",
    "tables": {
      "contentIdeas": "table-id-1",
      "socialMediaContent": "table-id-2",
      "images": "table-id-3",
      "brandAssets": "table-id-4",
      "emailIdeas": "table-id-5",
      "templates": "table-id-6"
    },
    "isActive": true
  },
  "message": "Client 'Test Client' has been successfully onboarded"
}
```

### Verification

1. **Check Baserow Dashboard**
   - Login to Baserow
   - Verify new database was created
   - Check that all tables exist with proper fields

2. **Check Client Dashboard**
   - Go to http://localhost:3000/dashboard/test-client
   - Verify dashboard loads
   - Check that all sections are accessible

3. **Test MCP Integration**
   - Use MCP tools to interact with the new client
   - Create content ideas, social media posts, etc.

---

## Troubleshooting

### Issue: 401 Unauthorized

**Problem**: `Failed to create database: 401 - Authentication credentials were not provided.`

**Solution**:
1. Verify token is correct
2. Ensure token has admin permissions
3. Test token with curl command above

### Issue: 403 Forbidden

**Problem**: `Failed to create database: 403 - You don't have the required permissions.`

**Solution**:
1. Use admin token instead of regular token
2. Contact Baserow administrator for permissions
3. Use existing database approach (see troubleshooting guide)

### Issue: Table Creation Fails

**Problem**: `Failed to create table contentIdeas: 400 - Bad Request`

**Solution**:
1. Check field template definitions
2. Verify field types are supported
3. Check Baserow API documentation

### Issue: Client Not Available

**Problem**: Client created but dashboard not accessible

**Solution**:
1. Check client configuration storage
2. Verify MCP server restart
3. Check browser console for errors

---

## Quick Fixes

### Use Existing Database (Temporary)

If you can't get admin permissions, modify the code temporarily:

```typescript
// In src/app/api/admin/clients/create/route.ts
// Replace database creation with:
const database = { id: '176' } // Use existing database
console.log('Using existing database for testing:', database.id)
```

### Skip Field Creation (Testing)

For faster testing, you can skip field creation:

```typescript
// In createTables function, comment out field creation:
// for (const fieldTemplate of template.fields) {
//   await createField(table.id, fieldTemplate, token)
// }
```

---

## Next Steps

### After Successful Setup

1. **Test All Features**
   - Create content ideas
   - Generate social media posts
   - Upload images
   - Test status updates

2. **Configure MCP Server**
   - Update Cursor MCP settings
   - Test AI-powered operations
   - Create content via natural language

3. **Production Setup**
   - Set up proper environment variables
   - Configure monitoring and logging
   - Set up backup procedures

### Advanced Configuration

1. **Custom Table Templates**
   - Modify `STANDARD_TABLE_TEMPLATES`
   - Add new field types
   - Customize field options

2. **Client-Specific Settings**
   - Configure branding colors
   - Set up custom permissions
   - Add client-specific features

3. **Integration Features**
   - Set up webhooks
   - Configure external APIs
   - Add automation workflows

---

## Support

### Getting Help

1. **Check Documentation**
   - Main documentation: `CLIENT_ONBOARDING_DOCUMENTATION.md`
   - API reference: `API_REFERENCE.md`
   - Troubleshooting: `TROUBLESHOOTING_GUIDE.md`

2. **Debug Information**
   - Enable debug logging
   - Check browser console
   - Monitor terminal output

3. **Contact Support**
   - Development team for technical issues
   - Baserow support for Baserow-specific problems

### Useful Commands

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Test Baserow connection
curl -H "Authorization: Token YOUR_TOKEN" \
     https://baserow.aiautomata.co.za/api/user/

# Build MCP server
cd mcp-server && npm run build

# Start MCP server
cd mcp-server && node dist/index.js
```

---

*This quick start guide will get you up and running quickly. For detailed information, refer to the main documentation.*
