# WordPress MCP Plugin Setup Guide

## 📖 **Install WordPress MCP Plugin for Automated Publishing**

This guide will walk you through installing and configuring the WordPress MCP plugin on your WordPress site.

---

## 🎯 **What is WordPress MCP?**

WordPress MCP (Model Context Protocol) is a plugin that allows Content Engine to publish blog posts directly to your WordPress site automatically. It provides:

- ✅ Automated blog post creation
- ✅ Image uploads
- ✅ Category and tag management
- ✅ Post scheduling
- ✅ Secure JWT authentication

**Official Repository:** [https://github.com/Automattic/wordpress-mcp](https://github.com/Automattic/wordpress-mcp)

---

## 📋 **Prerequisites**

- ✅ WordPress 5.9 or higher
- ✅ PHP 7.4 or higher
- ✅ Admin access to your WordPress site
- ✅ SSL certificate (HTTPS) - **Recommended for security**

---

## 🚀 **Step 1: Download the Plugin**

1. **Visit the official releases page:**
   ```
   https://github.com/Automattic/wordpress-mcp/releases/latest
   ```

2. **Download the latest `.zip` file:**
   - Look for `wordpress-mcp-x.x.x.zip` (e.g., `wordpress-mcp-0.2.5.zip`)
   - Click to download to your computer

---

## 📦 **Step 2: Install the Plugin**

### Option 1: Upload via WordPress Admin (Easiest)

1. **Log in to your WordPress admin panel:**
   ```
   https://yourblog.com/wp-admin
   ```

2. **Navigate to Plugins:**
   - Click `Plugins` → `Add New` in the left sidebar

3. **Upload the plugin:**
   - Click `Upload Plugin` button at the top
   - Click `Choose File` and select the downloaded `.zip` file
   - Click `Install Now`

4. **Activate the plugin:**
   - Click `Activate Plugin` after installation completes

### Option 2: Upload via FTP

1. **Extract the zip file** on your computer
2. **Upload via FTP:**
   - Connect to your WordPress site via FTP/SFTP
   - Navigate to `/wp-content/plugins/`
   - Upload the extracted `wordpress-mcp` folder
3. **Activate:**
   - Go to WordPress admin → `Plugins`
   - Find "WordPress MCP" and click `Activate`

---

## ⚙️ **Step 3: Configure the Plugin**

1. **Navigate to plugin settings:**
   - WordPress Admin → `Settings` → `WordPress MCP`

2. **Enable MCP:**
   - Toggle `Enable WordPress MCP` to **ON**

3. **Configure CRUD Operations:**
   
   ✅ **Enable Create Tools** - YES (allows creating posts)
   
   ✅ **Enable Update Tools** - YES (allows editing posts)
   
   ⚠️ **Enable Delete Tools** - NO (for safety - only enable if absolutely needed)

4. **Save Settings**

---

## 🔐 **Step 4: Generate Authentication Token**

1. **Go to Token Management:**
   - Settings → `WordPress MCP` → `JWT Tokens` tab

2. **Generate New Token:**
   - Click `Generate New Token` button
   - **Token Name:** Enter `Content Engine Integration`
   - **Expiration Time:** Choose token validity:
     - **7 days** - Recommended for regular use
     - **24 hours** - For testing
     - **30 days** - Maximum (regenerate monthly)

3. **Copy the Token:**
   - ⚠️ **IMPORTANT:** Copy the entire token immediately!
   - You won't be able to see it again after closing
   - The token looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Note the Expiration Date:**
   - Write down when the token expires
   - You'll need to regenerate a new token before it expires

---

## 📝 **Step 5: Gather Your Information**

You'll need these details to enter in Content Engine:

1. **WordPress Site URL:**
   ```
   https://yourblog.com
   ```
   *(Your WordPress site's base URL - no trailing slash)*

2. **WordPress Username:**
   ```
   your-admin-username
   ```
   *(The admin user who generated the JWT token)*

3. **JWT Authentication Token:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *(The full token you just copied)*

4. **Token Expiration Date:**
   ```
   2025-02-15
   ```
   *(When you'll need to regenerate the token)*

**Keep this information secure!** You'll enter it in Content Engine settings.

---

## ✅ **Step 6: Test the Connection**

### Verify MCP is Working

Open your browser and visit:
```
https://yourblog.com/wp-json/mcp/v1
```

**You should see:**
```json
{
  "name": "WordPress MCP Server",
  "version": "0.2.5",
  "protocolVersion": "2024-11-05"
}
```

If you see this, **your WordPress is ready!** ✅

### If You See an Error:

**404 Error:**
1. Go to `Settings` → `Permalinks`
2. Click `Save Changes` (this refreshes permalinks)
3. Try again

**Plugin Not Found:**
- Verify the plugin is activated in `Plugins` menu
- Should show as active (blue highlight)

---

## 🔧 **Common Issues & Solutions**

### Issue 1: Can't Install Plugin

**Problem:** "The uploaded file exceeds the upload_max_filesize directive"

**Solution:**
- Ask your hosting provider to increase upload limit, OR
- Use FTP method instead

### Issue 2: 404 Error on MCP Endpoint

**Problem:** Can't access `/wp-json/mcp/v1`

**Solution:**
1. Settings → Permalinks → Click "Save Changes"
2. Make sure plugin is activated
3. Check if `/wp-json/` works (basic REST API test)

### Issue 3: Token Expired

**Problem:** Getting "Token Expired" error

**Solution:**
1. Generate a new token in WordPress
2. Update the token in Content Engine settings
3. Set a reminder to regenerate before next expiration

---

## 🛡️ **Security Checklist**

Before going live:

- ✅ WordPress is updated to latest version
- ✅ SSL certificate is installed (HTTPS)
- ✅ Admin password is strong
- ✅ JWT token is kept secure (treat like a password)
- ✅ Delete operations are disabled
- ✅ Token has appropriate expiration (7-30 days)
- ✅ Regular backups are configured

---

## 🔄 **Token Renewal**

**When tokens expire, you'll need to:**

1. Go to WordPress → Settings → WordPress MCP → JWT Tokens
2. Click `Generate New Token`
3. Copy the new token
4. Update it in Content Engine settings
5. Save settings

**💡 Tip:** Set a calendar reminder 2 days before expiration!

---

## 📚 **Additional Resources**

### Official Documentation
- **Plugin Repository:** https://github.com/Automattic/wordpress-mcp
- **Detailed Setup:** https://github.com/Automattic/wordpress-mcp/blob/trunk/docs/client-setup.md
- **Troubleshooting:** https://github.com/Automattic/wordpress-mcp/blob/trunk/docs/troubleshooting.md

### Support
- **GitHub Issues:** https://github.com/Automattic/wordpress-mcp/issues
- **WordPress Forums:** https://wordpress.org/support/

---

## ✅ **Setup Checklist**

Use this to verify your setup is complete:

- [ ] Downloaded WordPress MCP plugin from GitHub
- [ ] Installed plugin on WordPress site
- [ ] Activated the plugin
- [ ] Enabled MCP in WordPress settings
- [ ] Configured CRUD operations:
  - [ ] Create Tools: ON
  - [ ] Update Tools: ON
  - [ ] Delete Tools: OFF
- [ ] Generated JWT authentication token
- [ ] Copied token and saved securely
- [ ] Noted token expiration date
- [ ] Tested MCP endpoint (returns JSON)
- [ ] Gathered all information:
  - [ ] WordPress Site URL
  - [ ] WordPress Username
  - [ ] JWT Token
  - [ ] Expiration Date

---

## 🎉 **You're Done!**

Your WordPress site is now ready to receive automated blog posts from Content Engine!

**Next Step:** Enter your WordPress credentials in Content Engine → Settings → WordPress Publishing (MCP)

---

*Last Updated: January 2025 | Version: 1.1*
