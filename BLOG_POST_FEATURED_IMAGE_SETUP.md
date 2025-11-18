# Blog Post Featured Image Setup Guide

## 📋 Overview

To enable featured images for blog posts that can be published to WordPress, you need to add a **Link Row** field to the Blog Posts table that links to the Images table.

## ✅ Step-by-Step Setup

### Step 1: Add Featured Image Field to Blog Posts Table

1. **Open Baserow** and navigate to your client's database
2. **Open the Blog Posts table**
3. **Click "Add Field"** (or the "+" button)
4. **Configure the field:**
   - **Field Name**: `Featured Image`
   - **Field Type**: `Link to table`
   - **Link to table**: Select `Images` table
   - **Has related field**: ✅ Check this (optional, but recommended)
   - **Related field name**: `Blog Posts` (this creates a reverse link)
5. **Click "Create"**

### Step 2: Update Field Mappings

After creating the field, you need to add it to your client's field mappings. The field ID will be something like `field_XXXXX`.

**Option A: Update via API/Code**
Add the field mapping to your client configuration:

```json
{
  "blogPosts": {
    "featured_image": "field_XXXXX"  // Replace with actual field ID
  }
}
```

**Option B: Manual Update**
The field will be automatically available when fetching blog posts, but you may want to add it to the field mappings for consistency.

### Step 3: How It Works

Once the field is added:

1. **In the Blog Post Form:**
   - Users can select an image from the Images table
   - The image is linked (not duplicated)
   - Multiple blog posts can use the same image

2. **When Publishing to WordPress:**
   - The API endpoint (`/api/blog/publish-to-wordpress`) will:
     - Check if `featured_image` field has a linked image
     - Fetch the linked image record
     - Extract the image URL from `imageLinkUrl` or `image` field
     - Extract alt text from `captionText` or `imagePrompt`
     - Include it in the WordPress webhook payload

3. **In the n8n Workflow:**
   - The workflow receives the image URL in the payload
   - Downloads and uploads it to WordPress Media Library
   - Sets it as the featured image for the post

## 🔄 Alternative: Direct URL Fields

If you prefer not to use a link row field, you can add these fields directly to the Blog Posts table:

1. **Featured Image URL** (URL field or Single line text)
   - Field Name: `Featured Image URL`
   - Field Type: `URL` or `Single line text`

2. **Featured Image Alt Text** (Single line text)
   - Field Name: `Featured Image Alt Text`
   - Field Type: `Single line text`

**Note:** The current API endpoint already supports `featured_image_url` and `featured_image_alt` fields, so this approach will work immediately without code changes.

## 📊 Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Link Row Field** | ✅ Better data integrity<br>✅ Reusable images<br>✅ Access to all image metadata | ❌ Requires code update (already done) |
| **Direct URL Fields** | ✅ Simple<br>✅ Works immediately<br>✅ No code changes needed | ❌ No relationship tracking<br>❌ Can't reuse images easily |

## 🎯 Recommended Approach

**Use the Link Row Field** - It's better for data management and allows you to:
- Reuse images across multiple blog posts
- Track which images are used where
- Access all image metadata (prompt, style, model, etc.)
- Maintain data integrity

## ✅ Verification

After adding the field:

1. **Create/Edit a Blog Post:**
   - You should see a "Featured Image" field
   - You can select an image from the Images table

2. **Publish to WordPress:**
   - The image should be included in the webhook payload
   - Check the n8n workflow execution logs
   - Verify the image appears in WordPress

## 🔧 Troubleshooting

### Issue: Featured Image Not Appearing

**Check:**
1. Is the image linked in the Blog Post record?
2. Does the linked image have a valid URL in `imageLinkUrl` or `image` field?
3. Check the API logs for image extraction errors
4. Verify the Images table ID is correct in client config

### Issue: Field Not Showing in Form

**Check:**
1. Is the field added to the Blog Posts table?
2. Is the field ID in the field mappings?
3. Is the form component reading the field?

## 📝 Code Changes Made

The following files have been updated to support linked featured images:

1. **`src/app/api/blog/publish-to-wordpress/route.ts`**
   - Added logic to fetch linked image records
   - Extracts image URL from `imageLinkUrl` or `image` field
   - Extracts alt text from `captionText` or `imagePrompt`
   - Falls back to direct URL fields if no linked image

## 🚀 Next Steps

1. Add the `Featured Image` link row field to your Blog Posts table
2. Test by creating a blog post and linking an image
3. Publish to WordPress and verify the image appears
4. Update field mappings if needed (usually automatic)

