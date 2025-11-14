# 🎬 Complete UGC Video Workflow with Agents

## ✅ **Workflow Built: `n8n-video-workflow-ugc-complete.json`**

This workflow integrates **all video generation types** with **LangChain agents** for intelligent prompt generation.

---

## 📊 **Workflow Structure**

```
Webhook Trigger
    ↓
Parse Payload
    ↓
Update Status: Preparing
    ↓
Route By Type & Model (SWITCH)
    ├─ Route 1: Text-to-Video + Sora 2
    │   └─ Sora 2: Text-to-Video API
    │       ↓
    │   Store Sora TaskId
    │       ↓
    │   Update Status: Generating Sora
    │       ↓
    │   [Poll Loop: Wait 10s → Check Status → Complete?]
    │
    └─ Route 2: UGC Ad
        └─ Veo Image Prompt Agent (LangChain)
            ↓
        NanoBanana: Generate Image (person holding product)
            ↓
        [Poll Loop: Wait → Check → Complete?]
            ↓
        Analyze Generated Image (OpenAI Vision)
            ↓
        UGC Model Switch
            ├─ Veo 3.1 Path
            │   └─ Veo Video Prompt Agent (LangChain)
            │       ↓
            │   Veo 3.1: Generate Video
            │       ↓
            │   Store Veo TaskId
            │       ↓
            │   Update Status: Generating Veo
            │       ↓
            │   [Poll Loop: Wait 10s → Check Veo Status → Complete?]
            │
            └─ Sora 2 Path
                └─ Sora Video Prompt Agent (LangChain)
                    ↓
                Sora 2: Generate UGC Video
                    ↓
                Store Sora TaskId
                    ↓
                Update Status: Generating Sora
                    ↓
                [Poll Loop: Wait 10s → Check Sora Status → Complete?]

[All paths merge here]
    ↓
Extract Video URL (handles both Veo & Sora formats)
    ↓
Download Video
    ↓
Upload to Baserow
    ↓
Update Status: Completed
    ↓
Respond: Success
```

---

## 🤖 **LangChain Agents Included**

### **1. Veo Image Prompt Agent**
- **Purpose**: Generate detailed image prompt for NanoBanana
- **Input**: Product name, Video Setting
- **Output**: Hyper-realistic UGC photography prompt
- **System Prompt**: Expert UGC photography prompt generator with guidelines for human realism, product accuracy, composition, lighting, authentic details

### **2. Veo Video Prompt Agent**
- **Purpose**: Generate video prompt for Veo 3.1
- **Input**: Product, ICP, Features, Setting, Reference Image Description
- **Output**: 8-second UGC selfie video prompt
- **System Prompt**: Advanced UGC video creator optimizing for Veo 3 with selfie-style framing, visual consistency, authentic dialogue

### **3. Sora Video Prompt Agent**
- **Purpose**: Generate video prompt for Sora 2
- **Input**: Product, ICP, Features, Setting, Reference Image Description
- **Output**: 10-second UGC selfie video prompt
- **System Prompt**: Advanced UGC video creator optimizing for Sora 2 with similar guidelines but 10-second duration

---

## 🔄 **Complete UGC Ad Flow**

### **Step 1: Image Generation**
1. **Veo Image Prompt Agent** creates detailed prompt for NanoBanana
2. **NanoBanana** generates image of person holding product (9:16, PNG)
3. **Poll** until image is complete (Wait 10s → Check Status → Loop if not done)

### **Step 2: Image Analysis**
4. **OpenAI Vision (GPT-4o)** analyzes the generated image
   - Describes environment, human, and what they're holding
   - Output used as "Reference Image Description"

### **Step 3: Video Prompt Generation**
5. **Model Switch** routes based on selected model:
   - **Veo 3.1** → Veo Video Prompt Agent
   - **Sora 2** → Sora Video Prompt Agent
6. **Agent** generates video prompt using:
   - Product info
   - ICP (Ideal Customer Profile)
   - Product features
   - Video setting/style
   - Reference image description

### **Step 4: Video Generation**
7. **Generate Video**:
   - **Veo 3.1**: `POST /api/v1/veo/generate` with prompt + generated image URL
   - **Sora 2**: `POST /api/v1/jobs/createTask` with `sora-2-image-to-video` model
8. **Store TaskId** for polling
9. **Update Baserow** status to "Generating Videos"

### **Step 5: Polling & Completion**
10. **Poll Loop**: Wait 10s → Check Status → If complete, continue; else loop
11. **Extract Video URL** (handles both Veo & Sora response formats)
12. **Download Video** from generated URL
13. **Upload to Baserow** file storage
14. **Update Baserow** with:
    - `videoStatus = "Completed"`
    - `videoUrl = "generated URL"`
    - `video = "filename.mp4"`
    - `completedAt = "timestamp"`
15. **Respond** with success

---

## 📋 **Key Features**

### **✅ Intelligent Routing**
- Switch node routes Text-to-Video vs UGC Ad
- UGC Model Switch routes Veo 3.1 vs Sora 2

### **✅ Agent-Powered Prompts**
- LangChain agents generate context-aware prompts
- System prompts optimized for each model
- Reference image analysis for consistency

### **✅ Robust Polling**
- Separate polling loops for Veo and Sora
- TaskId stored in Set nodes for reliable reference
- Handles both response formats

### **✅ Baserow Integration**
- All status updates stored in Baserow
- Video files uploaded to Baserow storage
- Field mappings from webhook payload

---

## 🧪 **Testing Checklist**

### **Test 1: Text-to-Video (Sora 2)**
- [ ] Create video with prompt
- [ ] Status updates: Pending → Preparing → Generating → Completed
- [ ] Video downloads and uploads to Baserow
- [ ] Video URL stored correctly

### **Test 2: UGC Ad (Veo 3.1)**
- [ ] Enter product details (name, ICP, features, setting)
- [ ] Upload or browse product photo
- [ ] Veo Image Prompt Agent generates image prompt
- [ ] NanoBanana generates image with person holding product
- [ ] OpenAI analyzes generated image
- [ ] Veo Video Prompt Agent generates video prompt
- [ ] Veo 3.1 generates video
- [ ] Video completes and stores in Baserow

### **Test 3: UGC Ad (Sora 2)**
- [ ] Same as Test 2, but with Sora 2 model
- [ ] Sora Video Prompt Agent generates video prompt
- [ ] Sora 2 generates video (10 seconds)
- [ ] Video completes and stores in Baserow

---

## ⚙️ **Configuration Required**

### **Credentials**
- ✅ **kie.ai account** (ID: `AkbAjhqtJ0xgwVv2`) - For NanoBanana, Sora, Veo APIs
- ✅ **Baserow Auth account** (ID: `eLr9WkAowHbRSmCb`) - For Baserow updates
- ⚠️ **OpenAI API** - For image analysis (GPT-4o Vision)
  - Need to configure OpenAI credentials in n8n

### **Model IDs**
- OpenAI Vision: `chatgpt-4o-latest` (configured in Analyze Image node)

---

## 📝 **Notes**

1. **Google Sheets Removed**: The workflow now uses Baserow exclusively (no Google Sheets integration)

2. **TaskId Storage**: TaskIds are stored in Set nodes (`Store Veo TaskId`, `Store Sora TaskId`) for reliable polling

3. **Response Format Handling**: Extract Video URL node handles both:
   - Veo: `data.response.resultUrls[0]`
   - Sora: `JSON.parse(data.resultJson).resultUrls[0]`

4. **Error Handling**: Failed/timeout paths update Baserow with error status

---

## 🚀 **Ready to Import!**

**File**: `n8n-video-workflow-ugc-complete.json`

**Import Steps**:
1. Open n8n: https://n8n.aiautomata.co.za
2. Import the JSON file
3. Configure OpenAI credentials for image analysis
4. Activate workflow
5. Test with UGC Ad generation!

---

## 🎯 **What's Next?**

1. **Import** the workflow
2. **Configure** OpenAI credentials
3. **Test** Text-to-Video (should work immediately)
4. **Test** UGC Ad with Veo 3.1
5. **Test** UGC Ad with Sora 2
6. **Monitor** executions and fix any errors

**The complete workflow is ready!** 🎉

