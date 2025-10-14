# WordPress Authentication Migration: JWT → Application Passwords

## 📋 **Summary of Changes**

### **Problem:**
- JWT authentication required separate n8n credentials for each client
- Couldn't dynamically handle multiple clients in one workflow
- Required JWT plugin installation in WordPress

### **Solution:**
- Switched to WordPress **Application Passwords**
- Credentials passed dynamically in webhook payload
- One n8n workflow handles all clients
- No WordPress plugins required (built into core 5.6+)

---

## 🔄 **What Changed**

### **1. Client Settings (UI)**

**Before (JWT):**
```
- WordPress Site URL
- WordPress Username  
- JWT Authentication Token ← REMOVED
- Token Expiration Date  ← REMOVED
- MCP Endpoint
```

**After (Application Password):**
```
- WordPress Site URL
- WordPress Username
- Application Password ← NEW!
- MCP Endpoint (optional)
```

---

### **2. Payload Structure**

**Before:**
```json
{
  "wordpress": {
    "siteUrl": "https://site.com",
    "username": "admin",
    "jwtToken": "eyJhbGc...",
    "mcpEndpoint": "..."
  }
}
```

**After:**
```json
{
  "wordpress": {
    "siteUrl": "https://site.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }
}
```

---

### **3. n8n Workflow**

**Before:**
- Required separate "HTTP Request Credential" for each client
- Manually configured JWT Bearer token
- Separate workflows per client OR complex credential switching

**After:**
- **One workflow for all clients!**
- Extract credentials from payload: `{{ $json.wordpress.username }}`
- Use "Generic Credential Type" with Basic Auth
- Username: `{{ $json.wordpress.username }}`
- Password: `{{ $json.wordpress.appPassword }}`

---

## 📝 **Files Modified**

### **Updated Files:**

1. ✅ `src/app/dashboard/[clientId]/settings/page.tsx`
   - Changed `jwt_token` → `app_password`
   - Changed `token_expiration` → removed
   - Updated UI labels and placeholders
   - Updated validation

2. ✅ `src/app/api/blog/publish-to-wordpress/route.ts`
   - Changed `jwtToken` → `appPassword` in config
   - Updated logging

3. ✅ `WORDPRESS_PUBLISHING_FEATURE.md`
   - Updated payload structure
   - Updated setup instructions

### **New Files:**

4. ✨ `WORDPRESS_APP_PASSWORD_SETUP.md`
   - Complete guide for WordPress setup
   - n8n workflow examples
   - Troubleshooting guide

5. ✨ `WORDPRESS_AUTH_MIGRATION.md` (this file)
   - Migration summary

---

## 🎯 **How to Use Application Passwords**

### **Step 1: Generate in WordPress**
1. Log into WordPress as admin
2. Users → Profile
3. Scroll to "Application Passwords"
4. Name: `Content Engine`
5. Click "Add New Application Password"
6. **COPY THE PASSWORD** (shown only once!)

### **Step 2: Add to Content Engine**
1. Go to Settings for client
2. Enter WordPress Site URL
3. Enter WordPress Username
4. Paste Application Password
5. Save

### **Step 3: n8n Setup**
1. Use **Generic Credential Type**
2. Auth Type: **Basic Auth**
3. User: `{{ $json.wordpress.username }}`
4. Password: `{{ $json.wordpress.appPassword }}`

---

## 🧪 **Testing**

### **Test WordPress API Access:**

```bash
curl -X POST https://your-site.com/wp-json/wp/v2/posts \
  -u "admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test","status":"draft"}'
```

**Expected:** `201 Created`

### **Test from App:**
1. Edit blog post
2. Set status = "Published"
3. Add scheduled date
4. Save
5. Check n8n execution
6. Check WordPress for new post

---

## ✅ **Migration Checklist**

For existing clients:

- [ ] Generate Application Password in WordPress
- [ ] Update Client Settings in Content Engine
- [ ] Remove old JWT token
- [ ] Update n8n workflow to use Basic Auth
- [ ] Test publishing a blog post
- [ ] Verify post appears in WordPress

---

## 🎉 **Benefits**

| Feature | JWT | App Password |
|---------|-----|--------------|
| Plugin Required | ✅ Yes | ❌ No |
| Token Expiration | ✅ Yes | ❌ Never |
| Dynamic n8n | ❌ No | ✅ Yes |
| Setup Complexity | 🔴 High | 🟢 Low |
| Multi-Client | 🔴 Hard | 🟢 Easy |
| Revocable | ⚠️ Limited | ✅ Easy |

---

## 📚 **Documentation**

- **Setup Guide**: `WORDPRESS_APP_PASSWORD_SETUP.md`
- **Feature Guide**: `WORDPRESS_PUBLISHING_FEATURE.md`
- **WordPress Docs**: https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/

---

**Migration Date**: October 13, 2025  
**Status**: ✅ Complete  
**Impact**: All new clients will use Application Passwords

