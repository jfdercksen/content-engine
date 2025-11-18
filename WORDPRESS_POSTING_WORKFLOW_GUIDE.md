# WordPress Blog Posting Workflow Guide

## 📋 Overview

This n8n workflow receives blog post data from your Next.js app, converts Markdown content to HTML using an AI agent, and publishes it to WordPress.

## 🔄 Workflow Flow

```
1. Webhook Trigger (receives blog post data + WordPress credentials)
   ↓
2. Parse Payload (validates and structures data)
   ↓
3. Convert Markdown to HTML (AI Agent)
   ↓
4. Set HTML Content
   ↓
5. Has Featured Image? (IF node)
   ├─ YES → Download Image → Upload to WordPress → Get Media ID → Create Post with Image
   └─ NO → Create Post without Image
   ↓
6. Set WordPress Result
   ↓
7. Respond Success
```

## 📥 Webhook Payload Structure

The workflow expects this payload structure:

```json
{
  "clientId": "client-name",
  "clientName": "Client Display Name",
  "blogPost": {
    "id": 123,
    "title": "Blog Post Title",
    "content": "Markdown content here...",
    "excerpt": "Short excerpt",
    "slug": "blog-post-slug",
    "status": "publish",
    "metaTitle": "SEO Meta Title",
    "metaDescription": "SEO Meta Description",
    "focusKeyword": "primary keyword",
    "category": "Category Name",
    "tags": ["tag1", "tag2"]
  },
  "featuredImage": {
    "url": "https://example.com/image.jpg",
    "alt": "Image alt text",
    "caption": "Image caption"
  },
  "wordpress": {
    "siteUrl": "https://yoursite.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
  },
  "seo": {
    "focusKeyword": "keyword",
    "metaTitle": "Meta Title",
    "metaDescription": "Meta Description"
  }
}
```

## 🛠️ Setup Instructions

### Step 1: Import Workflow

1. Open n8n
2. Go to **Workflows** → **Import from File**
3. Select `n8n-blog-wordpress-posting-workflow.json`
4. Click **Import**

### Step 2: Configure Webhook

1. Open the **Webhook Trigger** node
2. Set **Path** to: `blog_post` (or your preferred path)
3. Set **HTTP Method** to: `POST`
4. **Save** the workflow to activate the webhook
5. Copy the **Webhook URL** (e.g., `https://n8n.aiautomata.co.za/webhook/blog_post`)

### Step 3: Configure OpenAI Model

1. Open the **OpenAI Model** node
2. Ensure your OpenAI API credentials are configured
3. The model is set to `gpt-4o-2024-11-20` (you can change this if needed)

### Step 4: WordPress Authentication (Already Configured!)

**✅ Dynamic credentials are handled automatically!**

The workflow uses a **"Prepare Auth Header"** Code node that:
- Extracts WordPress credentials from the webhook payload
- Creates a Basic Auth header dynamically
- Makes it available to all HTTP Request nodes

**No manual configuration needed** - the workflow handles dynamic credentials for all clients automatically!

### Step 5: Test the Workflow

1. Use the **Test Workflow** button in n8n
2. Or send a test payload from your Next.js app
3. Check the execution logs for any errors

## 🔧 Node Details

### 1. Parse Payload
- Validates required fields
- Structures data for workflow
- Removes trailing slashes from WordPress site URL

### 2. Convert Markdown to HTML
- Uses OpenAI GPT-4 to convert Markdown to clean HTML
- Ensures semantic HTML5 structure
- Preserves formatting, links, images, lists, code blocks

### 3. Has Featured Image?
- Checks if `featuredImage.url` exists
- Routes to image upload path if yes
- Routes to direct post creation if no

### 4. Upload Featured Image to WordPress
- Downloads image from URL
- Uploads to WordPress Media Library
- Returns media ID for post association

### 5. Create WordPress Post
- Creates post with HTML content
- Sets featured image (if available)
- Includes SEO meta fields (Yoast compatible)
- Sets post status (publish/draft)

## 📝 WordPress Post Fields

The workflow creates posts with these fields:

- **title**: Blog post title
- **content**: HTML content (converted from Markdown)
- **excerpt**: Short excerpt
- **status**: `publish` or `draft`
- **slug**: URL-friendly slug
- **featured_media**: Media ID (if image uploaded)
- **meta**: SEO fields (only added if provided, works with or without Yoast SEO)
  - `_yoast_wpseo_title`: SEO title (Yoast SEO plugin)
  - `_yoast_wpseo_metadesc`: Meta description (Yoast SEO plugin)
  - `_yoast_wpseo_focuskw`: Focus keyword (Yoast SEO plugin)
  
  **Note:** If Yoast SEO is not installed, these fields are simply ignored by WordPress. The post will still be created successfully with title, content, excerpt, and featured image.

## 🔄 Integration with Next.js App

Your Next.js app already has the endpoint `/api/blog/publish-to-wordpress` that:
1. Fetches blog post from Baserow
2. Gets WordPress credentials from Client Settings
3. Sends payload to this n8n webhook

**No changes needed** - it's already configured! ✅

## ⚠️ Troubleshooting

### Issue: Authentication Errors

**Problem:** WordPress API returns 401 Unauthorized

**Solutions:**
1. Verify WordPress Application Password is correct
2. Check that username matches WordPress admin user
3. Ensure Application Password has proper permissions
4. Check the "Prepare Auth Header" node execution - verify it's creating the auth header correctly
5. Verify the Authorization header is being sent in HTTP Request nodes

### Issue: SEO Meta Fields Not Working

**Problem:** SEO fields not appearing in WordPress

**Solutions:**
1. **If Yoast SEO is installed:** Fields should work automatically
2. **If Yoast SEO is NOT installed:** This is normal - WordPress will ignore the Yoast-specific meta fields, but the post will still be created with title, content, excerpt, and featured image
3. The workflow only adds meta fields if they're provided in the payload, so it's safe for sites without Yoast

### Issue: Featured Image Not Uploading

**Problem:** Image upload fails

**Solutions:**
1. Verify image URL is accessible
2. Check image file size (WordPress has limits)
3. Ensure image format is supported (jpg, png, gif, webp)
4. Check WordPress media upload permissions

## ✅ How Dynamic Authentication Works

The workflow uses a **"Prepare Auth Header"** Code node that:
1. Runs after HTML conversion
2. Extracts WordPress credentials from the payload
3. Creates a Basic Auth header: `Basic base64(username:password)`
4. Adds it to the data flow
5. HTTP Request nodes use it in the `Authorization` header

This approach works reliably for all clients without needing separate credentials in n8n!

## 🔀 Alternative: Code Node Approach (Not Needed)

The workflow already uses Code nodes for authentication, but if you need to modify it:

### Code Node: Upload Featured Image

```javascript
const parsePayload = $('Parse Payload').first().json;
const imageData = $input.first().binary.data;

const wordpress = parsePayload.wordpress;
const auth = Buffer.from(`${wordpress.username}:${wordpress.appPassword}`).toString('base64');

const formData = new FormData();
formData.append('file', imageData.data, imageData.fileName || 'image.jpg');
formData.append('title', parsePayload.blogPost.title);
formData.append('alt_text', parsePayload.featuredImage.alt || parsePayload.blogPost.title);

const response = await fetch(`${wordpress.siteUrl}/wp-json/wp/v2/media`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`
  },
  body: formData
});

const media = await response.json();
return { json: { featured_media_id: media.id, ...media } };
```

### Code Node: Create WordPress Post

```javascript
const parsePayload = $('Parse Payload').first().json;
const htmlContent = $('Set HTML Content').first().json.html_content;
const featuredMediaId = $('Set Featured Media ID').first()?.json.featured_media_id || 0;

const wordpress = parsePayload.wordpress;
const auth = Buffer.from(`${wordpress.username}:${wordpress.appPassword}`).toString('base64');

const postData = {
  title: parsePayload.blogPost.title,
  content: htmlContent,
  excerpt: parsePayload.blogPost.excerpt,
  status: parsePayload.blogPost.status,
  slug: parsePayload.blogPost.slug,
  featured_media: featuredMediaId,
  meta: {
    _yoast_wpseo_title: parsePayload.blogPost.metaTitle,
    _yoast_wpseo_metadesc: parsePayload.blogPost.metaDescription,
    _yoast_wpseo_focuskw: parsePayload.blogPost.focusKeyword
  }
};

const response = await fetch(`${wordpress.siteUrl}/wp-json/wp/v2/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  },
  body: JSON.stringify(postData)
});

const post = await response.json();
return { json: post };
```

## ✅ Success Response

The workflow returns:

```json
{
  "success": true,
  "message": "Blog post published to WordPress successfully",
  "wordpressPostId": 123,
  "wordpressPostUrl": "https://yoursite.com/blog/post-slug",
  "status": "publish"
}
```

## 📚 Additional Resources

- [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/)
- [Application Passwords Guide](./WORDPRESS_APP_PASSWORD_SETUP.md)
- [WordPress Publishing Feature](./WORDPRESS_PUBLISHING_FEATURE.md)

