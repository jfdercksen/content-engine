# Content Engine - Client Onboarding System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Client Onboarding Process](#client-onboarding-process)
4. [API Reference](#api-reference)
5. [MCP Server Integration](#mcp-server-integration)
6. [Troubleshooting](#troubleshooting)
7. [Development Guide](#development-guide)
8. [Security Considerations](#security-considerations)

---

## Overview

The Content Engine Client Onboarding System provides automated, scalable client setup with real Baserow integration. This system creates complete client environments including databases, tables, fields, and configurations automatically.

### Key Features
- **Automated Baserow Setup**: Creates real databases, tables, and fields
- **Rollback Mechanisms**: Automatic cleanup on failure
- **Multi-Client Support**: Isolated client environments
- **MCP Integration**: AI-powered client management
- **Dynamic Configuration**: Runtime client configuration management

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Engine System                    │
├─────────────────────────────────────────────────────────────┤
│  Admin Dashboard  │  API Routes  │  MCP Server  │  Baserow  │
│                   │              │              │           │
│  /admin/clients   │  /api/admin/ │  Multi-      │  Real     │
│  Client Forms     │  clients/    │  Client      │  Database │
│  Management UI    │  create      │  Support     │  Creation │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Admin Creates Client → 2. API Validates → 3. Baserow Setup → 4. Config Storage → 5. MCP Available
```

---

## Client Onboarding Process

### Step-by-Step Process

#### 1. **Admin Interface**
- Navigate to `/admin/clients`
- Click "Add New Client"
- Fill in required fields:
  - **Client ID**: Unique identifier (e.g., `tech-startup`)
  - **Display Name**: Human-readable name (e.g., `Tech Startup Inc`)
  - **Baserow Token**: API token with database creation permissions

#### 2. **API Validation**
```typescript
// Validates required fields
if (!clientName || !displayName || !baserowToken) {
  return 400 Bad Request
}
```

#### 3. **Baserow Resource Creation**
```typescript
// Creates real Baserow resources
1. Database Creation → get database.id
2. Table Creation → get table IDs
3. Field Creation → get field mappings
4. Configuration Storage → make available immediately
```

#### 4. **Rollback on Failure**
```typescript
// Automatic cleanup if any step fails
if (error) {
  rollbackDatabase(database.id, token)
  rollbackTables(createdTables, token)
  throw error
}
```

#### 5. **Client Availability**
- Client configuration stored in `DynamicClientConfig`
- Immediately available in MCP server
- Dashboard accessible at `/dashboard/{clientId}`

---

## API Reference

### POST `/api/admin/clients/create`

Creates a new client with full Baserow setup.

#### Request Body
```json
{
  "clientName": "tech-startup",
  "displayName": "Tech Startup Inc",
  "baserowToken": "your-baserow-token-here"
}
```

#### Response (Success)
```json
{
  "success": true,
  "clientConfig": {
    "id": "tech-startup",
    "name": "tech-startup",
    "displayName": "Tech Startup Inc",
    "baserowDatabaseId": "177",
    "baserowToken": "your-token",
    "tables": {
      "contentIdeas": "table-id-1",
      "socialMediaContent": "table-id-2",
      "images": "table-id-3",
      "brandAssets": "table-id-4",
      "emailIdeas": "table-id-5",
      "templates": "table-id-6"
    },
    "fieldMappings": {
      "contentIdeas": {
        "title": "field_1",
        "description": "field_2",
        // ... more mappings
      }
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Client 'Tech Startup Inc' has been successfully onboarded"
}
```

#### Response (Error)
```json
{
  "error": "Failed to create client",
  "details": "Failed to create database: 401 - Authentication credentials were not provided."
}
```

### Standard Table Templates

The system creates these tables for every client:

#### Content Ideas Table
```typescript
{
  name: 'Content Ideas',
  fields: [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'long_text' },
    { name: 'Idea Type', type: 'select', options: ['Social Media', 'Email', 'Blog', 'Video'] },
    { name: 'Source Type', type: 'select', options: ['Manual', 'AI Generated', 'Scraped'] },
    { name: 'Status', type: 'select', options: ['Draft', 'Approved', 'In Review', 'Published'] },
    { name: 'Created At', type: 'date' },
    { name: 'Updated At', type: 'date' }
  ]
}
```

#### Social Media Content Table
```typescript
{
  name: 'Social Media Content',
  fields: [
    { name: 'Post', type: 'long_text', required: true },
    { name: 'Platform', type: 'select', options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'] },
    { name: 'Content Type', type: 'select', options: ['Text', 'Image', 'Video', 'Carousel'] },
    { name: 'Character Count', type: 'number' },
    { name: 'Images', type: 'link_row', linkedTable: 'images' },
    { name: 'Content Idea', type: 'link_row', linkedTable: 'contentIdeas' },
    { name: 'Status', type: 'select', options: ['Draft', 'Approved', 'Published', 'Scheduled'] },
    { name: 'Scheduled Time', type: 'date' },
    { name: 'Created At', type: 'date' }
  ]
}
```

#### Images Table
```typescript
{
  name: 'Images',
  fields: [
    { name: 'Image', type: 'file' },
    { name: 'Image Prompt', type: 'text' },
    { name: 'Image Type', type: 'select', options: ['Generated', 'Uploaded', 'Stock'] },
    { name: 'Image Scene', type: 'text' },
    { name: 'Image Style', type: 'select', options: ['Photorealistic', 'Cartoon', 'Abstract', 'Minimalist'] },
    { name: 'Image Status', type: 'select', options: ['Generating', 'Completed', 'Failed', 'Approved'] },
    { name: 'Created At', type: 'date' }
  ]
}
```

---

## MCP Server Integration

### Multi-Client Support

The MCP server supports multiple clients with dynamic configuration:

```typescript
// Client-specific API calls
const clientConfig = getClientConfig(clientId)
const response = await fetch(url, {
  headers: {
    'Authorization': `Token ${clientConfig.baserowToken}`,
    'Content-Type': 'application/json',
  },
})
```

### Available MCP Tools

#### Content Management
- `get_content_ideas(clientId, limit?)` - Get content ideas
- `create_content_idea(clientId, title, description, ideaType, sourceType)` - Create new idea
- `get_social_media_content(clientId, platform?, status?, limit?)` - Get social posts
- `create_social_media_post(clientId, post, platform, contentType, characterCount?, status?)` - Create post
- `get_images(clientId, status?, limit?)` - Get images
- `update_content_status(clientId, tableType, recordId, status)` - Update status

#### Client Management
- `get_all_clients()` - List all configured clients
- `get_client_stats(clientId)` - Get client statistics
- `create_new_client(clientId, displayName, baserowToken, databaseId, tableIds)` - Create client

### Example MCP Usage

```typescript
// Get all clients
const clients = await mcp.get_all_clients()

// Create content for specific client
const idea = await mcp.create_content_idea(
  'tech-startup',
  'AI Automation Guide',
  'Comprehensive guide to AI automation for businesses',
  'Blog',
  'AI Generated'
)

// Get client statistics
const stats = await mcp.get_client_stats('tech-startup')
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error (401 Unauthorized)

**Error Message:**
```
Failed to create database: 401 - {"detail":"Authentication credentials were not provided."}
```

**Causes:**
- Invalid Baserow token
- Token lacks database creation permissions
- Token expired

**Solutions:**
1. **Verify Token**: Check if the Baserow token is valid
2. **Check Permissions**: Ensure token has database creation rights
3. **Regenerate Token**: Create a new token with proper permissions
4. **Test Token**: Use the token in Baserow API directly

**Testing Token:**
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
     https://baserow.aiautomata.co.za/api/applications/
```

#### 2. Database Creation Failed

**Error Message:**
```
Failed to create database: 403 - {"detail":"You don't have the required permissions."}
```

**Solutions:**
- Use a token with admin privileges
- Contact Baserow administrator for permissions
- Use an existing database with table creation permissions

#### 3. Table Creation Failed

**Error Message:**
```
Failed to create table contentIdeas: 400 - Invalid field configuration
```

**Solutions:**
- Check field template definitions
- Verify field types are supported by Baserow
- Review field configuration in `STANDARD_TABLE_TEMPLATES`

#### 4. Field Mapping Generation Failed

**Error Message:**
```
Failed to fetch fields for table contentIdeas: 404 - Table not found
```

**Solutions:**
- Verify table was created successfully
- Check table ID mapping
- Ensure token has field access permissions

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=content-engine:client-creation
```

### Rollback Verification

After a failed client creation, verify cleanup:
1. Check Baserow dashboard for orphaned databases
2. Verify no partial tables were created
3. Confirm client configuration was not stored

---

## Development Guide

### Adding New Table Templates

1. **Define Template** in `src/lib/types/client.ts`:
```typescript
export const STANDARD_TABLE_TEMPLATES = {
  // ... existing templates
  customTable: {
    name: 'Custom Table',
    fields: [
      { name: 'Field 1', type: 'text', required: true },
      { name: 'Field 2', type: 'number' },
      // ... more fields
    ]
  }
}
```

2. **Update Field Mappings**:
```typescript
export const STANDARD_FIELD_MAPPINGS = {
  // ... existing mappings
  customTable: {
    field1: 'field_1',
    field2: 'field_2',
  }
}
```

3. **Add to Client Config Interface**:
```typescript
export interface ClientConfiguration {
  // ... existing fields
  tables: {
    // ... existing tables
    customTable: string
  }
}
```

### Custom Field Types

Supported Baserow field types:
- `text` - Single line text
- `long_text` - Multi-line text
- `number` - Numeric values
- `select` - Dropdown selection
- `link_row` - Link to another table
- `file` - File upload
- `date` - Date/time values
- `boolean` - True/false values

### Error Handling Patterns

```typescript
// Always wrap operations in try-catch
try {
  const result = await operation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Implement rollback if needed
  await rollback()
  throw error
}
```

### Testing Client Creation

```typescript
// Test client creation
const testClient = {
  clientName: 'test-client',
  displayName: 'Test Client',
  baserowToken: 'valid-test-token'
}

const response = await fetch('/api/admin/clients/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testClient)
})

const result = await response.json()
console.log('Client creation result:', result)
```

---

## Security Considerations

### Token Management
- **Secure Storage**: Store Baserow tokens securely
- **Token Rotation**: Implement token rotation policies
- **Access Control**: Limit token permissions to minimum required
- **Audit Logging**: Log all client creation attempts

### Data Isolation
- **Separate Databases**: Each client gets isolated database
- **Token Isolation**: Client-specific tokens prevent cross-access
- **Access Controls**: Implement proper access controls
- **Data Encryption**: Encrypt sensitive client data

### API Security
- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Implement rate limiting for client creation
- **Authentication**: Require admin authentication for client creation
- **Authorization**: Verify admin permissions before operations

### Rollback Security
- **Cleanup Verification**: Verify complete cleanup after failures
- **Resource Monitoring**: Monitor for orphaned resources
- **Access Logging**: Log all rollback operations
- **Recovery Procedures**: Document recovery procedures

---

## Best Practices

### Client Onboarding
1. **Validate Requirements**: Ensure all prerequisites are met
2. **Test Token**: Verify Baserow token before client creation
3. **Monitor Process**: Watch logs during client creation
4. **Verify Success**: Confirm all resources were created correctly
5. **Test Access**: Verify client dashboard is accessible

### Error Handling
1. **Graceful Degradation**: Handle errors without breaking system
2. **User Feedback**: Provide clear error messages to users
3. **Rollback Strategy**: Always implement proper rollback
4. **Logging**: Log all operations for debugging
5. **Monitoring**: Set up alerts for failed operations

### Performance
1. **Async Operations**: Use async/await for all API calls
2. **Timeout Handling**: Implement timeouts for long operations
3. **Resource Limits**: Set limits on concurrent operations
4. **Caching**: Cache frequently accessed data
5. **Monitoring**: Monitor performance metrics

---

## Support and Maintenance

### Monitoring
- Monitor client creation success rates
- Track rollback frequency
- Monitor API response times
- Alert on authentication failures

### Maintenance Tasks
- Regular token rotation
- Cleanup orphaned resources
- Update table templates
- Monitor system performance

### Support Contacts
- **Technical Issues**: Contact development team
- **Baserow Issues**: Contact Baserow support
- **Security Issues**: Contact security team immediately

---

*This documentation is maintained by the Content Engine development team. Last updated: January 2024*
