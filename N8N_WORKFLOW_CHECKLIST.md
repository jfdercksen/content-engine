# n8n Sora 2 Video Workflow - Complete Checklist

## ✅ Required Nodes (in order)

### **1. Webhook Trigger** ✅ (You have this)
- Type: Webhook
- Method: POST
- Path: `video-generation`
- Response Mode: "Using 'Respond to Webhook' node"

**Your webhook URL will be:**
```
https://n8n.aiautomata.co.za/webhook/video-generation
```

---

### **2. Parse Payload** ✅ (You have this)
- Type: Edit Fields (Set)
- Extract these fields from webhook body:
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

### **3. Update Status: Preparing** ✅ (You have this)
- Type: HTTP Request
- Method: PATCH
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/={{ $json.recordId }}/?user_field_names=true`
- Auth: Baserow Auth account (eLr9WkAowHbRSmCb)
- Body:
  ```json
  {
    "videoStatus": "Preparing"
  }
  ```

---

### **4. Sora 2: Generate Video** ✅ (You have this)
- Type: HTTP Request
- Method: POST
- URL: `https://api.kie.ai/api/v1/jobs/createTask`
- Auth: kie.ai account (AkbAjhqtJ0xgwVv2)
- Body:
  ```json
  {
    "model": "sora-2-text-to-video",
    "input": {
      "prompt": "{{ $('Parse Payload').item.json.videoPrompt.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').replace(/[""]/g, '') }}",
      "aspect_ratio": "{{ $('Parse Payload').item.json.aspectRatio.includes('9:16') ? 'portrait' : ($('Parse Payload').item.json.aspectRatio.includes('16:9') ? 'landscape' : 'square') }}",
      "n_frames": "{{ $('Parse Payload').item.json.duration }}",
      "remove_watermark": true
    }
  }
  ```

**Note:** This returns a `taskId` that we'll use to poll for completion.

---

### **5. Update Status: Generating Videos** ⚠️ (MISSING - ADD THIS)
- Type: HTTP Request
- Method: PATCH
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/={{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Auth: Baserow Auth account
- Body:
  ```json
  {
    "videoStatus": "Generating Videos",
    "taskId": "{{ $('Sora 2: Generate Video').item.json.data.taskId }}"
  }
  ```

**Connect:** `Sora 2: Generate Video` → `Update Status: Generating` → `Wait 10s`

---

### **6. Wait 10s** ✅ (You have this)
- Type: Wait
- Amount: 10 seconds

---

### **7. Check Sora Status** ✅ (You have this)
- Type: HTTP Request
- Method: GET
- URL: `https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{ $('Sora 2: Generate Video').item.json.data.taskId }}`
- Auth: kie.ai account

**Returns:** `{ data: { state: "success|processing|failed", resultJson: "..." } }`

---

### **8. Is Complete?** ✅ (You have this)
- Type: IF
- Condition: `{{ $json.data.state }}` equals `"success"`
- **TRUE** → Go to Extract Video URL
- **FALSE** → Loop back to Wait 10s (retry)

---

### **9. Extract Video URL** ✅ (You have this)
- Type: Edit Fields (Set)
- Field:
  ```
  videoUrl = {{ JSON.parse($json.data.resultJson).resultUrls[0] }}
  ```

---

### **10. Update Status: Completed** ✅ (You have this)
- Type: HTTP Request
- Method: PATCH
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/={{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Auth: Baserow Auth account
- Body:
  ```json
  {
    "videoStatus": "Completed",
    "videoUrl": "{{ $('Extract Video URL').item.json.videoUrl }}",
    "completedAt": "{{ $now.toISO() }}"
  }
  ```

---

### **11. Respond: Success** ✅ (You have this)
- Type: Respond to Webhook
- Response:
  ```json
  {
    "success": true,
    "message": "Video generation complete",
    "videoUrl": "{{ $('Extract Video URL').item.json.videoUrl }}"
  }
  ```

---

### **12. Update Status: Failed** ✅ (You have this)
- Type: HTTP Request  
- Method: PATCH
- URL: `https://baserow.aiautomata.co.za/api/database/rows/table/3395/={{ $('Parse Payload').item.json.recordId }}/?user_field_names=true`
- Auth: Baserow Auth account
- Body:
  ```json
  {
    "videoStatus": "Failed",
    "errorMessage": "Video generation failed or timed out"
  }
  ```

⚠️ **NEEDS CREDENTIAL** - Add Baserow Auth

---

### **13. Respond: Failed** ⚠️ (MISSING - ADD THIS)
- Type: Respond to Webhook
- Response:
  ```json
  {
    "success": false,
    "message": "Video generation failed",
    "error": "Generation timeout or error"
  }
  ```

**Connect:** `Update Status: Failed` → `Respond: Failed`

---

## 🔧 **What You Need to Fix:**

### **Issue 1: Switch Node** ⚠️
Your Switch1 node is empty. You have 2 options:

**Option A: Remove the Switch** (Simpler for MVP)
- Delete the Switch1 node
- Connect: `Update Status: Preparing` → `Sora 2: Generate Video`
- This is fine since we're only supporting Sora 2 for now

**Option B: Configure the Switch** (For future multi-model support)
- Keep it but configure it to route based on model
- Rule 1: If `{{ $('Parse Payload').item.json.model }}` equals `"Sora 2"` → Sora 2 path
- Rule 2: If `{{ $('Parse Payload').item.json.model }}` equals `"Veo 3.1"` → (future)

**My recommendation:** **Remove the Switch for now** - it's not needed for Sora 2 only.

---

### **Issue 2: Missing "Update Status: Generating" Node**
Add this node between `Sora 2: Generate Video` and `Wait 10s`.

---

### **Issue 3: Update Status: Failed Missing Credential**
Add the Baserow Auth credential to this node.

---

### **Issue 4: Missing "Respond: Failed" Node**
Add this at the end of the failure path.

---

## 🎯 **Simplified Workflow (Recommended):**

```
Webhook Trigger
    ↓
Parse Payload
    ↓
Update Status: Preparing
    ↓
Sora 2: Generate Video
    ↓
Update Status: Generating Videos (ADD THIS)
    ↓
Wait 10s
    ↓
Check Sora Status
    ↓
Is Complete?
    ├─ YES → Extract Video URL → Update: Completed → Respond: Success
    └─ NO  → Loop back to Wait 10s (retry)
    
(If it times out after 50+ tries, it should fail automatically)
```

---

## ✅ **Action Items:**

1. **Delete the Switch1 node** (not needed for MVP)
2. **Connect:** `Update Status: Preparing` → `Sora 2: Generate Video`
3. **Add node:** "Update Status: Generating Videos" after Sora 2
4. **Add credential** to "Update Status: Failed" node
5. **Add node:** "Respond: Failed" after "Update Status: Failed"
6. **Save and activate** the workflow
7. **Copy the webhook URL**

---

## 🧪 **How to Test:**

### **Test 1: Manual Execution in n8n**

Click "Execute workflow" and paste this test data:

```json
{
  "body": {
    "event": "video_generation",
    "clientId": "modern-management",
    "videoType": "Text-to-Video",
    "model": "Sora 2",
    "timestamp": "2025-01-11T15:00:00Z",
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
    "video": {
      "prompt": "A serene beach at sunset with gentle waves rolling onto the shore",
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
}
```

Watch it execute and verify:
- ✅ Status updates in Baserow
- ✅ Sora 2 API is called
- ✅ Video URL is returned
- ✅ Record is updated with video URL

---

**Would you like me to create the corrected workflow JSON file for you to import, or do you want to make these changes manually in n8n?** 🎬
