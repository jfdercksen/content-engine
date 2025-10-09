# Vercel Deployment Guide - Content Engine

## 📋 Environment Variables for Vercel

You'll need to add these environment variables in Vercel's dashboard after deployment.

### 🔑 Core Baserow Configuration

```bash
# Modern Management Client (Primary)
BASEROW_MODERN_MANAGEMENT_TOKEN=SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1
BASEROW_MODERN_MANAGEMENT_DATABASE_ID=176
BASEROW_MODERN_MANAGEMENT_WORKSPACE_ID=129

# Modern Management Table IDs
BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE_ID=721
BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE_ID=712
BASEROW_MODERN_MANAGEMENT_IMAGES_TABLE_ID=729
BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE_ID=728
BASEROW_MODERN_MANAGEMENT_EMAIL_IDEAS_TABLE_ID=730
BASEROW_MODERN_MANAGEMENT_TEMPLATES_TABLE_ID=731
BASEROW_MODERN_MANAGEMENT_PRODUCT_UVPS_TABLE_ID=1018

# Baserow API URL
BASEROW_API_URL=https://baserow.aiautomata.co.za

# Environment Variables Table (Client Info Database)
BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID=1030
```

### 🎣 n8n Webhook URLs

```bash
# Content Generation Webhooks
N8N_CONTENT_IDEA_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/social-media-processor
N8N_IMAGE_IDEA_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/image-generator-webhook
N8N_EMAIL_IDEA_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/email-processor
N8N_BLOG_WORKFLOW_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/blog-creation-mvp
N8N_UVP_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/uvp_creation
```

### 🌐 Application Settings

```bash
# Next.js Environment
NODE_ENV=production

# Application URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🚀 Deployment Steps

### Step 1: Test Build Locally

Before deploying, test that your app builds successfully:

```bash
npm run build
```

If this fails, we need to fix any errors before deploying.

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub account

### Step 3: Push to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Content Engine"

# Create GitHub repository at github.com
# Then push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/content-engine.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel

1. Log in to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "Deploy" (it will fail initially - that's OK!)

### Step 5: Add Environment Variables

1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add ALL variables from the list above
4. For each variable:
   - Paste the **Key** (e.g., `BASEROW_MODERN_MANAGEMENT_TOKEN`)
   - Paste the **Value**
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Add"
5. After adding all variables, click "Redeploy"

### Step 6: Verify Deployment

1. Wait for deployment to complete (~2-5 minutes)
2. Click on the deployment URL
3. Test the following:
   - ✅ Homepage loads
   - ✅ Admin panel (`/admin/clients`)
   - ✅ Modern Management dashboard
   - ✅ Create a new client
   - ✅ Check that environment variables are in Baserow table

---

## ⚠️ Important Notes

### Environment Variable Storage

**In Production (Vercel):**
- Environment variables are stored in **Baserow** (Client Info database, table 1030)
- New clients automatically get their configs saved to the database
- No `.env.local` file is used

**How It Works:**
- When you create a new client in production, the system:
  1. Creates the Baserow database and tables
  2. Stores environment variables in the Environment Variables table
  3. Retrieves them from the database when needed

### File Uploads

**Important:** Vercel's file system is **read-only** in production.

Current upload directories that need to be updated:
- `public/uploads/images/`
- `public/uploads/videos/`
- `public/uploads/voice-notes/`

**Solution Options:**
1. **Use Vercel Blob Storage** (recommended)
2. **Use AWS S3**
3. **Use Cloudinary**

We can set this up after initial deployment if needed.

### Database Connectivity

Your Baserow instance at `https://baserow.aiautomata.co.za` needs to be accessible from Vercel's servers. Ensure:
- ✅ No IP restrictions
- ✅ CORS configured if needed
- ✅ SSL/TLS enabled

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Type errors found"**
- Run `npm run build` locally
- Fix TypeScript errors
- Push changes and redeploy

**Error: "Module not found"**
- Check `package.json` dependencies
- Run `npm install` locally
- Commit `package-lock.json`
- Push and redeploy

### Runtime Errors

**Error: "Environment variable not found"**
- Verify all variables are added in Vercel
- Check spelling matches exactly
- Redeploy after adding variables

**Error: "Cannot connect to Baserow"**
- Check `BASEROW_API_URL` is correct
- Verify token is valid
- Check Baserow instance is accessible

---

## 📞 Support

If you encounter issues during deployment, check:
1. Vercel deployment logs
2. Browser console for errors
3. Network tab for failed API calls

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Test Modern Management dashboard
- [ ] Create a test client
- [ ] Verify environment variables in Baserow
- [ ] Test content creation workflows
- [ ] Test image generation
- [ ] Test blog post creation
- [ ] Set up custom domain (optional)
- [ ] Configure file storage solution
- [ ] Set up monitoring/analytics (optional)

---

**Good luck with your deployment! 🚀**

