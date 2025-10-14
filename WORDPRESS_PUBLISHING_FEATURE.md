# WordPress Publishing Feature

## Overview
This feature automatically publishes blog posts to WordPress when they are approved and have a scheduled publish date. It includes manual publishing capability and sends complete blog data to your n8n webhook for WordPress integration.

---

## 🎯 **What Was Added**

### 1. **WordPress Publisher Webhook**
- **URL**: `https://n8n.aiautomata.co.za/webhook/blog_post`
- **Purpose**: Receives complete blog post data and publishes to WordPress
- **Location**: Added to Client Settings (table 1061) for each client
- **Fallback**: Environment variable `WEBHOOK_WORDPRESS_PUBLISHER`

### 2. **Featured Image Fields in Blog Posts**
Added to blog post form and data model:
- `featured_image_url` - URL of the featured image
- `featured_image_alt` - Alt text for SEO and accessibility
- Image preview display in edit mode
- Error handling for broken images

### 3. **Auto-Publish Trigger**
Located in: `src/app/api/baserow/[clientId]/blog-posts/[postId]/route.ts`

**Triggers when:**
- Blog post status is changed to `"Approved"` OR `"Published"`
- Blog post has a `scheduled_publish_date` set

**What it does:**
- Automatically calls the WordPress publishing endpoint in the background
- Non-blocking (doesn't fail blog update if publishing fails)
- Logs all actions for debugging

### 4. **Manual Publish Button**
Located on: Blog Post Edit Page (`/dashboard/[clientId]/blog-posts/[postId]`)

**Visibility:**
- Only shows when status = "Approved" OR "Published" AND scheduled_publish_date is set
- Blue button with "Publish to WordPress" text
- Shows loading state "Publishing..." when active

**Features:**
- Manual trigger for WordPress publishing
- Toast notifications for success/error
- Calls same endpoint as auto-publish

### 5. **WordPress Publishing API Endpoint**
File: `src/app/api/blog/publish-to-wordpress/route.ts`

**What it does:**
1. Fetches complete blog post data from Baserow
2. Gets WordPress configuration from Client Settings
3. Retrieves WordPress webhook URL (3-tier fallback)
4. Prepares comprehensive payload
5. Sends to n8n webhook for WordPress publishing

---

## 📦 **Payload Structure**

The webhook receives a complete JSON payload:

```json
{
  "clientId": "test10",
  "clientName": "Test 10",
  
  "blogPost": {
    "id": 123,
    "title": "Blog Post Title",
    "content": "<p>Full HTML content...</p>",
    "excerpt": "Meta description used as excerpt",
    "slug": "blog-post-title",
    "focusKeyword": "SEO keyword",
    "metaDescription": "Meta description...",
    "metaTitle": "Meta title...",
    "category": "Category Name",
    "tags": ["tag1", "tag2"],
    "status": "publish",
    "scheduledDate": "2025-10-15T10:00:00Z"
  },
  
  "featuredImage": {
    "url": "https://example.com/image.jpg",
    "alt": "Image description",
    "caption": "Image caption"
  },
  
  "wordpress": {
    "siteUrl": "https://client-site.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
  },
  
  "seo": {
    "focusKeyword": "main keyword",
    "secondaryKeywords": ["keyword2", "keyword3"],
    "metaTitle": "Meta title",
    "metaDescription": "Meta description",
    "seoScore": 90,
    "readabilityScore": 85
  },
  
  "metadata": {
    "authorId": "1",
    "wordCount": 1500,
    "internalLinks": "link1, link2",
    "externalSources": "source1, source2"
  }
}
```

---

## 🧪 **Testing the Feature**

### **Step 1: Set Up WordPress Webhook in Settings**

1. Navigate to: `http://localhost:3000/dashboard/[clientId]/settings`
2. Scroll to "Webhook Integrations" section
3. Find "WordPress Publisher" field
4. Ensure it shows: `https://n8n.aiautomata.co.za/webhook/blog_post`
5. Save if changed

### **Step 2: Configure WordPress Settings**

In the same Settings page, under "WordPress Publishing (MCP)":
1. WordPress Site URL (e.g., `https://yoursite.com`)
2. WordPress Username (admin user)
3. Application Password (from WordPress → Users → Profile → Application Passwords)

**How to Generate Application Password:**
- Log into WordPress as admin
- Go to Users → Your Profile
- Scroll to "Application Passwords"
- Enter name: "Content Engine"
- Click "Add New Application Password"
- Copy the password (shown only once!)

### **Step 3: Create or Edit a Blog Post**

1. Go to: `http://localhost:3000/dashboard/[clientId]/blog-posts`
2. Create new blog post or edit existing
3. Fill in all required fields:
   - Title
   - Content
   - Meta description
   - Focus keyword
   - Category
   - Tags
   
### **Step 4: Add Featured Image**

In the blog post form:
1. Scroll to "Featured Image URL" field
2. Add image URL (e.g., from Unsplash or your server)
3. Add "Featured Image Alt Text" for SEO
4. Preview should show the image

### **Step 5: Test Auto-Publish**

1. Set status to "Approved" or "Published"
2. Set a "Scheduled Publish Date" (any future date/time)
3. Click "Save"
4. Check browser console for:
   ```
   🚀 Auto-publishing to WordPress: status=Approved (or Published), scheduledDate=...
   ✅ WordPress publishing triggered in background
   ```
5. Check n8n webhook for incoming payload

### **Step 6: Test Manual Publish**

1. Open a blog post that is "Approved" or "Published" with scheduled date
2. You should see blue "Publish to WordPress" button in header
3. Click the button
4. Should see toast: "Publishing to WordPress..."
5. On success: "Blog post published to WordPress successfully!"
6. Check n8n for webhook payload

### **Step 7: Verify Payload**

In n8n webhook logs, verify you receive:
- ✅ Client info (clientId, clientName)
- ✅ Complete blog post data (title, content, slug, etc.)
- ✅ Featured image data (if provided)
- ✅ WordPress config (siteUrl, jwtToken, etc.)
- ✅ SEO data (keywords, scores)
- ✅ Metadata (word count, links)

---

## 🔧 **Configuration for New Clients**

When creating a new client, the WordPress webhook is automatically:
1. Added to environment variables table (1030)
2. Initialized in Client Settings (1061) with default URL
3. Available in Settings UI for customization

**Default webhook URL**: `https://n8n.aiautomata.co.za/webhook/blog_post`

---

## 📝 **Environment Variables**

### **Local Development (.env.local)**
```bash
WEBHOOK_WORDPRESS_PUBLISHER=https://n8n.aiautomata.co.za/webhook/blog_post
```

### **Vercel Production**
Add in Vercel Project Settings → Environment Variables:
```
WEBHOOK_WORDPRESS_PUBLISHER = https://n8n.aiautomata.co.za/webhook/blog_post
```

---

## 🔄 **Webhook Fallback Priority**

The system uses a 3-tier fallback:

1. **Client Settings (table 1061)** - First priority, client-specific
2. **Environment Variable** - Second, `WEBHOOK_WORDPRESS_PUBLISHER`
3. **Hardcoded Default** - Last resort, system-wide default

This ensures the webhook always works even if not configured.

---

## 🐛 **Troubleshooting**

### Issue: "WordPress publisher webhook not configured"
**Solution**: 
- Check Client Settings table (1061) for the webhook URL
- Verify environment variable is set
- Check `getWebhookUrl` function logs

### Issue: Auto-publish not triggering
**Solution**:
- Ensure status is exactly "Approved" or "Published" (case-sensitive)
- Ensure `scheduled_publish_date` is set (not empty)
- Check browser console for trigger logs
- Check API route logs for auto-publish execution

### Issue: Manual publish button not showing
**Solution**:
- Status must be "Approved" or "Published"
- Must have `scheduled_publish_date` set
- Refresh page after saving

### Issue: Payload missing data
**Solution**:
- Check blog post has all fields filled
- Verify featured image URL is valid
- Check WordPress settings are saved
- Review API endpoint logs for data fetching

### Issue: n8n webhook not receiving
**Solution**:
- Test webhook URL in Postman/curl
- Check n8n workflow is active
- Verify webhook URL in settings matches n8n
- Check API response for webhook errors

---

## 📚 **Files Modified**

### **Core Files**
- `src/app/api/blog/publish-to-wordpress/route.ts` - New endpoint
- `src/app/api/baserow/[clientId]/blog-posts/[postId]/route.ts` - Auto-publish
- `src/components/forms/BlogPostForm.tsx` - Image fields
- `src/app/dashboard/[clientId]/blog-posts/[postId]/page.tsx` - Manual button

### **Configuration Files**
- `src/app/api/settings/[clientId]/initialize/route.ts` - Default webhook
- `src/app/api/admin/clients/create/route.ts` - New client setup
- `src/app/dashboard/[clientId]/settings/page.tsx` - Settings UI
- `src/lib/utils/getWebhookUrl.ts` - Webhook helper

### **Documentation**
- `ENV_VARIABLES_GUIDE.md` - Added `WEBHOOK_WORDPRESS_PUBLISHER`
- `VERCEL_ENV_SETUP.txt` - Added to deployment checklist
- `WORDPRESS_PUBLISHING_FEATURE.md` - This file

---

## ✅ **Success Criteria**

The feature is working correctly when:

- ✅ New clients get WordPress webhook automatically
- ✅ Settings page shows WordPress Publisher field
- ✅ Blog post form has featured image fields
- ✅ Image preview displays correctly
- ✅ Changing status to "Approved" + date triggers auto-publish
- ✅ Manual "Publish to WordPress" button appears when conditions met
- ✅ Clicking manual button sends to webhook
- ✅ n8n receives complete payload with all data
- ✅ WordPress settings from Client Settings included in payload
- ✅ Toast notifications work for success/error

---

## 🎉 **Next Steps**

After local testing passes:

1. **Commit changes** to git
2. **Push to GitHub**
3. **Deploy to Vercel**
4. **Add env variable** to Vercel: `WEBHOOK_WORDPRESS_PUBLISHER`
5. **Test on live app** with real WordPress site
6. **Monitor n8n** for successful publishes
7. **Document** any client-specific WordPress configurations

---

## 💡 **Future Enhancements**

Potential improvements:
- Image upload directly from blog editor
- AI image generation from featured_image_prompt
- Bulk publish multiple posts
- Schedule automatic publishing at specific time
- Preview how post will look in WordPress
- Status update when publish succeeds/fails
- Retry mechanism for failed publishes

---

**Created**: October 13, 2025  
**Status**: ✅ Ready for Testing  
**Version**: 1.0

