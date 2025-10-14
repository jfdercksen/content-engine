# WordPress Application Password Setup Guide

## 🎯 **Why Application Passwords?**

WordPress Application Passwords allow **dynamic, multi-client authentication** in n8n without creating separate credentials for each client. This is perfect for your use case!

### **Benefits:**
- ✅ **One n8n Workflow** - Handle all clients dynamically
- ✅ **No JWT Plugin** - Built into WordPress core (5.6+)
- ✅ **Simple Setup** - Generate in WordPress user profile
- ✅ **Secure** - Revocable without changing main password
- ✅ **Per-Client** - Each client uses their own credentials

---

## 📋 **Step 1: Generate Application Password in WordPress**

### **For Each Client's WordPress Site:**

1. **Log into WordPress** as an admin user
2. Go to: **Users → Profile** (or **Users → All Users → Select User → Edit**)
3. Scroll down to **"Application Passwords"** section
4. Enter a name: `Content Engine` or `n8n Blog Publisher`
5. Click **"Add New Application Password"**
6. **COPY THE PASSWORD** immediately (shown only once!)
   - Format: `xxxx xxxx xxxx xxxx xxxx xxxx` (24 characters with spaces)
   - Remove spaces for API use or keep them (both work)

### **Important Notes:**
- ⚠️ Password is shown **only once** - save it immediately!
- 💡 You need both the **username** and **application password**
- 🔒 Use an **admin** or **editor** user (needs post creation permissions)
- 🗑️ Can revoke anytime from same screen

---

## 🔧 **Step 2: Configure in Content Engine**

### **In Settings Page:**

1. Go to: `http://localhost:3000/dashboard/[clientId]/settings`
2. Scroll to **"WordPress Publishing (MCP)"** section
3. Fill in:
   - **WordPress Site URL**: `https://client-site.com`
   - **WordPress Username**: `admin` (or the user who generated the password)
   - **Application Password**: `xxxx xxxx xxxx xxxx xxxx xxxx`
   - **MCP Endpoint** (optional): Leave empty (auto-generated)
4. Click **"Save Settings"**

### **What Gets Stored:**
```json
{
  "site_url": "https://client-site.com",
  "username": "admin",
  "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

---

## 🎨 **Step 3: n8n Workflow Setup**

### **Single Dynamic Workflow for All Clients**

Your n8n workflow will receive credentials in the payload and use them dynamically!

### **n8n Workflow Structure:**

```
1. Webhook Trigger (blog_post)
   ↓
2. Set Variables (extract credentials from payload)
   ↓
3. HTTP Request (WordPress REST API - Create Post)
   ↓
4. (Optional) Upload Featured Image
   ↓
5. (Optional) Update Post with Image
   ↓
6. Response
```

---

### **Node 1: Webhook Trigger**

**Settings:**
- **Path**: `blog_post`
- **HTTP Method**: `POST`
- **Response Code**: `200`

**Receives Payload:**
```json
{
  "clientId": "test10",
  "wordpress": {
    "siteUrl": "https://client-site.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
  },
  "blogPost": { ... },
  "featuredImage": { ... }
}
```

---

### **Node 2: HTTP Request - Create WordPress Post**

**Method:** `POST`

**URL:** 
```
{{ $json.wordpress.siteUrl }}/wp-json/wp/v2/posts
```

**Authentication:** `Generic Credential Type`

**Generic Auth:**
- **Type**: `Basic Auth`
- **User**: `{{ $json.wordpress.username }}`
- **Password**: `{{ $json.wordpress.appPassword }}`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "{{ $json.blogPost.title }}",
  "content": "{{ $json.blogPost.content }}",
  "excerpt": "{{ $json.blogPost.excerpt }}",
  "status": "{{ $json.blogPost.status === 'Published' ? 'publish' : 'draft' }}",
  "categories": [1],
  "tags": {{ $json.blogPost.tags }},
  "meta": {
    "description": "{{ $json.seo.metaDescription }}"
  }
}
```

---

### **Node 3: HTTP Request - Upload Featured Image (if provided)**

**Condition:** Only if `$json.featuredImage.url` exists

**Method:** `POST`

**URL:**
```
{{ $json.wordpress.siteUrl }}/wp-json/wp/v2/media
```

**Authentication:** Same as above
- **User**: `{{ $json.wordpress.username }}`
- **Password**: `{{ $json.wordpress.appPassword }}`

**Body:**
Upload the image from URL or base64

---

### **Node 4: HTTP Request - Set Featured Image**

**Method:** `POST`

**URL:**
```
{{ $json.wordpress.siteUrl }}/wp-json/wp/v2/posts/{{ $node["Create Post"].json.id }}
```

**Authentication:** Same as above

**Body:**
```json
{
  "featured_media": {{ $node["Upload Image"].json.id }}
}
```

---

## 📝 **Example: Complete n8n Code Node (Alternative)**

You can also use a Code node to do everything:

```javascript
const wordpress = $input.item.json.wordpress;
const blogPost = $input.item.json.blogPost;
const featuredImage = $input.item.json.featuredImage;
const seo = $input.item.json.seo;

// Prepare Basic Auth header
const auth = Buffer.from(`${wordpress.username}:${wordpress.appPassword}`).toString('base64');

// Create WordPress post
const postResponse = await fetch(`${wordpress.siteUrl}/wp-json/wp/v2/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  },
  body: JSON.stringify({
    title: blogPost.title,
    content: blogPost.content,
    excerpt: blogPost.excerpt,
    status: blogPost.status === 'Published' ? 'publish' : 'draft',
    slug: blogPost.slug,
    categories: [1], // Default category
    tags: blogPost.tags,
    meta: {
      _yoast_wpseo_title: seo.metaTitle,
      _yoast_wpseo_metadesc: seo.metaDescription,
      _yoast_wpseo_focuskw: seo.focusKeyword
    }
  })
});

const post = await postResponse.json();

// Upload featured image if provided
if (featuredImage && featuredImage.url) {
  // Download image
  const imageResponse = await fetch(featuredImage.url);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  // Upload to WordPress
  const uploadResponse = await fetch(`${wordpress.siteUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Disposition': `attachment; filename="featured-image.jpg"`,
      'Content-Type': 'image/jpeg'
    },
    body: imageBuffer
  });
  
  const media = await uploadResponse.json();
  
  // Set as featured image
  await fetch(`${wordpress.siteUrl}/wp-json/wp/v2/posts/${post.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      featured_media: media.id
    })
  });
}

return {
  success: true,
  postId: post.id,
  postUrl: post.link,
  message: `Blog post published to WordPress`
};
```

---

## 🧪 **Testing the Setup**

### **1. Test WordPress REST API Access**

Use curl or Postman to test:

```bash
curl -X POST https://your-site.com/wp-json/wp/v2/posts \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "This is a test",
    "status": "draft"
  }'
```

**Expected Response:** `201 Created` with post data

---

### **2. Test from Content Engine**

1. Create or edit a blog post
2. Add featured image URL
3. Set status to "Published"
4. Set scheduled publish date
5. Click "Save" or "Publish to WordPress"
6. Check n8n workflow execution
7. Check WordPress for new post

---

## 🔒 **Security Best Practices**

### **1. Use HTTPS**
- ✅ WordPress site MUST use HTTPS
- ❌ HTTP will expose credentials

### **2. Limit User Permissions**
- Create dedicated user for API: `content_engine_bot`
- Set role to **Editor** or **Author** (not Admin if possible)
- Only give necessary permissions

### **3. Use Unique Passwords Per Client**
- Each client should have their own app password
- Don't reuse across clients

### **4. Revoke When Done**
- Revoke app passwords when client relationship ends
- Monitor active application passwords

### **5. Store Securely**
- Content Engine stores in Client Settings (table 1061)
- Encrypted in Baserow
- Never log full passwords

---

## 🐛 **Troubleshooting**

### **Issue: 401 Unauthorized**
**Solutions:**
- ✅ Verify username is correct
- ✅ Check app password copied correctly (24 chars)
- ✅ Try removing spaces: `xxxxxxxxxxxxxxxxxxxxxxxx`
- ✅ Ensure user has post creation permissions
- ✅ Check WordPress is using HTTPS

### **Issue: 403 Forbidden**
**Solutions:**
- ✅ User doesn't have permission to create posts
- ✅ Upgrade user role to Editor or Admin
- ✅ Check if REST API is disabled on site

### **Issue: 404 Not Found**
**Solutions:**
- ✅ Verify site URL is correct: `https://site.com` (no trailing slash)
- ✅ Check WordPress REST API is enabled
- ✅ Test: `https://site.com/wp-json/wp/v2/posts`

### **Issue: App Password Not Showing**
**Solutions:**
- ✅ WordPress 5.6+ required
- ✅ HTTPS required (app passwords disabled on HTTP)
- ✅ Check if disabled in `wp-config.php`:
  ```php
  define('APPLICATION_PASSWORD_AUTH_ENABLED', true);
  ```

---

## 📚 **WordPress REST API Endpoints**

### **Create Post**
```
POST /wp-json/wp/v2/posts
```

### **Upload Media**
```
POST /wp-json/wp/v2/media
```

### **Get Categories**
```
GET /wp-json/wp/v2/categories
```

### **Get Tags**
```
GET /wp-json/wp/v2/tags
```

### **Update Post**
```
POST /wp-json/wp/v2/posts/{id}
```

---

## 🎉 **Benefits Summary**

| Feature | JWT Auth | App Password |
|---------|----------|--------------|
| **Dynamic n8n** | ❌ No | ✅ Yes |
| **Plugin Required** | ✅ Yes | ❌ No |
| **Token Expiration** | ✅ Yes | ❌ Never |
| **Easy Setup** | ❌ Complex | ✅ Simple |
| **Revocable** | ⚠️ Limited | ✅ Easy |
| **WordPress Core** | ❌ No | ✅ Yes |

---

## 🔗 **Resources**

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Application Passwords Guide](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/)
- [REST API Authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)

---

**Created**: October 13, 2025  
**Status**: ✅ Production Ready  
**Version**: 2.0 (Updated from JWT to App Password)

