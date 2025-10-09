# Content Engine App - Complete Documentation

## Overview
The Content Engine is a Next.js 15 application designed for creating and managing social media content ideas. It features multi-client support, Baserow database integration, n8n workflow automation, and comprehensive file upload capabilities.

## Tech Stack
- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: Baserow (headless database)
- **Automation**: n8n workflow integration
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **File Handling**: Native File API with MediaRecorder for voice notes

## Project Structure
```
content-engine/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── baserow/           # Baserow integration
│   │   │   ├── upload/            # File upload endpoints
│   │   │   └── webhooks/          # n8n webhook handlers
│   │   ├── dashboard/             # Client dashboards
│   │   │   └── [clientId]/        # Dynamic client routes
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   ├── components/
│   │   ├── dashboard/             # Dashboard components
│   │   ├── forms/                 # Form components
│   │   ├── layout/                # Layout components
│   │   ├── tables/                # Table components
│   │   ├── ui/                    # shadcn/ui components
│   │   └── ClientOnly.tsx         # SSR wrapper
│   └── lib/
│       ├── baserow/               # Baserow API wrapper
│       ├── config/                # Client configurations
│       ├── types/                 # TypeScript definitions
│       └── utils.ts               # Utility functions
├── public/
├── .env.local                     # Environment variables
├── package.json                   # Dependencies
├── next.config.ts                 # Next.js configuration
└── tsconfig.json                  # TypeScript configuration
```

## Environment Variables (.env.local)
```bash
# Baserow Configuration
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_MODERN_MANAGEMENT_TOKEN=2D0QTPo1l1bVWN5MwVkgKUbFZLgVW0Mz
BASEROW_MODERN_MANAGEMENT_DATABASE_ID=176

# Table IDs
BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE=721
BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE=712
BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE=728
BASEROW_MODERN_MANAGEMENT_CONTENT_ASSETS_TABLE=
BASEROW_MODERN_MANAGEMENT_PUBLISHING_SCHEDULE_TABLE=
BASEROW_MODERN_MANAGEMENT_ANALYTICS_TABLE=

# n8n Webhook Configuration
# n8n Webhook URLs
N8N_CONTENT_IDEA_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/social-media-processor
N8N_EMAIL_IDEA_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/email-processor
N8N_WEBHOOK_SECRET=your-secret-key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# File Upload Configuration
MAX_FILE_SIZE=50
ALLOWED_FILE_TYPES=image/*,video/*,audio/*

# Client Configuration
MODERN_MANAGEMENT_NAME=Modern Management
MODERN_MANAGEMENT_PRIMARY_COLOR=#3B82F6
MODERN_MANAGEMENT_SECONDARY_COLOR=#10B981
```

## Key Dependencies
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@radix-ui/react-*": "Various UI components",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.525.0",
    "next": "15.4.3",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.61.0",
    "tailwind-merge": "^3.3.1",
    "zod": "^4.0.8"
  }
}
```

## Core Features

### 1. Multi-Client Support
- Dynamic client routing via `[clientId]` parameter
- Client-specific configurations in `src/lib/config/clients.ts`
- Branded UI with client-specific colors and settings
- Currently supports "modern-management" and "client1" (legacy compatibility)

### 2. Social Media Content Creation
- **Platforms**: Facebook, Instagram, X, LinkedIn, Pinterest, Snapchat, Reddit
- **Post Types**: Image, Carousel, Story, Reel, Text Post, Poll, Live, Event
- **Information Sources**: 
  - Voice Note (with recording capability)
  - URL reference
  - Image upload
  - Text idea
  - Video upload

### 3. File Upload System
- **Voice Notes**: MediaRecorder API for browser recording + file upload
- **Images**: Direct upload to Baserow file storage
- **Videos**: Direct upload to Baserow file storage
- **File Size Limit**: 50MB (configurable)
- **Supported Types**: image/*, video/*, audio/*

### 4. Baserow Integration
- Custom API wrapper in `src/lib/baserow/api.ts`
- Field mapping system for form data to Baserow fields
- Direct file uploads to Baserow storage
- CRUD operations for content ideas

#### Baserow Field Mapping (Table ID: 721)
```typescript
const fieldMapping = {
  "field_7036": "title",              // Content idea title
  "field_7037": "idea_type",          // Content type (Social Media Post, etc.)
  "field_7038": "description",        // Description
  "field_7039": "source_type",        // Information source
  "field_7040": "source_url",         // Reference URL
  "field_7041": "target_audience",    // Target audience
  "field_7042": "priority",           // Priority (High/Medium/Low)
  "field_7043": "status",             // Status (Idea, In Progress, etc.)
  "field_7044": "due_date",           // Due date
  "field_7045": "client_notes",       // Additional notes
  "field_7046": "voice_file_url",     // Voice file attachment
  "field_7047": "created_date",       // Creation timestamp
  "field_7048": "platforms",          // Social media platforms (multi-select)
  "field_7049": "post_type",          // Post type
  "field_7050": "number_of_posts",    // Number of posts
  "field_7051": "hook_focus",         // Hook/Focus
  "field_7052": "cta",                // Call to action
  "field_7053": "uploaded_image_url", // Image file attachment
  "field_7054": "uploaded_video_url", // Video file attachment
  "field_7055": "source_content"      // Source content text
}
```

### 5. n8n Workflow Integration
- Webhook trigger on content idea creation
- Comprehensive payload structure with Baserow metadata
- Fallback handling (POST/GET methods)
- Non-blocking webhook calls (app continues if webhook fails)

#### n8n Webhook Payload Structure
```typescript
{
  // Required fields for n8n workflow
  client_id: string,
  base_id: string,
  record_id: string,
  table_id: string,
  idea_type: string,
  title: string,
  priority: string,
  
  // Baserow information
  baserow: {
    databaseId: string,
    tableId: string,
    recordId: string,
    baseUrl: string
  },
  
  // Social Media specific data
  socialMedia: {
    platforms: string[],
    postType: string,
    informationSource: string,
    numberOfPosts: number,
    hookFocus: string,
    cta: string,
    uploadedImage: FileObject[] | null,
    uploadedVideo: FileObject[] | null,
    voiceFile: FileObject[] | null
  },
  
  // Content details
  contentIdea: {
    title: string,
    ideaType: string,
    description: string,
    sourceType: string,
    sourceUrl?: string,
    sourceContent?: string,
    targetAudience: string,
    priority: string,
    dueDate?: string,
    clientNotes?: string,
    voiceFileUrl?: string,
    status: string
  }
}
```

## API Endpoints

### Content Ideas
- `GET /api/baserow/[clientId]/content-ideas` - Fetch content ideas
- `POST /api/baserow/[clientId]/content-ideas` - Create content idea
- `GET /api/baserow/[clientId]/content-ideas?debug=structure` - Debug table structure

### File Uploads
- `POST /api/upload/voice-note` - Upload voice recordings
- `POST /api/upload/image` - Upload images
- `POST /api/upload/video` - Upload videos

### Webhooks
- `POST /api/webhooks/n8n/content-idea-created` - n8n workflow trigger

### Debug/Testing
- `GET /api/debug-fields` - Debug Baserow field structure
- `GET /api/test-baserow` - Test Baserow connection
- `GET /api/verify-token` - Verify Baserow token

## UI Components

### shadcn/ui Components
Complete implementation of shadcn/ui component library:
- Badge, Button, Card, Form, Input, Label, RadioGroup, Select, Tabs, Textarea

### Custom Components
- **ContentIdeaForm**: Main form for creating content ideas
- **ClientHeader**: Branded header with client-specific styling
- **StatsCards**: Dashboard statistics display
- **ContentIdeasTable**: Data table for content ideas
- **ClientOnly**: SSR hydration wrapper

## Form Validation
Using Zod schema validation with React Hook Form:

```typescript
const contentIdeaSchema = z.object({
  contentIdea: z.string().min(1, 'Content idea is required'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  postType: z.string().min(1, 'Post type is required'),
  informationSource: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceContent: z.string().optional(),
  numberOfPosts: z.number().min(1).max(10).optional(),
  targetAudience: z.string().optional(),
  hookFocus: z.string().optional(),
  cta: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  dueDate: z.string().optional(),
  additionalNotes: z.string().optional()
})
```

## Client Configuration System
Multi-client support with environment-based configuration:

```typescript
interface ClientConfig {
  id: string
  name: string
  baserow: {
    token: string
    databaseId: string
    tables: {
      contentIdeas: string
      socialMediaContent: string
      brandAssets: string
      contentAssets: string
      publishingSchedule: string
      performanceAnalytics: string
    }
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
  }
  settings: {
    maxFileSize: number
    allowedFileTypes: string[]
    autoApproval: boolean
  }
  users: {
    email: string
    role: 'creator' | 'client' | 'admin'
  }[]
}
```

## Development Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Current Implementation Status

### ✅ Completed Features
- Multi-client dashboard structure
- Social media content idea creation form
- Baserow database integration with field mapping
- File upload system (voice, image, video)
- n8n webhook integration
- Complete shadcn/ui component library
- Form validation with Zod
- Client branding system
- Voice recording functionality
- URL auto-transformation
- Error handling and logging

### 🚧 Partially Implemented
- Content types (only Social Media Post fully implemented)
- File upload endpoints (structure exists, may need refinement)
- Dashboard statistics (basic implementation)

### ❌ Not Yet Implemented
- User authentication system
- Content asset management
- Publishing schedule functionality
- Performance analytics
- Blog post content type
- Video content type
- Email campaign content type
- Product UVP content type
- Content focus plan type

## Database Schema (Baserow)

### Content Ideas Table (ID: 721)
- **Title** (field_7036): Single line text
- **Idea Type** (field_7037): Single select
- **Description** (field_7038): Long text
- **Source Type** (field_7039): Single select
- **Source URL** (field_7040): URL
- **Target Audience** (field_7041): Single select
- **Priority** (field_7042): Single select (High/Medium/Low)
- **Status** (field_7043): Single select
- **Due Date** (field_7044): Date
- **Client Notes** (field_7045): Long text
- **Voice File** (field_7046): File attachment
- **Created Date** (field_7047): Date
- **Platforms** (field_7048): Multiple select
- **Post Type** (field_7049): Single select
- **Number of Posts** (field_7050): Number
- **Hook/Focus** (field_7051): Long text
- **CTA** (field_7052): Long text
- **Uploaded Image** (field_7053): File attachment
- **Uploaded Video** (field_7054): File attachment
- **Source Content** (field_7055): Long text

### Social Media Content Table (ID: 712)
- **Post ID** (field_6920): Single line text
- **Hook** (field_7144): Long text
- **Post** (field_7145): Long text
- **CTA** (field_7147): Long text
- **Hashtags** (field_7148): Long text
- **Platform** (field_6923): Single select
- **Content Type** (field_6921): Single select
- **Character Count** (field_7149): Number
- **Image Prompt** (field_6922): Long text
- **Image** (field_6929): File attachment
- **Angle** (field_6925): Long text
- **Intent** (field_6926): Long text
- **Content Theme** (field_7166): Single select
- **Psychological Trigger** (field_7167): Single select
- **Engagement Objective** (field_7168): Single select
- **Comments** (field_7146): Long text
- **Engagement Prediction** (field_7150): Long text
- **Status** (field_6950): Single select
- **Approved by** (field_6927): Single line text
- **Content Idea** (field_7152): Link to Content Ideas table
- **Scheduled Time** (field_6928): Date
- **Created_at** (field_6930): Date
- **Updated_at** (field_7151): Date

### Brand Assets Table (ID: 728)
- **Asset Name** (field_7154): Single line text
- **Platform** (field_7155): Single select
- **Content Type** (field_7156): Single select
- **Asset Type** (field_7157): Single select
- **Content** (field_7158): Long text
- **File** (field_7159): File attachment
- **File URL** (field_7160): URL
- **Status** (field_7161): Single select
- **Priority** (field_7162): Single select
- **Created Date** (field_7163): Date
- **Last Updated** (field_7164): Date
- **Notes** (field_7165): Long text

## Error Handling
- Comprehensive try-catch blocks in API routes
- Graceful degradation for webhook failures
- Client-side error boundaries
- Detailed logging for debugging
- User-friendly error messages

## Security Considerations
- Environment variable protection
- API token validation
- File type restrictions
- File size limits
- Input sanitization
- CORS handling

## Performance Optimizations
- Client-side rendering with SSR fallbacks
- Lazy loading of components
- Optimized file uploads
- Efficient API calls
- Minimal bundle size with tree shaking

## Future Enhancements
1. **Authentication System**: Implement NextAuth.js
2. **Content Templates**: Pre-built content templates
3. **Collaboration Features**: Multi-user editing
4. **Analytics Dashboard**: Performance metrics
5. **Content Calendar**: Publishing schedule management
6. **AI Integration**: Content generation assistance
7. **Mobile App**: React Native companion
8. **Advanced File Processing**: Image/video editing
9. **Bulk Operations**: Mass content creation
10. **Export/Import**: Content backup and migration

This documentation provides a complete overview of the Content Engine application, including all implemented features, configurations, and technical details needed for development and deployment.