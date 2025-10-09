# Blog Workflow Build Guide
## Step-by-Step Instructions for Building the n8n Workflow

---

## 🎯 **Current Status**

✅ **Frontend Application**: Blog request form created  
✅ **API Endpoint**: `/api/blog/request` created  
✅ **Baserow Tables**: All 3 tables created and accessible  
✅ **Environment Variables**: Configured in `.env.local`  
🔄 **n8n Workflow**: Basic webhook exists, needs nodes added  

---

## 🚀 **Phase 1: Test the Frontend (Do This First)**

### **Step 1: Test the Blog Form**
1. **Start your Next.js application**:
   ```bash
   npm run dev
   ```

2. **Navigate to the blog page**:
   ```
   http://localhost:3000/blog
   ```

3. **Test the form**:
   - Select "Text Input"
   - Enter: "I want to write about the benefits of automation in business management"
   - Click "Create Blog Post"

4. **Expected Result**: You should see an error (since n8n workflow isn't complete yet), but the form should work

---

## 🔧 **Phase 2: Build the n8n Workflow (Step by Step)**

### **Step 2: Add the Process Input Node**

1. **In your n8n workflow**:
   - Add a **Code Node** after the webhook
   - Name it: `Process Input`
   - Copy the code from `n8n-blog-workflow-nodes.json` (Process Input node)

2. **Connect the nodes**:
   - Webhook → Process Input

3. **Test**: Execute the workflow to make sure it processes the input correctly

### **Step 3: Add the Baserow Storage Node**

1. **Add an HTTP Request Node**:
   - Name it: `Store in Baserow`
   - Configure it to POST to your Blog_Requests table (ID: 867)
   - Use the configuration from `n8n-blog-workflow-nodes.json`

2. **Connect the nodes**:
   - Process Input → Store in Baserow

3. **Test**: Execute the workflow to make sure it stores data in Baserow

### **Step 4: Add the Response Node**

1. **Add a Respond to Webhook Node**:
   - Name it: `Response`
   - Configure it to return a JSON response
   - Use the configuration from `n8n-blog-workflow-nodes.json`

2. **Connect the nodes**:
   - Store in Baserow → Response

3. **Test**: Execute the workflow to make sure it returns a proper response

---

## 🧪 **Phase 3: Test the Complete Flow**

### **Step 5: Test End-to-End**

1. **Make sure your n8n workflow is active**

2. **Test from the frontend**:
   - Go to `http://localhost:3000/blog`
   - Submit a blog request
   - Check if you get a success response

3. **Verify in Baserow**:
   - Check your Blog_Requests table (ID: 867)
   - You should see a new record with your test data

---

## 🔧 **Phase 4: Add Advanced Features (Later)**

Once the basic workflow is working, we can add:

1. **Keyword Research Node** (Serper API)
2. **AI Content Generation Node** (OpenAI/Anthropic)
3. **SEO Optimization Node**
4. **Blog Post Storage Node** (Blog_Posts table)
5. **Error Handling Nodes**

---

## 📋 **Quick Reference**

### **Table IDs**:
- Blog_Requests: `867`
- Blog_Posts: `868`
- Keyword_Research: `869`

### **Webhook URL**:
- `https://n8n.aiautomata.co.za/webhook/blog-creation-mvp`

### **Environment Variables**:
- `N8N_BLOG_WORKFLOW_WEBHOOK_URL`
- `BASEROW_MODERN_MANAGEMENT_BLOG_REQUESTS_TABLE_ID=867`

---

## 🎯 **Next Steps**

1. **Test the frontend form** first
2. **Add the Process Input node** to n8n
3. **Add the Baserow storage node**
4. **Add the response node**
5. **Test the complete flow**

**Ready to start? Let's begin with testing the frontend form!** 🚀

