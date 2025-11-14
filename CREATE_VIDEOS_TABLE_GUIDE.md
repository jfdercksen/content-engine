# Step-by-Step Guide: Create Videos Table in Client Info Database

## 📋 Overview
This guide will help you manually create the Videos table in the **Client Info (233)** database in Baserow.

---

## 🎯 Quick Start

### **Step 1: Access Baserow**
1. Go to https://baserow.aiautomata.co.za
2. Login with your credentials
3. Navigate to **Client Info** database (ID: 233)

### **Step 2: Create Table**
1. Click **"+ Create table"**
2. Name it: **`Videos`**
3. Click **Create**
4. **Note the Table ID** (you'll see it in the URL)

---

## 🗂️ Create Fields (in order)

### **Field 1-10: Core Video Fields**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 1 | `video` | File | - |
| 2 | `videoUrl` | URL | - |
| 3 | `thumbnailUrl` | URL | - |
| 4 | `videoPrompt` | Long Text | Required: ✅ |
| 5 | `videoType` | Single Select | Required: ✅<br>Options: `Text-to-Video`, `Image-to-Video`, `Storyboard`, `Multi-Scene Process`, `UGC Ad`, `Social Post Video` |
| 6 | `videoStatus` | Single Select | Required: ✅<br>Options: `Pending`, `Preparing`, `Generating Scenes`, `Generating Images`, `Generating Videos`, `Processing Audio`, `Finalizing`, `Completed`, `Failed` |
| 7 | `model` | Single Select | Required: ✅<br>Options: `Sora 2`, `Veo 3.1`, `Veo 3.1 Fast`, `Kling Video`, `NanoBanana + Veo 3.1`, `fal.ai` |
| 8 | `clientId` | Text | Required: ✅ |
| 9 | `aspectRatio` | Single Select | Required: ✅<br>Options: `9:16 (Vertical)`, `16:9 (Landscape)`, `1:1 (Square)`, `4:5 (Portrait)` |
| 10 | `duration` | Number | Required: ✅<br>Decimal places: 0 |

---

### **Field 11-15: Video Configuration**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 11 | `nFrames` | Number | Decimal places: 0 |
| 12 | `removeWatermark` | Boolean | Default: true |
| 13 | `referenceImage` | File | - |
| 14 | `referenceImageUrl` | URL | - |
| 15 | `referenceVideo` | File | - |

---

### **Field 16-20: Reference Media**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 16 | `referenceVideoUrl` | URL | - |
| 17 | `styleReferenceImage` | File | - |
| 18 | `process` | Text | - |
| 19 | `processId` | Link to table | *Skip for now - add later if needed* |
| 20 | `backgroundMusicPrompt` | Long Text | - |

---

### **Field 21-30: Product & Process Info**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 21 | `musicTrack` | Link to table | *Skip for now - add later if needed* |
| 22 | `product` | Text | - |
| 23 | `productPhoto` | File | - |
| 24 | `productPhotoUrl` | URL | - |
| 25 | `icp` | Long Text | - |
| 26 | `productFeatures` | Long Text | - |
| 27 | `videoSetting` | Long Text | - |
| 28 | `platform` | Single Select | Options: `Facebook`, `Instagram`, `Twitter`, `LinkedIn`, `TikTok`, `YouTube` |
| 29 | `scenes` | Link to table | *Skip for now - add later if needed* |
| 30 | `sceneCount` | Number | Decimal places: 0 |

---

### **Field 31-40: Captions & Audio**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 31 | `useCaptions` | Boolean | - |
| 32 | `captionText` | Long Text | - |
| 33 | `captionFontStyle` | Text | - |
| 34 | `captionFontSize` | Text | - |
| 35 | `captionPosition` | Single Select | Options: `Top`, `Center`, `Bottom` |
| 36 | `useMusic` | Boolean | - |
| 37 | `useSoundFX` | Boolean | - |
| 38 | `rawVideoUrl` | URL | - |
| 39 | `processedVideoUrl` | URL | - |
| 40 | `socialMediaContent` | Link to table | *Will add after - need Social Media Content table* |

---

### **Field 41-48: Metadata & YouTube**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 41 | `contentIdea` | Link to table | *Will add after - need Content Ideas table* |
| 42 | `youtubeTitle` | Text | Max length: 80 |
| 43 | `youtubeHashtags` | Text | - |
| 44 | `youtubeVideoId` | Text | - |
| 45 | `taskId` | Text | - |
| 46 | `errorMessage` | Long Text | - |
| 47 | `metadata` | Long Text | - |
| 48 | `createdAt` | Date | Include time: ✅, Required: ✅ |

---

### **Field 49-50: Auto Timestamps**

| # | Field Name | Type | Settings |
|---|------------|------|----------|
| 49 | `updatedAt` | Last Modified | Timezone: UTC, Include time: ✅ |
| 50 | `completedAt` | Date | Include time: ✅ |

---

## 📝 After Creating the Table

### **Step 1: Note the Table ID**
Look at the URL in your browser:
```
https://baserow.aiautomata.co.za/database/233/table/XXXX
                                                      ^^^^
                                                   Table ID
```

### **Step 2: Get All Field IDs**
1. Click the dropdown arrow next to any field name
2. Click "Field settings"
3. The Field ID will be in the URL or visible in developer tools

**Or use this trick:**
1. Make a test API call to get the table structure:
```bash
curl https://baserow.aiautomata.co.za/api/database/fields/table/YOUR_TABLE_ID/ \
  -H "Authorization: Token SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1"
```

### **Step 3: Document Field Mappings**
Create a JSON object with all field IDs:
```json
{
  "videos": {
    "video": "FIELD_ID_1",
    "videoUrl": "FIELD_ID_2",
    "thumbnailUrl": "FIELD_ID_3",
    ...
  }
}
```

---

## 🚀 Simpler Alternative: Minimal MVP Table

If you want to **test quickly**, create just these **essential fields first**:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| `video` | File | ❌ | - |
| `videoUrl` | URL | ❌ | - |
| `videoPrompt` | Long Text | ✅ | - |
| `videoType` | Single Select | ✅ | `Text-to-Video`, `Image-to-Video`, `UGC Ad` |
| `videoStatus` | Single Select | ✅ | `Pending`, `Generating Videos`, `Completed`, `Failed` |
| `model` | Single Select | ✅ | `Sora 2`, `Veo 3.1` |
| `clientId` | Text | ✅ | - |
| `aspectRatio` | Single Select | ✅ | `9:16 (Vertical)`, `16:9 (Landscape)`, `1:1 (Square)` |
| `duration` | Number | ✅ | Decimals: 0 |
| `createdAt` | Date | ✅ | Include time: ✅ |
| `updatedAt` | Last Modified | ✅ | Include time: ✅ |

**Total: 11 fields** (much faster to create!)

You can always add more fields later as needed.

---

## ✅ Verification

After creating the table, test it:

1. **Manually create a test record** in Baserow
2. **Note down the Table ID and Field IDs**
3. **Update the configuration** in your app
4. **Run the API tests**

---

## 🔧 Next Steps

Once you have:
- ✅ Table created
- ✅ Table ID noted
- ✅ Field IDs documented

Let me know and I'll:
1. Update all client configurations
2. Update the field mappings
3. Test the API again

---

**Which approach do you prefer?**

**A)** Create the **full 50-field table** now (more complete, takes longer)

**B)** Create the **minimal 11-field MVP table** now (faster, test immediately, add fields later)

**C)** Try to fix the script and create it programmatically

Let me know and I'll help you through it! 🚀

