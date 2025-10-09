# Design Document

## Overview

This design document outlines the implementation of multi-table Baserow integration for the Content Engine, extending the current single-table (Content Ideas) system to include Social Media Content (712) and Brand Assets (728) tables. The design focuses on maintaining the existing architecture while adding new capabilities for content management and brand asset organization.

## Architecture

### Current Architecture
```
Content Idea Form → Baserow API → Content Ideas Table (721)
                 ↓
                n8n Webhook → n8n Workflow
```

### Enhanced Architecture
```
Content Idea Form → Baserow API → Content Ideas Table (721)
                 ↓
                n8n Webhook → n8n Workflow → Social Media Content Table (712)
                                         ↓
                                    Brand Assets Table (728)
                                         ↑
Brand Asset Management UI → Baserow API ↗
```

## Components and Interfaces

### 1. Environment Configuration Updates

**File:** `.env.local`
```bash
# Existing
BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE=721

# New additions
BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE=712
BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE=728
```

**File:** `src/lib/config/clients.ts`
```typescript
interface ClientConfig {
  // ... existing fields
  baserow: {
    token: string
    databaseId: string
    tables: {
      contentIdeas: string
      socialMediaContent: string    // New
      brandAssets: string          // New
      contentAssets: string        // Existing (unused)
      publishingSchedule: string   // Existing (unused)
      performanceAnalytics: string // Existing (unused)
    }
  }
}
```

### 2. Enhanced Baserow API Wrapper

**File:** `src/lib/baserow/api.ts`

New methods to add:
```typescript
class BaserowAPI {
  // Social Media Content methods
  async createSocialMediaContent(tableId: string, data: any)
  async getSocialMediaContent(tableId: string, filters?: any)
  async updateSocialMediaContent(tableId: string, rowId: string, data: any)
  
  // Brand Assets methods
  async createBrandAsset(tableId: string, data: any)
  async getBrandAssets(tableId: string, filters?: any)
  async updateBrandAsset(tableId: string, rowId: string, data: any)
  async deleteBrandAsset(tableId: string, rowId: string)
  
  // Relationship queries
  async getSocialMediaContentByContentIdea(contentIdeaId: string)
  async getBrandAssetsByPlatform(platform: string)
}
```

### 3. Type Definitions

**File:** `src/lib/types/content.ts`

New interfaces:
```typescript
// Social Media Content Types
export interface SocialMediaContent {
  id: string
  postId: string           // field_6920
  hook: string            // field_7144
  post: string            // field_7145
  cta: string             // field_7147
  hashtags: string        // field_7148
  platform: string        // field_6923
  contentType: string     // field_6921
  characterCount: number  // field_7149
  imagePrompt: string     // field_6922
  image: string           // field_6929
  angle: string           // field_6925
  intent: string          // field_6926
  contentTheme: string    // field_7166
  psychologicalTrigger: string // field_7167
  engagementObjective: string  // field_7168
  comments: string        // field_7146
  engagementPrediction: string // field_7150
  status: string          // field_6950
  approvedBy: string      // field_6927
  contentIdea: string     // field_7152 (relationship)
  scheduledTime: string   // field_6928
  createdAt: string       // field_6930
  updatedAt: string       // field_7151
}

// Brand Assets Types
export interface BrandAsset {
  id: string
  assetName: string       // field_7154
  platform: string        // field_7155
  contentType: string     // field_7156
  assetType: string       // field_7157
  content: string         // field_7158
  file: string            // field_7159
  fileUrl: string         // field_7160
  status: string          // field_7161
  priority: string        // field_7162
  createdDate: string     // field_7163
  lastUpdated: string     // field_7164
  notes: string           // field_7165
}

// Form Data Types
export interface SocialMediaContentFormData {
  hook: string
  post: string
  cta: string
  hashtags: string
  platform: string
  contentType: string
  imagePrompt?: string
  angle: string
  intent: string
  contentTheme: string
  psychologicalTrigger: string
  engagementObjective: string
  status: string
  scheduledTime?: string
}

export interface BrandAssetFormData {
  assetName: string
  platform: string
  contentType: string
  assetType: string
  content?: string
  file?: File
  fileUrl?: string
  status: string
  priority: string
  notes?: string
}
```

### 4. API Routes

**New Files:**

`src/app/api/baserow/[clientId]/social-media-content/route.ts`
- GET: Fetch social media content with optional filtering
- POST: Create new social media content (for manual creation)
- PATCH: Update existing social media content

`src/app/api/baserow/[clientId]/brand-assets/route.ts`
- GET: Fetch brand assets with filtering by platform/type
- POST: Create new brand asset
- PATCH: Update existing brand asset
- DELETE: Remove brand asset

`src/app/api/baserow/[clientId]/content-ideas/[ideaId]/social-media-content/route.ts`
- GET: Fetch social media content linked to specific content idea

### 5. Enhanced n8n Webhook Payload

**File:** `src/app/api/webhooks/n8n/content-idea-created/route.ts`

Enhanced payload structure:
```typescript
const n8nPayload = {
  // Existing fields...
  
  // Enhanced table information for n8n
  tables: {
    contentIdeas: {
      id: clientConfig.baserow.tables.contentIdeas,
      recordId: payload.ideaId
    },
    socialMediaContent: {
      id: clientConfig.baserow.tables.socialMediaContent
    },
    brandAssets: {
      id: clientConfig.baserow.tables.brandAssets
    }
  },
  
  // Client information
  client: {
    name: clientConfig.name,
    id: payload.clientId
  },
  
  // Database connection info for n8n
  baserow: {
    baseUrl: process.env.BASEROW_API_URL,
    databaseId: clientConfig.baserow.databaseId,
    token: clientConfig.baserow.token // Note: Consider security implications
  }
}
```

### 6. UI Components

**New Components:**

`src/components/tables/SocialMediaContentTable.tsx`
- Display social media content in tabular format
- Show relationship to original content idea
- Allow status updates and editing
- Support filtering by platform, status, content type

`src/components/forms/SocialMediaContentForm.tsx`
- Form for manual social media content creation/editing
- All fields from the Social Media Content table
- Validation using Zod schema

`src/components/tables/BrandAssetsTable.tsx`
- Display brand assets with filtering capabilities
- Support for file preview/download
- Status and priority management

`src/components/forms/BrandAssetForm.tsx`
- Form for creating/editing brand assets
- File upload support
- Platform and content type categorization

**Enhanced Components:**

`src/components/tables/ContentIdeasTable.tsx`
- Add column showing count of generated social media posts
- Add action to view related social media content
- Link to brand assets used

### 7. Page Structure

**New Pages:**

`src/app/dashboard/[clientId]/social-media-content/page.tsx`
- Main page for viewing all social media content
- Filtering and search capabilities
- Bulk operations (status updates, scheduling)

`src/app/dashboard/[clientId]/brand-assets/page.tsx`
- Brand asset management interface
- Upload and organize brand assets
- Platform-specific asset organization

**Enhanced Pages:**

`src/app/dashboard/[clientId]/content-ideas/page.tsx`
- Add section showing related social media content
- Quick actions for regenerating content
- Link to brand assets

## Data Models

### Field Mapping

**Social Media Content Table (712):**
```typescript
const socialMediaContentFieldMapping = {
  "field_6920": "postId",
  "field_7144": "hook",
  "field_7145": "post",
  "field_7147": "cta",
  "field_7148": "hashtags",
  "field_6923": "platform",
  "field_6921": "contentType",
  "field_7149": "characterCount",
  "field_6922": "imagePrompt",
  "field_6929": "image",
  "field_6925": "angle",
  "field_6926": "intent",
  "field_7166": "contentTheme",
  "field_7167": "psychologicalTrigger",
  "field_7168": "engagementObjective",
  "field_7146": "comments",
  "field_7150": "engagementPrediction",
  "field_6950": "status",
  "field_6927": "approvedBy",
  "field_7152": "contentIdea", // Links to Content Ideas table
  "field_6928": "scheduledTime",
  "field_6930": "createdAt",
  "field_7151": "updatedAt"
}
```

**Brand Assets Table (728):**
```typescript
const brandAssetsFieldMapping = {
  "field_7154": "assetName",
  "field_7155": "platform",
  "field_7156": "contentType",
  "field_7157": "assetType",
  "field_7158": "content",
  "field_7159": "file",
  "field_7160": "fileUrl",
  "field_7161": "status",
  "field_7162": "priority",
  "field_7163": "createdDate",
  "field_7164": "lastUpdated",
  "field_7165": "notes"
}
```

### Relationships

1. **Content Ideas → Social Media Content**: One-to-Many
   - Content Idea can generate multiple social media posts
   - Social Media Content links back via `field_7152`

2. **Brand Assets → Content Ideas**: Many-to-Many (implicit)
   - Brand assets inform content generation
   - Tracked through platform and content type matching

3. **Brand Assets → Social Media Content**: Many-to-Many (implicit)
   - Generated content references relevant brand assets
   - Tracked through platform and content type matching

## Error Handling

### API Error Handling
- Validate table IDs exist in client configuration
- Handle Baserow API failures gracefully
- Provide meaningful error messages for field validation
- Log errors for debugging while protecting sensitive data

### UI Error Handling
- Display user-friendly error messages
- Handle loading states for all table operations
- Provide retry mechanisms for failed operations
- Validate form data before submission

## Testing Strategy

### Unit Tests
- Test new Baserow API methods
- Test field mapping functions
- Test form validation schemas
- Test utility functions for data transformation

### Integration Tests
- Test API routes for new tables
- Test webhook payload generation
- Test client configuration loading
- Test file upload functionality for brand assets

### End-to-End Tests
- Test complete content creation workflow
- Test social media content display and editing
- Test brand asset management workflow
- Test relationship between tables

## Security Considerations

### Data Protection
- Validate all input data before database operations
- Sanitize file uploads for brand assets
- Protect sensitive client information in webhook payloads
- Implement proper access controls for table operations

### API Security
- Validate client IDs in all routes
- Ensure proper authentication for table access
- Rate limiting for API endpoints
- Secure file upload handling

## Performance Optimizations

### Database Operations
- Implement efficient querying with proper filtering
- Use pagination for large result sets
- Cache frequently accessed brand assets
- Optimize relationship queries

### UI Performance
- Lazy load table data
- Implement virtual scrolling for large datasets
- Optimize image loading for brand assets
- Use proper React key props for list rendering

## Migration Strategy

### Phase 1: Infrastructure Setup
1. Update environment variables
2. Extend client configuration
3. Add new API routes
4. Update webhook payload

### Phase 2: Social Media Content Integration
1. Implement social media content API
2. Create UI components
3. Add to content ideas dashboard
4. Test n8n integration

### Phase 3: Brand Assets Management
1. Implement brand assets API
2. Create brand assets management page
3. Add file upload functionality
4. Implement asset-content relationships

### Phase 4: Enhancement and Optimization
1. Add advanced filtering and search
2. Implement bulk operations
3. Add analytics and reporting
4. Performance optimizations