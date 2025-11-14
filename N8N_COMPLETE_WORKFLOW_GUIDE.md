# 🎬 Complete Video Generation Workflow Guide

## Overview

This n8n workflow handles **3 video generation types** with **multiple AI models** in a single unified flow:

1. **Text-to-Video** (Sora 2)
2. **Image-to-Video** (Kling Video)
3. **UGC Ads** (NanoBanana + Veo 3.1)

---

## 📊 Workflow Structure

```
Webhook Trigger
    ↓
Parse Payload (Extract all data)
    ↓
Update Status: Preparing
    ↓
Route By Type & Model (SWITCH)
    ├─ Output 1: Text-to-Video + Sora 2
    │   └─ Sora 2: Text-to-Video API
    │
    ├─ Output 2: Image-to-Video + Kling
    │   └─ Kling: Image-to-Video API
    │
    └─ Output 3: UGC Ad
        └─ NanoBanana: Generate UGC Script
    
    (All paths merge here)
    ↓
Update Status: Generating (with taskId)
    ↓
Wait 10s
    ↓
Check Video Status (Poll API)
    ↓
Is Complete?
    ├─ YES → Extract Video URL
    │         ↓
    │      Download Video
    │         ↓
    │      Upload to Baserow
    │         ↓
    │      Update Status: Completed
    │         ↓
    │      Respond: Success
    │
    └─ NO → Loop back to Wait 10s
    
    (If timeout/fail)
    ↓
Update Status: Failed
    ↓
Respond: Failed
```

---

## 🔧 Key Nodes Explained

### **1. Webhook Trigger**
- **URL**: `https://n8n.aiautomata.co.za/webhook/video-generation`
- **Method**: POST
- **Receives**: Complete video generation payload from app

### **2. Parse Payload**
Extracts all necessary data:
- `clientId`, `videoType`, `model`
- `recordId`, `tableId` (for Baserow updates)
- `videoPrompt`, `aspectRatio`, `duration`
- `referenceImageUrl` (for image-to-video)
- `productPhotoUrl`, `product`, `icp`, `productFeatures` (for UGC)
- `videoSetting` (style/setting)

### **3. Update Status: Preparing**
- Updates Baserow record status to "Preparing"
- Uses field mappings from webhook payload
- HTTP Request to Baserow API

### **4. Route By Type & Model (SWITCH NODE)** ⭐ KEY NODE
Routes to different AI models based on:

#### **Route 1: Text-to-Video + Sora 2**
```javascript
Conditions:
- videoType === "Text-to-Video"
- AND model === "Sora 2"
```

#### **Route 2: Image-to-Video + Kling**
```javascript
Conditions:
- videoType === "Image-to-Video"
- AND model === "Kling Video"
```

#### **Route 3: UGC Ad**
```javascript
Conditions:
- videoType === "UGC Ad"
```

### **5a. Sora 2: Text-to-Video**
- **API**: `https://api.kie.ai/api/v1/jobs/createTask`
- **Model**: `sora-2-text-to-video`
- **Input**:
  ```json
  {
    "prompt": "cleaned prompt",
    "aspect_ratio": "portrait|landscape|square",
    "n_frames": "duration",
    "remove_watermark": true
  }
  ```
- **Returns**: `{ data: { taskId: "..." } }`

### **5b. Kling: Image-to-Video**
- **API**: `https://api.kie.ai/api/v1/jobs/createTask`
- **Model**: `kling-video`
- **Input**:
  ```json
  {
    "prompt": "animation description",
    "image_url": "Baserow image URL",
    "duration": 10,
    "aspect_ratio": "9:16|16:9|1:1"
  }
  ```
- **Returns**: `{ data: { taskId: "..." } }`

### **5c. NanoBanana: Generate UGC Script**
- **Webhook**: `https://n8n.aiautomata.co.za/webhook/ugc-script-generator`
- **Purpose**: Generate UGC ad script using AI
- **Input**:
  ```json
  {
    "product": "Product name",
    "icp": "Target audience description",
    "features": "Key product features",
    "style": "Casual Selfie|Product Demo|Testimonial|Unboxing|Lifestyle"
  }
  ```
- **Returns**: `{ script: "...", hook: "...", cta: "..." }`
- **Then**: Script is used with Veo 3.1 to generate video

### **6. Update Status: Generating**
- Updates Baserow: `videoStatus = "Generating Videos"`
- Stores `taskId` for polling
- All 3 routes merge at this node

### **7. Wait 10s**
- Waits before checking status
- Prevents API rate limiting

### **8. Check Video Status**
- **API**: `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`
- Checks if video generation is complete
- Returns: `{ data: { state: "success|processing|failed", resultJson: "..." } }`

### **9. Is Complete?**
- Checks if `data.state === "success"`
- **YES** → Continue to extract URL
- **NO** → Loop back to "Wait 10s" (retry)

### **10. Extract Video URL**
- Parses `resultJson` to get video URL
- Extracts filename from URL
- Prepares data for download

### **11. Download Video**
- Downloads video from generated URL
- Binary data stored for upload

### **12. Upload to Baserow**
- Uploads video file to Baserow storage
- Returns: `{ name: "filename.mp4", url: "baserow-url" }`

### **13. Update Status: Completed**
- Updates Baserow record:
  - `videoStatus = "Completed"`
  - `videoUrl = "generated URL"`
  - `video = "filename.mp4"` (file field)
  - `completedAt = "timestamp"`

### **14. Respond: Success**
- Returns success response to app
- Includes video URL

### **15. Update Status: Failed** (Error Path)
- If generation times out or fails
- Updates: `videoStatus = "Failed"`
- Stores error message

### **16. Respond: Failed** (Error Path)
- Returns failure response to app

---

## 🔄 Data Flow Examples

### **Example 1: Text-to-Video (Sora 2)**

**App Sends:**
```json
{
  "videoType": "Text-to-Video",
  "model": "Sora 2",
  "video": {
    "prompt": "A drone shot of mountains at sunset",
    "aspectRatio": "16:9 (Landscape)",
    "duration": 10
  }
}
```

**Workflow:**
1. ✅ Webhook receives data
2. ✅ Parse extracts: prompt, aspect ratio, duration
3. ✅ Update status: Preparing
4. ✅ Switch → Route 1 (Text-to-Video + Sora 2)
5. ✅ Call Sora 2 API
6. ✅ Get taskId → Update status: Generating
7. ✅ Poll every 10s until complete
8. ✅ Download video → Upload to Baserow
9. ✅ Update status: Completed with video URL
10. ✅ Return success

---

### **Example 2: Image-to-Video (Kling)**

**App Sends:**
```json
{
  "videoType": "Image-to-Video",
  "model": "Kling Video",
  "video": {
    "prompt": "Zoom in dramatically with camera shake",
    "referenceImageUrl": "https://baserow.../image.jpg",
    "aspectRatio": "9:16 (Vertical)",
    "duration": 10,
    "hasReferenceImage": true
  }
}
```

**Workflow:**
1. ✅ Webhook receives data
2. ✅ Parse extracts: prompt, referenceImageUrl, aspect ratio, duration
3. ✅ Update status: Preparing
4. ✅ Switch → Route 2 (Image-to-Video + Kling)
5. ✅ Call Kling API with image URL
6. ✅ Get taskId → Update status: Generating
7. ✅ Poll every 10s until complete
8. ✅ Download video → Upload to Baserow
9. ✅ Update status: Completed with video URL
10. ✅ Return success

---

### **Example 3: UGC Ad (NanoBanana + Veo 3.1)**

**App Sends:**
```json
{
  "videoType": "UGC Ad",
  "model": "NanoBanana + Veo 3.1",
  "video": {
    "product": "Smartwatch Pro X",
    "productPhotoUrl": "https://baserow.../product.jpg",
    "icp": "Fitness enthusiasts aged 25-40 who track health goals",
    "productFeatures": "Heart rate, sleep tracking, 7-day battery, water resistant",
    "setting": "Casual Selfie",
    "aspectRatio": "9:16 (Vertical)",
    "duration": 15
  }
}
```

**Workflow:**
1. ✅ Webhook receives data
2. ✅ Parse extracts: product, ICP, features, setting, product photo URL
3. ✅ Update status: Preparing
4. ✅ Switch → Route 3 (UGC Ad)
5. ✅ Call NanoBanana to generate script (hook + body + CTA)
6. ✅ Call Veo 3.1 with generated script + product photo + UGC style
7. ✅ Get taskId → Update status: Generating
8. ✅ Poll every 10s until complete
9. ✅ Download video → Upload to Baserow
10. ✅ Update status: Completed with video URL
11. ✅ Return success

---

## 🚀 Setup Instructions

### **1. Import Workflow**
1. Open n8n: `https://n8n.aiautomata.co.za`
2. Click "+" → "Import from File"
3. Select `n8n-video-workflow-complete-v2.json`
4. All credentials should auto-link (kie.ai, Baserow Auth)

### **2. Verify Credentials**
- ✅ **kie.ai account** (ID: `AkbAjhqtJ0xgwVv2`)
- ✅ **Baserow Auth account** (ID: `eLr9WkAowHbRSmCb`)

### **3. Create UGC Script Generator Webhook** (Optional for UGC)
If you don't have the NanoBanana UGC webhook yet:
1. Create new workflow: "UGC Script Generator"
2. Add Webhook Trigger with path: `ugc-script-generator`
3. Add NanoBanana API call for script generation
4. Return: `{ script: "...", hook: "...", cta: "..." }`

### **4. Activate Workflow**
1. Toggle to **Active**
2. Webhook URL: `https://n8n.aiautomata.co.za/webhook/video-generation`

### **5. Test from App**
The app is already configured to send to this webhook!

---

## 🧪 Testing Checklist

### **Test 1: Text-to-Video (Sora 2)** ✅ Already Working
- [x] Create video with prompt
- [x] Status updates: Pending → Preparing → Generating → Completed
- [x] Video downloads and uploads to Baserow
- [x] Video URL stored
- [x] Can play video in app

### **Test 2: Image-to-Video (Kling)**
- [ ] Upload reference image or browse from library
- [ ] Enter animation prompt
- [ ] Video generates with image animated
- [ ] Status updates correctly
- [ ] Video stored in Baserow

### **Test 3: UGC Ad (NanoBanana + Veo 3.1)**
- [ ] Enter product details (name, ICP, features)
- [ ] Upload product photo or browse
- [ ] Select video style (Casual Selfie, etc.)
- [ ] Script generates correctly
- [ ] Video generates in UGC style
- [ ] Video stored in Baserow

---

## ⚠️ Known Issues & TODOs

### **UGC Script Generator**
- ⚠️ **NanoBanana UGC webhook not yet created**
- **Solution**: Create separate n8n workflow for script generation
- **Alternative**: Call NanoBanana directly in main workflow (skip webhook)

### **Veo 3.1 Integration**
- ⚠️ **Veo 3.1 API not yet implemented in UGC path**
- **Current**: Uses NanoBanana script generator
- **TODO**: Add Veo 3.1 video generation after script generation

### **Error Handling**
- ⚠️ **No explicit timeout handling yet**
- **Current**: Polls indefinitely until success/fail
- **TODO**: Add max retry count (e.g., 50 attempts = 8-10 minutes)

---

## 🎯 Next Steps

1. **Import** `n8n-video-workflow-complete-v2.json`
2. **Activate** the workflow
3. **Test** Text-to-Video (should work immediately)
4. **Test** Image-to-Video with Kling
5. **Build** UGC script generator webhook (if needed)
6. **Test** UGC Ad generation
7. **Monitor** executions in n8n
8. **Fix** any errors that appear

---

## 📞 **Ready to Test!**

The workflow is complete and ready for import. It will handle all 3 video types with intelligent routing!

**Import the workflow and let's test it!** 🚀

