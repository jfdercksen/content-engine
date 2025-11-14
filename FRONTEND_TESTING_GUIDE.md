# Frontend Testing Guide - Video Studio

## 🎯 What We Just Built

### **New Pages & Components:**

1. **`/dashboard/[clientId]/videos`** - Videos dashboard page
2. **`VideoGenerationForm.tsx`** - Video creation form component

---

## 🧪 How to Test the Frontend

### **Step 1: Open the Videos Dashboard**

Navigate to:
```
http://localhost:3000/dashboard/modern-management/videos
```

**Expected:**
- ✅ Page loads without errors
- ✅ Shows "Video Studio" header
- ✅ Shows filter controls (Status, Type)
- ✅ Shows existing videos (if any)
- ✅ "Generate Video" button visible

---

### **Step 2: Test Video Creation Form**

1. Click **"Generate Video"** button
2. Form modal should appear

**Expected:**
- ✅ Modal opens with form
- ✅ Form has all fields:
  - Video Type selector
  - AI Model selector (changes based on video type)
  - Video Prompt textarea
  - Platform selector (optional)
  - Aspect Ratio selector (auto-sets when platform selected)
  - Duration input
  - Captions checkbox with conditional fields
- ✅ "Generate Video" and "Cancel" buttons visible

---

### **Step 3: Create a Simple Text-to-Video**

Fill in the form:
- **Video Type**: Text-to-Video
- **AI Model**: Sora 2 (auto-selected)
- **Prompt**: "A cinematic drone shot flying over a misty mountain range at sunrise"
- **Platform**: YouTube (this will auto-set aspect ratio to 16:9)
- **Duration**: 10

Click **"Generate Video"**

**Expected:**
- ✅ Button shows "Generating..." with spinner
- ✅ Alert: "Video generation started! This may take a few minutes."
- ✅ Modal closes
- ✅ New video card appears in grid
- ✅ Video shows status "Pending"

---

### **Step 4: Test Platform Auto-Configuration**

Create another video:
- **Platform**: Instagram
- **Expected**: Aspect ratio auto-changes to 9:16 (Vertical)

Create another video:
- **Platform**: TikTok  
- **Expected**: Aspect ratio auto-changes to 9:16 (Vertical)

---

### **Step 5: Test UGC Ad Creation**

Fill in the form:
- **Video Type**: UGC Ad
- **AI Model**: Veo 3.1 (auto-selected)
- **Prompt**: "A young woman showing her amazing curly hair transformation"
- **Platform**: Instagram
- **Duration**: 8
- **Captions**: ✅ Enabled
  - **Caption Text**: "Best product ever! 😍"
  - **Position**: Bottom

Click **"Generate Video"**

**Expected:**
- ✅ UGC Ad video created with caption settings
- ✅ Shows platform badge

---

### **Step 6: Test Filtering**

1. **Filter by Status**: Select "Completed"
   - Expected: Only shows completed videos

2. **Filter by Type**: Select "UGC Ad"
   - Expected: Only shows UGC Ad videos

3. **Reset filters**: Select "All Statuses" and "All Types"
   - Expected: Shows all videos

---

### **Step 7: Test Video Actions**

For a completed video:
- Click **"Open"** button
  - Expected: Video opens in new tab

For any video:
- Click **trash icon** (delete)
  - Expected: Confirmation dialog appears
  - Click OK
  - Expected: Video is deleted and removed from grid

---

### **Step 8: Test Real-Time Updates**

1. Create a video
2. Wait 10 seconds
3. Watch the video list

**Expected:**
- ✅ Page auto-refreshes every 10 seconds
- ✅ Status updates show automatically (when n8n updates them)

---

## 🎨 UI Features to Verify

### **Status Badges:**
- **Pending**: Gray badge with clock icon
- **Generating**: Yellow badge with spinner
- **Completed**: Green badge with checkmark
- **Failed**: Red badge with alert icon

### **Video Cards Show:**
- ✅ Thumbnail (or placeholder icon)
- ✅ Video prompt (truncated)
- ✅ Video type and model
- ✅ Duration and aspect ratio
- ✅ Platform (if set)
- ✅ Creation date
- ✅ Actions (Open, Delete)

### **Form Features:**
- ✅ Model selector updates based on video type
- ✅ Platform selector auto-sets aspect ratio
- ✅ Character counter for prompt
- ✅ Conditional caption fields
- ✅ Validation messages
- ✅ Loading states

---

## ✅ Test Checklist

- [ ] Videos dashboard page loads
- [ ] "Generate Video" button opens form
- [ ] Can create text-to-video
- [ ] Can create UGC Ad
- [ ] Platform selection auto-sets aspect ratio
- [ ] Captions checkbox shows/hides fields
- [ ] Form validates correctly
- [ ] Videos appear in grid after creation
- [ ] Can filter by status
- [ ] Can filter by type
- [ ] Can view completed videos
- [ ] Can delete videos
- [ ] Page auto-refreshes every 10 seconds
- [ ] Error messages display correctly
- [ ] All UI elements render properly

---

## 🐛 Troubleshooting

### **Modal doesn't open**
- Check console for errors
- Ensure form component imported correctly

### **Videos don't appear**
- Check API response in Network tab
- Verify clientId is correct
- Check browser console for errors

### **Can't submit form**
- Check validation errors
- Ensure all required fields filled
- Check console for error messages

---

**Ready to test? Navigate to:** `http://localhost:3000/dashboard/modern-management/videos`

🎬 **Start generating videos!**

