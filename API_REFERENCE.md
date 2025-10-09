# Content Engine - API Reference

## Client Management API

### POST `/api/admin/clients/create`

Creates a new client with full Baserow integration.

#### Request

**URL**: `/api/admin/clients/create`  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "clientName": "string (required)",
  "displayName": "string (required)", 
  "baserowToken": "string (required)"
}
```

**Parameters**:
- `clientName`: Unique identifier for the client (alphanumeric, lowercase)
- `displayName`: Human-readable name for the client
- `baserowToken`: Baserow API token with database creation permissions

#### Response

**Success Response (200)**:
```json
{
  "success": true,
  "clientConfig": {
    "id": "tech-startup",
    "name": "tech-startup", 
    "displayName": "Tech Startup Inc",
    "baserowDatabaseId": "177",
    "baserowToken": "token-masked",
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
        "ideaType": "field_3",
        "sourceType": "field_4",
        "status": "field_5",
        "createdAt": "field_6",
        "updatedAt": "field_7"
      }
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Client 'Tech Startup Inc' has been successfully onboarded"
}
```

**Error Response (400)**:
```json
{
  "error": "Missing required fields: clientName, displayName, baserowToken"
}
```

**Error Response (500)**:
```json
{
  "error": "Failed to create client",
  "details": "Failed to create database: 401 - Authentication credentials were not provided."
}
```

#### Example Usage

```bash
curl -X POST http://localhost:3000/api/admin/clients/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "tech-startup",
    "displayName": "Tech Startup Inc", 
    "baserowToken": "your-baserow-token"
  }'
```

---

## Baserow API Integration

### Database Creation

**Endpoint**: `POST /api/applications/`  
**Purpose**: Creates a new Baserow database

**Request**:
```json
{
  "name": "Client Database Name",
  "type": "database"
}
```

**Response**:
```json
{
  "id": 177,
  "name": "Client Database Name",
  "type": "database",
  "created_on": "2024-01-15T10:30:00Z"
}
```

### Table Creation

**Endpoint**: `POST /api/database/tables/`  
**Purpose**: Creates a new table in a database

**Request**:
```json
{
  "name": "Table Name",
  "database_id": 177
}
```

**Response**:
```json
{
  "id": "table-id",
  "name": "Table Name", 
  "database_id": 177,
  "created_on": "2024-01-15T10:30:00Z"
}
```

### Field Creation

**Endpoint**: `POST /api/database/fields/table/{table_id}/`  
**Purpose**: Creates a new field in a table

**Request**:
```json
{
  "name": "Field Name",
  "type": "text",
  "table_id": "table-id"
}
```

**Response**:
```json
{
  "id": "field-id",
  "name": "Field Name",
  "type": "text",
  "table_id": "table-id"
}
```

---

## MCP Server API

### Content Ideas

#### Get Content Ideas
```typescript
get_content_ideas(clientId: string, limit?: number)
```

**Parameters**:
- `clientId`: Client identifier
- `limit`: Number of ideas to retrieve (default: 50)

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 content ideas for modern-management:\n\n• AI Automation Guide (Blog) - Draft\n  Comprehensive guide to AI automation...\n\n• Social Media Strategy (Social Media) - Approved\n  Complete social media strategy..."
    }
  ]
}
```

#### Create Content Idea
```typescript
create_content_idea(
  clientId: string,
  title: string,
  description: string,
  ideaType: string,
  sourceType: string
)
```

**Parameters**:
- `clientId`: Client identifier
- `title`: Idea title
- `description`: Idea description
- `ideaType`: Type of idea (Social Media, Email, Blog, Video)
- `sourceType`: Source type (Manual, AI Generated, Scraped)

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Content idea created successfully!\n\nID: 123\nTitle: AI Automation Guide\nType: Blog\nSource: AI Generated\nStatus: Draft"
    }
  ]
}
```

### Social Media Content

#### Get Social Media Content
```typescript
get_social_media_content(
  clientId: string,
  platform?: string,
  status?: string,
  limit?: number
)
```

**Parameters**:
- `clientId`: Client identifier
- `platform`: Filter by platform (Facebook, Instagram, Twitter, etc.)
- `status`: Filter by status (Draft, Approved, Published, etc.)
- `limit`: Number of posts to retrieve (default: 50)

#### Create Social Media Post
```typescript
create_social_media_post(
  clientId: string,
  post: string,
  platform: string,
  contentType: string,
  characterCount?: number,
  status?: string
)
```

**Parameters**:
- `clientId`: Client identifier
- `post`: Post content
- `platform`: Platform (Facebook, Instagram, Twitter, LinkedIn, TikTok)
- `contentType`: Content type (Text, Image, Video, Carousel)
- `characterCount`: Character count (optional)
- `status`: Post status (default: Draft)

### Images

#### Get Images
```typescript
get_images(clientId: string, status?: string, limit?: number)
```

**Parameters**:
- `clientId`: Client identifier
- `status`: Filter by status (Generating, Completed, Failed, etc.)
- `limit`: Number of images to retrieve (default: 50)

### Client Management

#### Get All Clients
```typescript
get_all_clients()
```

**Response**:
```json
{
  "content": [
    {
      "type": "text", 
      "text": "📋 Available Clients (2):\n\n• Modern Management (modern-management)\n  Status: Active\n  Tables: 7\n  Last Activity: 2024-01-15\n\n• Tech Startup (tech-startup)\n  Status: Active\n  Tables: 6\n  Last Activity: 2024-01-14"
    }
  ]
}
```

#### Get Client Stats
```typescript
get_client_stats(clientId: string)
```

**Parameters**:
- `clientId`: Client identifier

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "📊 Client Statistics for modern-management:\n\n• Content Ideas: 25\n• Social Media Posts: 150\n• Images: 89\n\nTotal Records: 264"
    }
  ]
}
```

#### Create New Client
```typescript
create_new_client(
  clientId: string,
  displayName: string,
  baserowToken: string,
  databaseId: string,
  tableIds: object
)
```

**Parameters**:
- `clientId`: Unique client identifier
- `displayName`: Human-readable client name
- `baserowToken`: Baserow API token
- `databaseId`: Baserow database ID
- `tableIds`: Object with table IDs for each table type

### Content Status Updates

#### Update Content Status
```typescript
update_content_status(
  clientId: string,
  tableType: string,
  recordId: number,
  status: string
)
```

**Parameters**:
- `clientId`: Client identifier
- `tableType`: Type of content (contentIdeas, socialMediaContent, images)
- `recordId`: ID of the record to update
- `status`: New status value

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Status updated successfully!\n\nTable: contentIdeas\nRecord ID: 123\nNew Status: Approved"
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TOKEN` | Baserow token is invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | Token lacks required permissions |
| `CLIENT_EXISTS` | Client with this ID already exists |
| `DATABASE_CREATION_FAILED` | Failed to create Baserow database |
| `TABLE_CREATION_FAILED` | Failed to create Baserow table |
| `FIELD_CREATION_FAILED` | Failed to create Baserow field |
| `ROLLBACK_FAILED` | Failed to clean up resources |

---

## Rate Limits

### API Rate Limits

- **Client Creation**: 5 requests per minute per IP
- **MCP Operations**: 100 requests per minute per client
- **Baserow API**: Subject to Baserow instance limits

### Best Practices

1. **Batch Operations**: Group related operations when possible
2. **Error Handling**: Always implement proper error handling
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Monitoring**: Monitor API usage and error rates

---

## Authentication

### Baserow Token Format

```
Authorization: Token YOUR_BASEROW_TOKEN
```

### Token Requirements

- **Client Creation**: Admin token with database creation permissions
- **Content Operations**: Token with read/write permissions for specific tables
- **Status Updates**: Token with update permissions for specific tables

### Token Validation

```bash
# Test token validity
curl -H "Authorization: Token YOUR_TOKEN" \
     https://baserow.aiautomata.co.za/api/user/
```

---

## Webhooks

### Supported Webhooks

Currently, the system supports N8N webhooks for:
- Image generation completion
- Email idea generation
- Content status changes

### Webhook Format

```json
{
  "event": "image.generation.complete",
  "clientId": "modern-management",
  "data": {
    "imageId": "123",
    "status": "completed",
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

---

*This API reference is maintained by the Content Engine development team. Last updated: January 2024*
