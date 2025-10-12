# 🚀 Vercel Deployment Checklist

## Step 1: Environment Variables Setup

Go to your Vercel project: **Settings > Environment Variables**

### ✅ Add These 11 Required Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `BASEROW_API_URL` | `https://baserow.aiautomata.co.za` | Production, Preview, Development |
| `BASEROW_MODERN_MANAGEMENT_TOKEN` | `SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1` | Production, Preview, Development |
| `BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID` | `1030` | Production, Preview, Development |
| `BASEROW_CLIENT_CONFIGURATIONS_TABLE_ID` | `3231` | Production, Preview, Development |
| `BASEROW_CLIENT_INFORMATION_TABLE_ID` | `3232` | Production, Preview, Development |
| `WEBHOOK_SOCIAL_MEDIA_PROCESSOR` | `https://n8n.aiautomata.co.za/webhook/social-media-processor` | Production, Preview, Development |
| `WEBHOOK_IMAGE_GENERATOR` | `https://n8n.aiautomata.co.za/webhook/image-generator-webhook` | Production, Preview, Development |
| `WEBHOOK_BLOG_PROCESSOR` | `https://n8n.aiautomata.co.za/webhook/blog-creation-mvp` | Production, Preview, Development |
| `WEBHOOK_EMAIL_PROCESSOR` | `https://n8n.aiautomata.co.za/webhook/email-processor` | Production, Preview, Development |
| `WEBHOOK_UVP_CREATION` | `https://n8n.aiautomata.co.za/webhook/uvp_creation` | Production, Preview, Development |
| `WEBHOOK_ONBOARDING` | `https://n8n.aiautomata.co.za/webhook/onboarding` | Production, Preview, Development |

---

## Step 2: Verify Baserow Access

### Required Base: Client Info (Database 233)

Make sure `BASEROW_MODERN_MANAGEMENT_TOKEN` has access to these tables:

- ✅ **Environment Variables** (1030)
- ✅ **Client Settings** (1061)
- ✅ **Client Preferences** (1062)
- ✅ **Client Configurations** (3231)
- ✅ **Client Information** (3232)

---

## Step 3: Deploy to Vercel

```bash
# Make sure all changes are committed
git add .
git commit -m "Production ready"
git push origin main
```

Vercel will automatically deploy your main branch.

---

## Step 4: Post-Deployment Testing

### Test 1: Homepage
Visit: `https://content-engine-xi.vercel.app`
- ✅ Should show homepage with AiDa logo
- ✅ No errors in browser console

### Test 2: Create a Test Client
1. Go to: `https://content-engine-xi.vercel.app/admin/clients`
2. Click "Create New Client"
3. Fill in the onboarding form
4. Submit

**Expected Results:**
- ✅ Client created in Baserow database
- ✅ Environment variables stored in table 1030
- ✅ Client config stored in table 3231
- ✅ Client info stored in table 3232
- ✅ Onboarding webhook triggered
- ✅ No errors in Vercel logs

### Test 3: Access Client Dashboard
Visit: `https://content-engine-xi.vercel.app/dashboard/{client_id}`
- ✅ Dashboard loads with all cards
- ✅ Can navigate to each section
- ✅ Cards and tables display properly

---

## Step 5: Remove Deployment Protection

If you want the app accessible without login:

1. Go to Vercel Project Settings
2. Find "Deployment Protection"
3. Set to **"None"** or **"Only Preview Deployments"**
4. Save changes

---

## 🐛 Troubleshooting

### Issue: "Client not found" errors

**Check:**
1. Environment variables are set in Vercel
2. `BASEROW_MODERN_MANAGEMENT_TOKEN` is correct
3. Table IDs are correct (1030, 3231, 3232)

**Solution:**
```bash
# Check Vercel logs
vercel logs --follow
```

### Issue: "Unauthorized" errors

**Check:**
1. Baserow token has access to Database 233
2. Token is not expired
3. Baserow API URL is correct

**Solution:**
Test token in browser:
```
https://baserow.aiautomata.co.za/api/database/rows/table/1030/?user_field_names=true
Authorization: Token SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1
```

### Issue: Webhooks not triggering

**Check:**
1. Webhook URLs are accessible
2. n8n workflows are active
3. Webhook URLs are correct in Vercel env vars

**Solution:**
Test webhook manually:
```bash
curl -X POST https://n8n.aiautomata.co.za/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 📊 Monitoring

### Check Vercel Logs
```bash
vercel logs --follow
```

### Check Baserow Tables
- Environment Variables: `https://baserow.aiautomata.co.za/database/233/table/1030`
- Client Configurations: `https://baserow.aiautomata.co.za/database/233/table/3231`
- Client Information: `https://baserow.aiautomata.co.za/database/233/table/3232`

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Homepage loads without errors
- ✅ Can create new clients from admin panel
- ✅ Client data is stored in Baserow (not files)
- ✅ Dashboard loads for all clients
- ✅ All content sections work (cards & tables)
- ✅ Webhooks trigger correctly
- ✅ No "Unauthorized" or "Not Found" errors

---

## 🔄 Continuous Deployment

Every time you push to `main`:
1. Vercel automatically builds
2. Environment variables are loaded from project settings
3. App is deployed to production
4. Previous deployment becomes a backup

**Local Development → Git Push → Automatic Deployment** 🚀

---

**Need Help?** Check `ENV_VARIABLES_GUIDE.md` for detailed variable documentation.

