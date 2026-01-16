# Content Engine Cleanup Report

## Summary
This report identifies files and folders that can be safely removed from the codebase to clean up the project.

---

## 🗑️ SAFE TO REMOVE

### 1. Empty API Route Directories (Test/Debug Routes)
These directories are empty and appear to be leftover from development/testing:

- `src/app/api/debug-client/` (empty)
- `src/app/api/debug-clients/` (empty)
- `src/app/api/debug-fields/` (empty)
- `src/app/api/test-client-config/` (empty)
- `src/app/api/test-client-creation/` (empty)
- `src/app/api/test-env/` (empty)
- `src/app/api/test-env-manager/` (empty)
- `src/app/api/test-env-vars/` (empty)
- `src/app/api/test-field-ids/` (empty)
- `src/app/api/test-persistent-client/` (empty)
- `src/app/api/test-simple-client/` (empty)
- `src/app/api/test-social-media-update/` (empty)
- `src/app/api/test-token/` (empty)
- `src/app/api/test-token-debug/` (empty)
- `src/app/api/test-update-278/` (empty)
- `src/app/api/test-webhook-urls/` (empty)

**Total: 16 empty directories**

### 2. Test JavaScript Files (Root Directory)
These are one-off test scripts that are no longer needed:

- `test-application-endpoints.js`
- `test-base-creation.js`
- `test-correct-endpoint.js`
- `test-correct-table-creation.js`
- `test-jwt-login.js`
- `test-table-creation.js`
- `test-token.js`
- `debug-env-simple.js`
- `debug-env.js`
- `quick-fix.js`
- `create-videos-table.js`
- `setup-blog-baserow-tables.js`

**Total: 12 test/debug scripts**

### 3. PowerShell Test Scripts
- `test-baserow-api.ps1`
- `test-videos-api.ps1`
- `get-baserow-table-ids.ps1`

**Total: 3 PowerShell scripts**

### 4. Test Page Routes (src/app)
These test pages are not referenced anywhere and can be removed:

- `src/app/test-complete-flow/page.tsx`
- `src/app/test-dynamic-images/page.tsx`
- `src/app/test-email-form/page.tsx`
- `src/app/test-image-upload/page.tsx`
- `src/app/test-simplified-email-form/page.tsx`
- `src/app/test-template-config/page.tsx`
- `src/app/test-template-positions/page.tsx`

**Total: 7 test pages**

### 5. Temporary/Test JSON Files
- `field_test.json`
- `field_test2.json`
- `blog-workflow-env.txt`
- `modern-management-client-config.json` (if not needed for reference)

**Total: 4 files**

### 6. Build Artifacts
- `tsconfig.tsbuildinfo` (TypeScript build cache - regenerated on build)
- `next-env.d.ts` (Next.js type definitions - auto-generated)

**Total: 2 files**

---

## ⚠️ REVIEW BEFORE REMOVING

### 1. Documentation Files (Root Directory)
These might be useful for reference, but many seem redundant:

**Keep:**
- `README.md` (main readme)
- `CONTENT_ENGINE_DOCUMENTATION.md` (main documentation)
- `API_REFERENCE.md` (API documentation)

**Consider Removing (if outdated/redundant):**
- `API_TESTING_GUIDE.md`
- `BACKUP_RESTORE_GUIDE.md`
- `BLOG_BASEROW_SETUP_GUIDE.md`
- `BLOG_POST_FEATURED_IMAGE_SETUP.md`
- `BLOG_WORKFLOW_BUILD_GUIDE.md`
- `BLOG_WORKFLOW_IMPLEMENTATION_GUIDE.md`
- `BLOG_WORKFLOW_SETUP_SUMMARY.md`
- `CLIENT_ONBOARDING_DOCUMENTATION.md`
- `CREATE_VIDEOS_TABLE_GUIDE.md`
- `ENV_VARIABLES_GUIDE.md`
- `FINAL_ONBOARDING_FLOW.md`
- `FRONTEND_TESTING_GUIDE.md`
- `IMAGE_BROWSER_FEATURE.md`
- `IMAGE_GENERATION_PROCESSES.md`
- `N8N_COMPLETE_WORKFLOW_GUIDE.md`
- `N8N_VIDEO_WORKFLOW_SETUP.md`
- `N8N_WORKFLOW_CHECKLIST.md`
- `PROGRESSIVE_ONBOARDING_GUIDE.md`
- `QUICK_START_GUIDE.md`
- `README_CLIENT_ONBOARDING.md`
- `SPLIT_PHASE_IMPLEMENTATION.md`
- `TROUBLESHOOTING_EMAIL_WEBHOOK.md`
- `TROUBLESHOOTING_GUIDE.md`
- `UGC_WORKFLOW_COMPLETE.md`
- `VERCEL_DEPLOYMENT_GUIDE.md`
- `VERCEL_DEPLOYMENT.md`
- `VERCEL_ENV_SETUP.txt`
- `VERCEL_SETUP_CHECKLIST.md`
- `VERCEL_TIMEOUT_ISSUE.md`
- `VIDEO_STUDIO_COMPLETE_SUMMARY.md`
- `VIDEO_STUDIO_PROGRESS.md`
- `VIDEO_STUDIO_STATUS.md`
- `VIDEOS_TABLE_STRUCTURE.md`
- `WORDPRESS_APP_PASSWORD_SETUP.md`
- `WORDPRESS_AUTH_MIGRATION.md`
- `WORDPRESS_POSTING_WORKFLOW_GUIDE.md`
- `WORDPRESS_PUBLISHING_FEATURE.md`

**Total: ~35 documentation files to review**

### 2. Workflow JSON Files
These might be needed for n8n workflow imports:

**Keep (if actively used):**
- `n8n-blog-post-creation-workflow.json`
- `n8n-blog-wordpress-posting-workflow.json`
- `n8n-video-workflow-complete-v2.json`
- `n8n-video-workflow-complete.json`
- `n8n-video-workflow-ugc-complete.json`
- `n8n-workflows.json`
- `workflows.json`

**Review:**
- `blog-creation-mvp.json` (might be outdated)
- `Video Workflows/` folder (3 JSON files - check if needed)

**Total: ~10 workflow files**

### 3. Reference/Data Files
- `data/clients.json` - **KEEP** (might be used for client data)
- `Table Structure/Images Table.txt` - **REVIEW** (might be useful reference)
- `videos-table-template.json` - **REVIEW** (might be useful reference)

---

## 📊 SUMMARY STATISTICS

### Safe to Remove Immediately:
- **16 empty API directories**
- **12 test/debug JavaScript files**
- **3 PowerShell scripts**
- **7 test page routes**
- **4 temporary JSON files**
- **2 build artifacts**

**Total: ~44 items safe to remove**

### Review Before Removing:
- **~35 documentation files** (consolidate or archive)
- **~10 workflow JSON files** (verify which are active)
- **3 reference/data files** (verify usage)

---

## 🚀 RECOMMENDED CLEANUP STEPS

1. **Phase 1 - Safe Removals:**
   - Delete all empty API directories
   - Delete all test JavaScript files
   - Delete PowerShell test scripts
   - Delete test page routes
   - Delete temporary JSON files
   - Delete build artifacts

2. **Phase 2 - Documentation Review:**
   - Review each documentation file
   - Consolidate redundant guides
   - Archive outdated documentation to `/docs/archive/` if needed
   - Keep only current, relevant documentation

3. **Phase 3 - Workflow Files:**
   - Verify which n8n workflows are actively used
   - Archive or remove outdated workflow files
   - Keep only production workflows

4. **Phase 4 - Final Cleanup:**
   - Update `.gitignore` if needed
   - Verify no broken imports/references
   - Test the application after cleanup

---

## ⚠️ IMPORTANT NOTES

- **No "kiro" folder found** - This folder doesn't exist in the codebase
- Always test the application after removing files
- Consider creating a backup before major cleanup
- Some documentation files might be useful for onboarding new developers
- Workflow JSON files might be needed for n8n setup/deployment

---

## 📝 NEXT STEPS

1. Review this report
2. Confirm which items to remove
3. Execute cleanup in phases
4. Test application functionality
5. Update documentation if needed

