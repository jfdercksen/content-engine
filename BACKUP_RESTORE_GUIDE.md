# Content Engine - Backup & Restore Guide

## 🎯 **Current Working Version**
- **Commit Hash**: `aa99605`
- **Tag**: `v1.0.0-working`
- **Status**: ✅ Working with image display fixed

## 📦 **What's Backed Up**

### Code Files (87 files total):
- ✅ All API routes (`src/app/api/`)
- ✅ All dashboard pages (`src/app/dashboard/`)
- ✅ All components (`src/components/`)
- ✅ All library files (`src/lib/`)
- ✅ Configuration files
- ✅ Upload directories

### Key Features Working:
- ✅ Content Ideas management
- ✅ Social Media Content creation/editing
- ✅ Image generation and display
- ✅ Brand Assets management
- ✅ Baserow API integration
- ✅ File uploads (images, videos, voice notes)

## 🔄 **Restore Commands**

### Quick Restore to Working Version:
```bash
git checkout v1.0.0-working
npm install
npm run dev
```

### Restore to Latest Commit:
```bash
git checkout master
npm install
npm run dev
```

### Hard Reset to Working State:
```bash
git reset --hard aa99605
npm install
npm run dev
```

## 🌐 **Environment Variables Required**

Create a `.env.local` file with:

```env
# Baserow Configuration
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_API_TOKEN=your_baserow_token_here

# Client Configuration
NEXT_PUBLIC_CLIENT_ID=modern-management

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=public/uploads

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 🗄️ **Database Backup**

### Baserow Tables to Backup:
1. **Content Ideas Table** (ID: 712)
2. **Social Media Content Table** (ID: 713)
3. **Images Table** (ID: 729)
4. **Brand Assets Table** (ID: 728)

### Client Configuration:
- **Client ID**: `modern-management`
- **Tables**: Configured in `src/lib/config/clients.ts`

## 🚀 **Deployment Checklist**

1. **Code**: ✅ Committed and tagged
2. **Dependencies**: ✅ `npm install`
3. **Environment**: ✅ `.env.local` configured
4. **Database**: ✅ Baserow configured
5. **File Uploads**: ✅ `public/uploads/` directory exists

## 🆘 **Emergency Recovery**

If the system breaks:

1. **Stop the server**: `Ctrl+C`
2. **Restore code**: `git checkout v1.0.0-working`
3. **Reinstall dependencies**: `npm install`
4. **Restart**: `npm run dev`

## 📋 **Verification Steps**

After restore, verify:
- [ ] Content Ideas page loads
- [ ] Social Media Content page loads
- [ ] Image generation works
- [ ] Edit forms display images correctly
- [ ] File uploads work
- [ ] API routes respond correctly

## 🔗 **Useful Commands**

```bash
# Check current status
git status

# View commit history
git log --oneline

# List all tags
git tag

# Create new backup
git add .
git commit -m "New backup: [description]"
git tag -a v1.0.1 -m "New working version"

# Push to remote (if configured)
git push origin master
git push origin --tags
```

## 📞 **Support**

If restoration fails:
1. Check Git status: `git status`
2. Check for conflicts: `git diff`
3. Reset completely: `git reset --hard HEAD`
4. Restore from tag: `git checkout v1.0.0-working`

---
**Last Updated**: August 22, 2025
**Working Version**: v1.0.0-working (aa99605)
