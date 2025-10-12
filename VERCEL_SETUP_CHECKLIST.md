# ✅ Vercel Setup Checklist - Content Engine

**Your Vercel App:** [https://content-engine-xi.vercel.app/](https://content-engine-xi.vercel.app/)

---

## 🚀 Step 1: Add Environment Variables

Go to: **[Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables**

### Copy-Paste These 13 Variables:

For each variable, select: **Production, Preview, Development**

```
Variable Name: BASEROW_API_URL
Value: https://baserow.aiautomata.co.za
```

```
Variable Name: BASEROW_USERNAME
Value: johan@aiautomations.co.za
```

```
Variable Name: BASEROW_PASSWORD
Value: P@ssw0rd.123
```

```
Variable Name: BASEROW_MODERN_MANAGEMENT_TOKEN
Value: SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1
```

```
Variable Name: BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID
Value: 1030
```

```
Variable Name: BASEROW_CLIENT_CONFIGURATIONS_TABLE_ID
Value: 3231
```

```
Variable Name: BASEROW_CLIENT_INFORMATION_TABLE_ID
Value: 3232
```

```
Variable Name: WEBHOOK_SOCIAL_MEDIA_PROCESSOR
Value: https://n8n.aiautomata.co.za/webhook/social-media-processor
```

```
Variable Name: WEBHOOK_IMAGE_GENERATOR
Value: https://n8n.aiautomata.co.za/webhook/image-generator-webhook
```

```
Variable Name: WEBHOOK_BLOG_PROCESSOR
Value: https://n8n.aiautomata.co.za/webhook/blog-creation-mvp
```

```
Variable Name: WEBHOOK_EMAIL_PROCESSOR
Value: https://n8n.aiautomata.co.za/webhook/email-processor
```

```
Variable Name: WEBHOOK_UVP_CREATION
Value: https://n8n.aiautomata.co.za/webhook/uvp_creation
```

```
Variable Name: WEBHOOK_ONBOARDING
Value: https://n8n.aiautomata.co.za/webhook/onboarding
```

### Optional (Recommended):

```
Variable Name: NEXT_PUBLIC_APP_URL
Value: https://content-engine-xi.vercel.app
```

```
Variable Name: BASEROW_MODERN_MANAGEMENT_DATABASE_ID
Value: 176
```

---

## 🔄 Step 2: Redeploy

After adding all variables:

1. ✅ Click **"Save"** in Vercel
2. ✅ Go to **"Deployments"** tab
3. ✅ Click the **"..." menu** on the latest deployment
4. ✅ Click **"Redeploy"**
5. ⏱️ Wait 2-3 minutes for deployment

---

## ✅ Step 3: Test Your Deployment

### Test 1: Homepage ✅
- Visit: [https://content-engine-xi.vercel.app/](https://content-engine-xi.vercel.app/)
- Should show: AiDa logo, "Content Engine" heading
- ✅ **PASSED** - Already confirmed working!

### Test 2: Admin Panel
- Visit: [https://content-engine-xi.vercel.app/admin/clients](https://content-engine-xi.vercel.app/admin/clients)
- Should show: Client management dashboard
- Try: Create a new test client

### Test 3: Client Dashboard
- Visit: [https://content-engine-xi.vercel.app/dashboard/modern-management](https://content-engine-xi.vercel.app/dashboard/modern-management)
- Should show: Dashboard with content cards
- Try: Navigate to Social Media, Blog Posts, etc.

---

## 🐛 If Something Goes Wrong

### Check Vercel Logs:
```bash
# In your local terminal:
vercel logs --follow

# Or in Vercel Dashboard:
Your Project → Deployments → [Latest] → Runtime Logs
```

### Common Issues:

**1. "Unauthorized" Errors**
- ✅ Check: `BASEROW_MODERN_MANAGEMENT_TOKEN` is set correctly
- ✅ Check: Token has access to Database 233

**2. "Client not found" Errors**
- ✅ Check: All 3 table IDs are set (1030, 3231, 3232)
- ✅ Check: Variables are set for all environments

**3. Webhooks Not Triggering**
- ✅ Check: All webhook URLs are set
- ✅ Test: Try webhook URLs in browser/Postman

---

## 📊 Monitor Your Deployment

### Baserow Tables to Check:

1. **Environment Variables (1030)**
   - URL: `https://baserow.aiautomata.co.za/database/233/table/1030`
   - Should contain: Client credentials when you create new clients

2. **Client Configurations (3231)**
   - URL: `https://baserow.aiautomata.co.za/database/233/table/3231`
   - Should contain: App configurations for each client

3. **Client Information (3232)**
   - URL: `https://baserow.aiautomata.co.za/database/233/table/3232`
   - Should contain: Onboarding data from new clients

---

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Homepage loads at https://content-engine-xi.vercel.app/
- ✅ Admin panel accessible
- ✅ Can create new clients
- ✅ Client data saved to Baserow (not local files)
- ✅ Dashboard loads for all clients
- ✅ All content sections work (cards & tables)
- ✅ No errors in Vercel logs

---

## 📝 Quick Reference

| Item | Value |
|------|-------|
| **Live URL** | https://content-engine-xi.vercel.app/ |
| **Admin Panel** | https://content-engine-xi.vercel.app/admin/clients |
| **Baserow API** | https://baserow.aiautomata.co.za |
| **Client Info Base** | Database 233 |
| **Env Variables Table** | 1030 |
| **Client Configs Table** | 3231 |
| **Client Info Table** | 3232 |

---

## 🔐 Security Notes

- ✅ All variables are encrypted in Vercel
- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Sensitive values auto-encrypted in Baserow
- ✅ Use Baserow JWT tokens for authentication

---

**Need Help?** Check the other guides:
- 📚 `ENV_VARIABLES_GUIDE.md` - Full variable documentation
- 📋 `VERCEL_DEPLOYMENT.md` - Detailed deployment steps
- 📝 `VERCEL_ENV_SETUP.txt` - Quick copy-paste reference

---

**Created:** October 12, 2025  
**App URL:** https://content-engine-xi.vercel.app/

