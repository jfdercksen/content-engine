# Troubleshooting Email Webhook 500 Error

## Issue
Getting "Server returned HTML error page instead of JSON" error when calling the email idea generation webhook.

## Solution Steps

### 1. Clear Next.js Build Cache
The most common cause is a corrupted build cache. Follow these steps:

**Windows PowerShell:**
```powershell
# Stop the dev server (Ctrl+C)
# Then run:
Remove-Item -Recurse -Force .next
npm run dev
```

**Or manually:**
1. Stop the dev server (Ctrl+C in the terminal)
2. Delete the `.next` folder in your project root
3. Restart the dev server: `npm run dev`

### 2. Check Server Console
The actual error message will appear in your **server console** (the terminal running `npm run dev`), not in the browser console. Look for:
- Import errors
- Syntax errors
- Module loading errors
- Runtime errors

### 3. Verify Route File
The route file should be at:
`src/app/api/webhooks/n8n/email-idea-generation/route.ts`

Make sure it exports:
- `export const runtime = 'nodejs'`
- `export const dynamic = 'force-dynamic'`
- `export async function POST(request: NextRequest)`

### 4. Check Dependencies
Make sure all imports are correct:
- `@/lib/utils/getClientConfigForAPI`
- `@/lib/baserow/api`

### 5. Test the Route Directly
You can test the route using curl or Postman:
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/email-idea-generation \
  -F "emailIdeaId=123" \
  -F "clientId=mg_bryanston" \
  -F "emailMediaStructure={\"emailType\":\"Welcome\",\"sections\":[],\"contentSource\":{\"type\":\"text\",\"value\":\"test\"}}"
```

## Common Errors

### "Failed to load chunk"
- **Solution**: Delete `.next` folder and restart

### "Module not found"
- **Solution**: Check import paths, restart dev server

### "Cannot read property of undefined"
- **Solution**: Check server console for the exact line, add null checks

## If Still Not Working

1. Check the **server console** (not browser console) for the actual error
2. Share the error message from the server console
3. Verify the route file has no syntax errors
4. Try accessing the route directly (see Test the Route above)

