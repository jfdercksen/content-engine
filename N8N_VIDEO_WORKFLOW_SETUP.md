# n8n Video Generation Workflow Setup Guide

## 🎯 Overview

This guide will help you set up the n8n workflow to handle video generation requests from the Content Engine app.

**What this workflow does:**
1. Receives webhook from app when user creates a video
2. Updates Baserow status to "Preparing"
3. Calls AI API (Sora 2, Veo 3.1, etc.) to generate video
4. Polls for completion
5. Updates Baserow with video URL and "Completed" status

---

## 📋 Prerequisites

### **1. KIE.AI API Credentials**
You need an API key from [kie.ai](https://kie.ai) for Sora 2 and Veo 3.1 video generation.

### **2. n8n Instance**
Access to your n8n instance at: `https://n8n.aiautomata.co.za`

### **3. Baserow Token**
System token: `SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1` (already configured)

---

## 🚀 Quick Setup (Import Workflow)

### **Option A: Import Pre-Built Workflow**

1. Open n8n
2. Click **"+ Add workflow"**
3. Click the **"⋮"** menu → **"Import from File"**
4. Upload `n8n-video-workflow-basic.json`
5. Configure credentials (see below)
6. Activate workflow

---

## 🔧 Manual Setup (Step-by-Step)

### **Step 1: Create New Workflow**

1. In n8n, click **"+ Add workflow"**
2. Name it: **"Video Generation - Basic (Sora 2)"**

---

### **Step 2: Add Webhook Trigger**

1. Add node: **"Webhook"**
2. **Settings:**
   - HTTP Method: `POST`
   - Path: `video-generation`
   - Authentication: None (or add if needed)
   - Respond: "Using 'Respond to Webhook' node"

3. **Copy the webhook URL** (you'll need this later)
   - Example: `https://n8n.aiautomata.co.za/webhook/video-generation`

---

### **Step 3: Parse Webhook Payload**

Add node: **"Edit Fields" (Set)**

**Fields to extract:**
```
clientId        = {{ $json.body.clientId }}
videoType       = {{ $json.body.videoType }}
model           = {{ $json.body.model }}
recordId        = {{ $json.body.tables.videos.recordId }}
tableId         = {{ $json.body.tables.videos.id }}
baserowToken    = {{ $json.body.client.baserowToken }}
videoPrompt     = {{ $json.body.video.prompt }}
aspectRatio     = {{ $json.body.video.aspectRatio }}
duration        = {{ $json.body.video.duration }}
```

---

### **Step 4: Update Status to "Preparing"**

Add node: **"HTTP Request"**

**Settings:**
- Method: `PATCH`
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/{{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Authentication: **Generic Credential Type** → **Header Auth**
  - Name: `Authorization`
  - Value: `Token SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1`
- Body:
```json
{
  "videoStatus": "Preparing"
}
```

---

### **Step 5: Call Sora 2 API**

Add node: **"HTTP Request"**

**Settings:**
- Method: `POST`
- URL: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: **Generic Credential Type** → **Header Auth**
  - Name: `Authorization`
  - Value: `Bearer YOUR_KIE_AI_API_KEY` ← **You need to add your KIE.AI key here**
- Body:
```json
{
  "model": "sora-2-text-to-video",
  "input": {
    "prompt": "{{ $('Parse Payload').item.json.videoPrompt.replace(/\r?\n|\r/g, ' ').replace(/"/g, '') }}",
    "aspect_ratio": "{{ $('Parse Payload').item.json.aspectRatio.includes('9:16') ? 'portrait' : ($('Parse Payload').item.json.aspectRatio.includes('16:9') ? 'landscape' : 'square') }}",
    "n_frames": "{{ $('Parse Payload').item.json.duration }}",
    "remove_watermark": true
  }
}
```

**Note:** The prompt cleanup:
- Removes newlines: `.replace(/\r?\n|\r/g, ' ')`
- Removes quotes: `.replace(/"/g, '')`

---

### **Step 6: Update Status to "Generating Videos"**

Add node: **"HTTP Request"**

**Settings:**
- Method: `PATCH`
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/{{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Authentication: Same as Step 4
- Body:
```json
{
  "videoStatus": "Generating Videos",
  "taskId": "{{ $json.data.taskId }}"
}
```

---

### **Step 7: Wait for Generation**

Add node: **"Wait"**

**Settings:**
- Amount: `10` (seconds)

---

### **Step 8: Check Generation Status**

Add node: **"HTTP Request"**

**Settings:**
- Method: `GET`
- URL: `https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{ $('Sora 2: Generate Video').item.json.data.taskId }}`
- Authentication: Same as Step 5 (KIE.AI)

---

### **Step 9: Check if Complete**

Add node: **"IF"**

**Condition:**
- `{{ $json.data.state }}` **equals** `success`

**Connections:**
- **TRUE** → Continue to Step 10
- **FALSE** → Loop back to Step 7 (Wait)

---

### **Step 10: Extract Video URL**

Add node: **"Edit Fields" (Set)**

**Field:**
```
videoUrl = {{ JSON.parse($json.data.resultJson).resultUrls[0] }}
```

---

### **Step 11: Update Status to "Completed"**

Add node: **"HTTP Request"**

**Settings:**
- Method: `PATCH`
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/{{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Authentication: Same as Step 4
- Body:
```json
{
  "videoStatus": "Completed",
  "videoUrl": "{{ $('Extract Video URL').item.json.videoUrl }}",
  "completedAt": "{{ $now.toISO() }}"
}
```

---

### **Step 12: Respond to Webhook**

Add node: **"Respond to Webhook"**

**Settings:**
- Respond With: `JSON`
- Response Body:
```json
{
  "success": true,
  "message": "Video generation complete",
  "videoUrl": "{{ $('Extract Video URL').item.json.videoUrl }}"
}
```

---

## 🔑 Required Credentials

### **1. KIE.AI API Key**
- Go to Settings → Credentials
- Add **"Header Auth"** credential
- Name: `KIE.AI API`
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_KIE_AI_KEY`

### **2. Baserow Token**
- Add **"Header Auth"** credential
- Name: `Baserow System Token`
- Header Name: `Authorization`
- Header Value: `Token SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1`

---

## 🧪 Testing the Workflow

### **Test 1: Manual Execution**

1. Click **"Execute workflow"** manually
2. Use this test payload:

```json
{
  "event": "video_generation",
  "clientId": "modern-management",
  "videoType": "Text-to-Video",
  "model": "Sora 2",
  "timestamp": "2025-01-11T14:00:00Z",
  "client": {
    "id": "modern-management",
    "name": "Modern Management",
    "baserowToken": "SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1",
    "databaseId": "176"
  },
  "tables": {
    "videos": {
      "id": "3395",
      "recordId": "4"
    }
  },
  "fieldMappings": {
    "videos": {}
  },
  "video": {
    "prompt": "A serene beach at sunset with gentle waves",
    "type": "Text-to-Video",
    "model": "Sora 2",
    "aspectRatio": "16:9 (Landscape)",
    "duration": 10,
    "removeWatermark": true
  },
  "metadata": {
    "source": "content-engine-app",
    "version": "1.0"
  }
}
```

3. Watch the execution flow
4. Check Baserow - video status should update from Pending → Preparing → Generating Videos → Completed

---

### **Test 2: From the App**

1. Go to Video Ideas in your app
2. Click "Generate Video"
3. Fill in the form and submit
4. Watch the n8n workflow execute
5. Check the video status in the app (should auto-update every 10 seconds)

---

## 🌐 Configure Webhook URL in App

Add to your `.env.local` or environment variables:

```bash
N8N_VIDEO_GENERATION_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/video-generation
```

Or configure in the app's Settings page for the client.

---

## 📊 Workflow Diagram

```
Webhook Trigger
    ↓
Parse Payload
    ↓
Update Status: Preparing
    ↓
Switch: Model Type
    ↓
Sora 2: Generate Video
    ↓
Update Status: Generating
    ↓
Wait 10s
    ↓
Check Status
    ↓
Is Complete? ──┐
    ↓ YES      │ NO
Extract URL    │
    ↓          │
Update:        │
Completed ←────┘
    ↓
Respond
```

---

## 🔄 Adding More AI Models

To support Veo 3.1, add to the **Switch** node:

**Veo 3.1 Path:**
```json
{
  "method": "POST",
  "url": "https://api.kie.ai/api/v1/veo/generate",
  "body": {
    "prompt": "{{ $('Parse Payload').item.json.videoPrompt }}",
    "model": "veo3_fast",
    "aspectRatio": "9:16",
    "enableTranslation": true
  }
}
```

Then add wait → poll → extract → update pattern (same as Sora 2).

---

## ✅ Verification Checklist

- [ ] Workflow imported or created
- [ ] KIE.AI credentials configured
- [ ] Baserow credentials configured
- [ ] Webhook URL copied
- [ ] Test payload executed successfully
- [ ] Baserow record updates correctly
- [ ] Video URL stored in Baserow
- [ ] Webhook URL added to app config
- [ ] Test from app frontend

---

## 🐛 Troubleshooting

### **Workflow doesn't trigger**
- Check webhook URL in app matches n8n
- Check network tab for webhook request
- Verify webhook is activated in n8n

### **Video generation fails**
- Check KIE.AI API key is valid
- Check KIE.AI credit balance
- Review error in n8n execution log

### **Status doesn't update**
- Check Baserow token is correct
- Verify table ID is 3395
- Check record ID in payload

---

**Next Step:** Import the workflow into n8n and configure the credentials!

🎬 **Ready to generate your first AI video!**

