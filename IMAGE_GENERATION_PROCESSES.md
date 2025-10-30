# Image Generation Processes Documentation

This document clearly explains the two distinct image generation processes in the Content Engine application to prevent confusion between them.

---

## Table of Contents

1. [Overview](#overview)
2. [Process 1: Image Generation from Social Media Posts](#process-1-image-generation-from-social-media-posts)
3. [Process 2: Image Generation from Image Ideas](#process-2-image-generation-from-image-ideas)
4. [Key Differences Summary](#key-differences-summary)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Webhook Payload Differences](#webhook-payload-differences)

---

## Overview

There are **two separate image generation processes** in the application:

### Process 1: Social Media Post Image Generation
- **Purpose**: Generate images specifically for social media posts
- **Trigger**: User clicks "Generate Image" button while editing/creating a social media post
- **Context**: Associated with a specific social media post and content idea
- **UI Location**: `SocialMediaContentForm` → Image Generation Modal

### Process 2: Image Ideas Image Generation
- **Purpose**: Generate standalone image ideas (not tied to posts)
- **Trigger**: User creates a new image idea from the Image Ideas dashboard
- **Context**: Standalone image idea, not tied to any post
- **UI Location**: `Image Ideas Page` → `ImageIdeaForm`

---

## Process 1: Image Generation from Social Media Posts

### User Flow

1. **User opens a Social Media Post**
   - Navigates to Social Media Content page
   - Clicks "Create Post" or edits an existing post
   - Opens `SocialMediaContentForm` modal

2. **User clicks "Generate Image" button**
   - Button located in the "Media" section of the post form
   - Opens `ImageGenerationForm` modal overlay

3. **User configures image generation**
   - **Image Creation Method** section is visible:
     - Generate New Image
     - Combine Images
     - Edit Existing Image
   - **Image Settings** section is **HIDDEN** (duplicate functionality)
   - User can enter:
     - Image Prompt
     - Image Scene/Instructions (optional)
     - Voice Note (optional)
     - Caption settings (optional)
   - For combine/edit operations:
     - Browse existing images
     - Upload new images

4. **User submits the form**
   - Form data is sent to API

5. **API processes the request**
   - Creates image record(s) in Baserow
   - Triggers webhook with social media context

6. **Workflow processes the image**
   - n8n workflow receives webhook
   - Generates/processes the image
   - Updates Baserow record with final image
   - Links image back to social media post

### Technical Flow

```
┌─────────────────────────────────────────────────────────┐
│  SocialMediaContentForm                                  │
│  - User clicks "Generate Image"                         │
│  - Opens ImageGenerationForm                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  ImageGenerationForm                                    │
│  - User fills form                                     │
│  - Submits with source: 'social_media_post'           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/baserow/[clientId]/image-ideas         │
│  - Receives request with source: 'social_media_post'   │
│  - Includes social media context fields:                │
│    • socialMediaContent (post ID)                      │
│    • isNewPost (boolean)                                │
│    • contentIdea (idea ID)                              │
│    • postContent, hookContent, combinedContent         │
│    • platform, contentType                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Baserow API                                            │
│  - Creates image record(s) in Images table              │
│  - For combine/edit: Creates separate records for      │
│    each uploaded image + target record                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Webhook Payload                                        │
│  - source: 'social_media_post'                          │
│  - Includes social media context in image object       │
│  - metadata.contentType: 'social-media-image'          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  n8n Workflow                                           │
│  - Processes image generation                           │
│  - Updates Baserow record                               │
│  - Links image to social media post                     │
└─────────────────────────────────────────────────────────┘
```

### API Endpoint

**POST** `/api/baserow/[clientId]/image-ideas`

### Key Characteristics

- ✅ **Source Identifier**: `source: 'social_media_post'`
- ✅ **Social Media Context**: Includes post content, hook, platform, etc.
- ✅ **Post Linking**: Image is linked to the social media post via `socialMediaContent` field
- ✅ **Content Idea Linking**: Image can be linked to the content idea via `contentIdea` field
- ✅ **UI**: Image Settings section is hidden (duplicate with Image Creation Method)
- ✅ **Target Record**: When combining/editing, creates target record for workflow

### Form Fields Available

**Always Visible:**
- Image Creation Method (Generate/Combine/Edit)
- Image Prompt
- Image Scene/Instructions
- Voice Note
- Image Captions

**Hidden:**
- Image Settings (Image Type, Style, Model, Size) - These are pre-set to:
  - Image Type: "Social Media Post"
  - Image Style: "Modern"
  - Image Model: "DALL-E 3"
  - Image Size: "1024x1024"

---

## Process 2: Image Generation from Image Ideas

### User Flow

1. **User navigates to Image Ideas page**
   - Goes to `/dashboard/[clientId]/image-ideas`
   - Views list of existing image ideas

2. **User clicks "Create New Image Idea"**
   - Opens `ImageIdeaForm` modal

3. **User configures image generation**
   - **Image Creation Method** section is visible:
     - Generate New Image
     - Combine Images
     - Edit Existing Image
   - **Image Settings** section is **VISIBLE**:
     - Image Type (dropdown)
     - Image Style (dropdown)
     - Image Model (dropdown)
     - Image Size (dropdown)
   - User can enter:
     - Image Prompt
     - Image Scene/Instructions (optional)
     - Voice Note (optional)
     - Caption settings (optional)
   - For combine/edit operations:
     - Browse existing images
     - Upload new images

4. **User submits the form**
   - Form data is sent to API with `source: 'image_ideas'`

5. **API processes the request**
   - Creates image record(s) in Baserow
   - Triggers webhook without social media context

6. **Workflow processes the image**
   - n8n workflow receives webhook
   - Generates/processes the image
   - Updates Baserow record with final image
   - Image remains standalone (not linked to any post)

### Technical Flow

```
┌─────────────────────────────────────────────────────────┐
│  Image Ideas Page                                       │
│  - User clicks "Create New Image Idea"                 │
│  - Opens ImageIdeaForm                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  ImageIdeaForm                                          │
│  - User fills form                                     │
│  - Submits with source: 'image_ideas'                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/baserow/[clientId]/image-ideas         │
│  - Receives request with source: 'image_ideas'         │
│  - NO social media context fields                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Baserow API                                            │
│  - Creates image record(s) in Images table              │
│  - For combine/edit: Creates separate records for      │
│    each uploaded image + target record                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Webhook Payload                                        │
│  - source: 'image_ideas' (in metadata)                 │
│  - NO social media context fields                      │
│  - metadata.contentType: 'image-idea'                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  n8n Workflow                                           │
│  - Processes image generation                           │
│  - Updates Baserow record                               │
│  - Image remains standalone                             │
└─────────────────────────────────────────────────────────┘
```

### API Endpoint

**POST** `/api/baserow/[clientId]/image-ideas`

*(Same endpoint as Process 1, but different payload structure)*

### Key Characteristics

- ✅ **Source Identifier**: `source: 'image_ideas'`
- ✅ **No Social Media Context**: Does NOT include post content, hook, platform, etc.
- ✅ **Standalone**: Image is NOT linked to any social media post
- ✅ **UI**: Image Settings section is visible (user can configure all settings)
- ✅ **Target Record**: When combining/editing, creates target record for workflow

### Form Fields Available

**Always Visible:**
- Image Creation Method (Generate/Combine/Edit)
- Image Prompt
- Image Scene/Instructions
- Voice Note
- Image Settings (Image Type, Style, Model, Size) - **User configurable**
- Image Captions

---

## Key Differences Summary

| Aspect | Social Media Post Image Generation | Image Ideas Image Generation |
|--------|-----------------------------------|------------------------------|
| **Source Identifier** | `source: 'social_media_post'` | `source: 'image_ideas'` |
| **UI Entry Point** | SocialMediaContentForm | Image Ideas Page |
| **Form Component** | ImageGenerationForm (embedded) | ImageIdeaForm |
| **Image Settings Visible** | ❌ Hidden | ✅ Visible |
| **Social Media Context** | ✅ Included (post content, hook, platform, etc.) | ❌ Not included |
| **Post Linking** | ✅ Linked to social media post | ❌ Standalone |
| **Content Idea Linking** | ✅ Can be linked to content idea | ❌ Not linked |
| **Metadata Content Type** | `'social-media-image'` | `'image-idea'` |
| **Pre-set Values** | Image Type: "Social Media Post"<br>Style: "Modern"<br>Model: "DALL-E 3"<br>Size: "1024x1024" | User configurable |

---

## Technical Implementation Details

### Source Identification

The application uses the `source` field to distinguish between the two processes:

```typescript
// Process 1: Social Media Post
{
  source: 'social_media_post',
  // ... social media context fields
}

// Process 2: Image Ideas
{
  source: 'image_ideas',
  // ... no social media context fields
}
```

### API Route Logic

The API route `/api/baserow/[clientId]/image-ideas` handles both processes:

```typescript
// Conditional logic based on source
if (data.source === 'social_media_post') {
  // Add social media context fields to webhook payload
  Object.assign(finalPayload.image, {
    socialMediaContent: data.socialMediaContent || null,
    isNewPost: data.isNewPost,
    contentIdea: data.contentIdea || null,
    postContent: data.postContent || '',
    hookContent: data.hookContent || '',
    combinedContent: data.combinedContent || '',
    platform: data.platform || '',
    contentType: data.contentType || ''
  })
  
  finalPayload.metadata.contentType = 'social-media-image'
} else {
  // Image Ideas - no social media context
  finalPayload.metadata.contentType = 'image-idea'
}
```

### Target Record Creation

Both processes create a **target record** when combining/editing images:

1. **Uploaded Images**: Each uploaded image gets its own Baserow record
2. **Target Record**: A separate record is created for the final generated image
   - This is where the workflow stores the final result
   - Contains metadata but no image initially (status: "Generating")
   - Workflow updates this record with the final image

### Record IDs in Webhook Payload

```typescript
{
  tables: {
    images: {
      recordId: targetRecord.id,              // Main record ID
      allRecordIds: [...],                    // All created records
      targetRecordId: targetRecord.id,        // Target for final result
      uploadedImageRecordIds: [...]           // Input image records
    }
  }
}
```

---

## Webhook Payload Differences

### Process 1: Social Media Post Image Generation

```json
{
  "client_id": "client_id",
  "base_id": "database_id",
  "table_id": "images_table_id",
  "event": "image_generation",
  "source": "social_media_post",
  "metadata": {
    "source": "social_media_post",
    "contentType": "social-media-image"
  },
  "image": {
    "imagePrompt": "...",
    "imageScene": "...",
    "imageType": "...",
    "imageStyle": "...",
    "imageModel": "...",
    "imageSize": "...",
    "operationType": "generate",
    "selectedImages": [],
    "uploadedImages": [],
    "uploadedImageReferences": [],
    "targetRecordId": "123",
    "uploadedImageRecordIds": [],
    "hasUploadedImages": false,
    // SOCIAL MEDIA CONTEXT FIELDS (only for social media posts)
    "socialMediaContent": "post_id",
    "isNewPost": false,
    "contentIdea": "idea_id",
    "postContent": "Full post content...",
    "hookContent": "Hook content...",
    "combinedContent": "Combined content...",
    "platform": "Facebook",
    "contentType": "Image"
  },
  "baserow": {
    "targetRecordId": "123",
    "uploadedImageRecordIds": [],
    "allRecordIds": ["123"]
  }
}
```

### Process 2: Image Ideas Image Generation

```json
{
  "client_id": "client_id",
  "base_id": "database_id",
  "table_id": "images_table_id",
  "event": "image_generation",
  "source": "image_ideas",
  "metadata": {
    "source": "image_ideas",
    "contentType": "image-idea"
  },
  "image": {
    "imagePrompt": "...",
    "imageScene": "...",
    "imageType": "...",
    "imageStyle": "...",
    "imageModel": "...",
    "imageSize": "...",
    "operationType": "generate",
    "selectedImages": [],
    "uploadedImages": [],
    "uploadedImageReferences": [],
    "targetRecordId": "123",
    "uploadedImageRecordIds": [],
    "hasUploadedImages": false,
    "useCaptions": false,
    "captionText": "",
    "captionFontStyle": "",
    "captionFontSize": "",
    "captionPosition": ""
    // NO SOCIAL MEDIA CONTEXT FIELDS
  },
  "baserow": {
    "targetRecordId": "123",
    "uploadedImageRecordIds": [],
    "allRecordIds": ["123"]
  }
}
```

---

## Important Notes

### ⚠️ Common Confusion Points

1. **Same API Endpoint**: Both processes use the same endpoint (`/api/baserow/[clientId]/image-ideas`), but the payload structure differs based on the `source` field.

2. **Same Form Component**: Both processes use `ImageGenerationForm`, but:
   - From Social Media Posts: Image Settings are hidden
   - From Image Ideas: Image Settings are visible

3. **Webhook Payload Location**: The `source` field location differs:
   - **Social Media Posts**: `source` is at root level AND in metadata
   - **Image Ideas**: `source` is primarily in metadata
   - **n8n Access**: Both can be accessed via `{{ $json.body.source }}` or `{{ $json.body.metadata.source }}`

4. **Target Record Creation**: Both processes create target records for combine/edit operations, ensuring the workflow has a place to store the final result.

### ✅ Best Practices

1. **Always check `source` field** before processing webhook payloads in n8n
2. **Use conditional logic** in workflows to handle social media context appropriately
3. **Don't assume** all webhook payloads have social media context fields
4. **Use `targetRecordId`** for storing final generated images
5. **Use `uploadedImageRecordIds`** for accessing input images in combine/edit operations

---

## Troubleshooting

### Issue: Webhook payload missing social media context

**Check:**
- Is `source: 'social_media_post'` being sent?
- Are social media context fields being included in the payload?

**Solution:**
- Verify `SocialMediaContentForm.handleGenerateImage` includes `source: 'social_media_post'`
- Check API route logic adds social media fields when `source === 'social_media_post'`

### Issue: Image Settings showing in social media post generation

**Check:**
- Is `initialData.imageType === 'Social Media Post'`?

**Solution:**
- Verify `ImageGenerationForm` conditional rendering: `{watchedValues.imageType !== 'Social Media Post' && (...)}`

### Issue: Images not linking to posts

**Check:**
- Is `socialMediaContent` field included in the payload?
- Is the post ID being passed correctly?

**Solution:**
- Verify `SocialMediaContentForm` passes `socialMediaContent: initialData?.id || null`
- Check API route includes this field in webhook payload

---

## Version History

- **2025-01-XX**: Initial documentation created
- Documents the two distinct image generation processes
- Clarifies differences and implementation details

---

## Contact

For questions or clarifications about these processes, refer to:
- Code: `src/components/forms/SocialMediaContentForm.tsx`
- Code: `src/components/forms/ImageIdeaForm.tsx`
- Code: `src/components/forms/ImageGenerationForm.tsx`
- Code: `src/app/api/baserow/[clientId]/image-ideas/route.ts`

