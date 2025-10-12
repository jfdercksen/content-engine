# Content Engine - Environment Variables Guide

This document lists all environment variables needed for the Content Engine application.

## 🚀 For Production (Vercel)

Add these variables in **Vercel Project Settings > Environment Variables**

---

## ✅ REQUIRED Variables

### 1. Baserow Configuration

```bash
# Main Baserow API URL
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_USERNAME=johan@aiautomations.co.za
BASEROW_PASSWORD=P@ssw0rd.123


# Modern Management Token (Primary Client)
BASEROW_MODERN_MANAGEMENT_TOKEN=SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1
```

### 2. Client Info Base - Database 233

These tables store system-wide configuration data:

```bash
# Environment Variables Table (stores client credentials)
BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID=1030

# Client Configurations Table (stores client app configs)
BASEROW_CLIENT_CONFIGURATIONS_TABLE_ID=3231

# Client Information Table (stores onboarding data)
BASEROW_CLIENT_INFORMATION_TABLE_ID=3232
```

### 3. N8N Webhook URLs

```bash
WEBHOOK_SOCIAL_MEDIA_PROCESSOR=https://n8n.aiautomata.co.za/webhook/social-media-processor
WEBHOOK_IMAGE_GENERATOR=https://n8n.aiautomata.co.za/webhook/image-generator-webhook
WEBHOOK_BLOG_PROCESSOR=https://n8n.aiautomata.co.za/webhook/blog-creation-mvp
WEBHOOK_EMAIL_PROCESSOR=https://n8n.aiautomata.co.za/webhook/email-processor
WEBHOOK_UVP_CREATION=https://n8n.aiautomata.co.za/webhook/uvp_creation
WEBHOOK_ONBOARDING=https://n8n.aiautomata.co.za/webhook/onboarding
```

---

## 📝 OPTIONAL Variables

### Application Settings

```bash
# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=https://content-engine-xi.vercel.app

# Node Environment (auto-set by Vercel)
NODE_ENV=production
```

### Modern Management Database (if using fallback)

```bash
BASEROW_MODERN_MANAGEMENT_DATABASE_ID=176
BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE=721
BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE=712
BASEROW_MODERN_MANAGEMENT_IMAGES_TABLE=729
BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE=728
BASEROW_MODERN_MANAGEMENT_EMAIL_IDEAS_TABLE=730
BASEROW_MODERN_MANAGEMENT_TEMPLATES_TABLE=731
```

---

## 🔄 Dynamic Client Variables

**⚠️ DO NOT ADD THESE TO VERCEL**

These are automatically stored in Baserow table 1030 when you create a new client:

- `BASEROW_{CLIENT}_TOKEN`
- `BASEROW_{CLIENT}_DATABASE_ID`
- `BASEROW_{CLIENT}_WORKSPACE_ID`
- `BASEROW_{CLIENT}_CONTENT_IDEAS_TABLE_ID`
- `BASEROW_{CLIENT}_SOCIAL_MEDIA_CONTENT_TABLE_ID`
- `BASEROW_{CLIENT}_IMAGES_TABLE_ID`
- `BASEROW_{CLIENT}_BRAND_ASSETS_TABLE_ID`
- `BASEROW_{CLIENT}_EMAIL_IDEAS_TABLE_ID`
- `BASEROW_{CLIENT}_TEMPLATES_TABLE_ID`
- `BASEROW_{CLIENT}_BLOG_POSTS_TABLE_ID`
- `BASEROW_{CLIENT}_BLOG_REQUESTS_TABLE_ID`
- `BASEROW_{CLIENT}_KEYWORD_RESEARCH_TABLE_ID`
- `BASEROW_{CLIENT}_PRODUCT_UVPS_TABLE_ID`

---

## 📋 Summary for Vercel Setup

### Minimum Required (9 variables):

1. ✅ `BASEROW_API_URL`
2. ✅ `BASEROW_MODERN_MANAGEMENT_TOKEN`
3. ✅ `BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID`
4. ✅ `BASEROW_CLIENT_CONFIGURATIONS_TABLE_ID`
5. ✅ `BASEROW_CLIENT_INFORMATION_TABLE_ID`
6. ✅ `WEBHOOK_SOCIAL_MEDIA_PROCESSOR`
7. ✅ `WEBHOOK_IMAGE_GENERATOR`
8. ✅ `WEBHOOK_BLOG_PROCESSOR`
9. ✅ `WEBHOOK_EMAIL_PROCESSOR`
10. ✅ `WEBHOOK_UVP_CREATION`
11. ✅ `WEBHOOK_ONBOARDING`

### How It Works in Production:

```
┌─────────────────────────────────────────────┐
│         Vercel Environment Variables        │
│  (Only system-wide & webhook URLs)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Client Info Base (Database 233)      │
│                                             │
│  • Environment Variables (1030)             │
│    → Stores client-specific credentials     │
│                                             │
│  • Client Configurations (3231)             │
│    → Stores client app configurations       │
│                                             │
│  • Client Information (3232)                │
│    → Stores onboarding data                 │
│                                             │
│  • Client Settings (1061)                   │
│    → Stores system settings per client      │
│                                             │
│  • Client Preferences (1062)                │
│    → Stores user preferences per client     │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Notes

1. **Sensitive values** are automatically encrypted in the database
2. **Never commit** `.env.local` to Git (already in `.gitignore`)
3. **Vercel variables** are encrypted by default
4. **Database tokens** use Baserow's JWT authentication

---

## 🛠️ For Local Development

Create a `.env.local` file with all variables:

```bash
# Copy all REQUIRED variables above
# Add any OPTIONAL variables you need
# Client-specific variables will be auto-added when you create clients
```

---

## ✅ Checklist for Going Live

- [ ] Add all 11 REQUIRED variables in Vercel
- [ ] Verify `BASEROW_MODERN_MANAGEMENT_TOKEN` has access to Database 233
- [ ] Test webhook URLs are accessible
- [ ] Verify table IDs are correct (1030, 3231, 3232)
- [ ] Create at least one test client to verify database storage
- [ ] Check Vercel deployment logs for any missing variables

---

**Last Updated:** October 12, 2025

