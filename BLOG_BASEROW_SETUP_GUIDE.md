# Blog Workflow Baserow Setup Guide
## Manual Table Creation for Modern Management

---

## 🎯 **Overview**

This guide will walk you through manually creating the Baserow tables needed for the blog workflow. We'll create 3 new tables in the Modern Management database (ID: 176).

**Database**: Modern Management (ID: 176)  
**Token**: `SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1`  
**Base URL**: `https://baserow.aiautomata.co.za`

---

## 📋 **Table 1: Blog_Requests**

### **Purpose**: Track incoming blog requests and their processing status

### **Step-by-Step Creation**:

1. **Navigate to Baserow**:
   - Go to: `https://baserow.aiautomata.co.za`
   - Open the Modern Management database
   - Click "Add Table" or "+" button

2. **Table Settings**:
   - **Table Name**: `Blog_Requests`
   - **Description**: `Track incoming blog requests and their processing status`

3. **Create the following fields**:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Blog Request ID | Auto number | Auto-generated unique ID |
| Input Type | Single select | Options: `text`, `voice_note`, `url` |
| Original Content | Long text | Required field |
| Processed Content | Long text | Optional |
| Submission Timestamp | Created time | Auto-generated |
| Status | Single select | Options: `submitted`, `processing`, `keyword_research`, `content_created`, `seo_optimized`, `completed`, `failed` |
| Workflow Execution ID | Single line text | Optional |
| Selected Keyword | Single line text | Optional |
| Keyword Data | Long text | JSON data from keyword research |
| Content Length | Number | Optional |
| Error Message | Long text | Optional |
| Completion Timestamp | Date | Optional |
| Blog Post ID | Link to another table | Link to Blog_Posts table (create after) |

### **Field Configuration Details**:

#### **Input Type (Single Select)**:
- `text` (Blue)
- `voice_note` (Green) 
- `url` (Purple)

#### **Status (Single Select)**:
- `submitted` (Blue)
- `processing` (Yellow)
- `keyword_research` (Orange)
- `content_created` (Green)
- `seo_optimized` (Purple)
- `completed` (Green)
- `failed` (Red)

---

## 📋 **Table 2: Blog_Posts**

### **Purpose**: Store all blog post data and metadata

### **Step-by-Step Creation**:

1. **Add New Table**:
   - Click "Add Table" or "+" button
   - **Table Name**: `Blog_Posts`
   - **Description**: `Store all blog post data and metadata`

2. **Create the following fields**:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Blog Post ID | Auto number | Auto-generated unique ID |
| Title | Single line text | Required field |
| Slug | Single line text | Auto-generated from title |
| Content | Long text | Full blog post content |
| Meta Title | Single line text | SEO meta title |
| Meta Description | Long text | SEO meta description |
| Focus Keyword | Single line text | Primary keyword |
| Secondary Keywords | Multiple select | Additional keywords |
| Status | Single select | Options: `draft`, `processing`, `review`, `published`, `archived` |
| SEO Score | Number | 0-100 with 1 decimal place |
| Word Count | Number | Article word count |
| Readability Score | Number | 0-100 with 1 decimal place |
| Created At | Created time | Auto-generated |
| Updated At | Last modified time | Auto-generated |
| Scheduled Publish Date | Date | Optional |
| Author ID | Single line text | Optional |
| Featured Image Prompt | Long text | AI image generation prompt |
| Alt Texts | Long text | Image alt text descriptions |
| Internal Links | Long text | JSON array of internal links |
| External Sources | Long text | JSON array of external sources |
| Category | Long text | Blog category |
| Tags | Long text | Blog tags (comma-separated) |
| Processing Log | Long text | Workflow execution log |

### **Field Configuration Details**:

#### **Status (Single Select)**:
- `draft` (Orange)
- `processing` (Blue)
- `review` (Yellow)
- `published` (Green)
- `archived` (Gray)

#### **Category & Tags (Long Text)**:
- **Category**: Free text field for blog category
- **Tags**: Comma-separated tags (e.g., "business, management, strategy")

#### **SEO Score & Readability Score**:
- Set as Number fields
- Decimal places: 1
- Min value: 0
- Max value: 100

---

## 📋 **Table 3: Keyword_Research**

### **Purpose**: Store keyword research data and metrics

### **Step-by-Step Creation**:

1. **Add New Table**:
   - Click "Add Table" or "+" button
   - **Table Name**: `Keyword_Research`
   - **Description**: `Store keyword research data and metrics`

2. **Create the following fields**:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Blog Request ID | Link to another table | Link to Blog_Requests table |
| Keyword | Single line text | The keyword being researched |
| Search Volume | Number | Monthly search volume |
| Keyword Difficulty | Number | 0-100 with 1 decimal place |
| Search Intent | Single select | Options: `informational`, `commercial`, `navigational`, `transactional` |
| CPC | Number | Cost per click with 2 decimal places |
| Competition Level | Single select | Options: `low`, `medium`, `high` |
| Related Keywords | Long text | JSON array of related keywords |
| SERP Features | Multiple select | SERP features present |
| Opportunity Score | Number | Calculated score with 1 decimal place |
| Research Timestamp | Created time | Auto-generated |
| Is Selected | Checkbox | Whether this keyword was selected |

### **Field Configuration Details**:

#### **Search Intent (Single Select)**:
- `informational` (Blue)
- `commercial` (Green)
- `navigational` (Purple)
- `transactional` (Orange)

#### **Competition Level (Single Select)**:
- `low` (Green)
- `medium` (Yellow)
- `high` (Red)

#### **Numeric Fields**:
- **Keyword Difficulty**: Number, 1 decimal place, 0-100
- **CPC**: Number, 2 decimal places
- **Opportunity Score**: Number, 1 decimal place

---

## 🔗 **Link Field Setup**

### **Important**: Set up links in this order:

1. **Blog_Requests → Blog_Posts**: Link to Blog_Posts table
2. **Keyword_Research → Blog_Requests**: Link to Blog_Requests table

### **Link Configuration**:
- For each link field, select the target table
- Enable "Allow linking to existing rows"
- Set appropriate link display fields (usually ID or Name)

---

## 📊 **After Creation - Get Table IDs**

Once all tables are created, you'll need to get the table IDs for the n8n workflow:

### **Method 1: From URL**
When viewing each table, the URL will show:
`https://baserow.aiautomata.co.za/database/176/table/[TABLE_ID]`

### **Method 2: API Call**
```bash
curl -H "Authorization: Token SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1" \
     "https://baserow.aiautomata.co.za/api/database/tables/database/176/"
```

### **Method 3: Table Settings**
- Click on table name → Table Settings
- Copy the Table ID from the URL or settings page

---

## 🧪 **Test Data Setup**

### **Create Test Blog Request**:

1. **In Blog_Requests table**:
   - Input Type: `text`
   - Original Content: `I want to write about the benefits of automation in business management`
   - Status: `submitted`

2. **Verify the record was created**:
   - Check that all fields are populated correctly
   - Note the record ID for testing

---

## 🔧 **n8n Workflow Configuration**

After creating the tables, update your n8n workflow with these table IDs:

```json
{
  "blogRequests": "TABLE_ID_HERE",
  "blogPosts": "TABLE_ID_HERE", 
  "keywordResearch": "TABLE_ID_HERE"
}
```

---

## ✅ **Validation Checklist**

- [ ] Blog_Requests table created with all 15 fields
- [ ] Blog_Posts table created with all 24 fields
- [ ] Keyword_Research table created with all 13 fields
- [ ] All link fields properly configured
- [ ] Single select options configured with colors
- [ ] Number fields have correct decimal places
- [ ] Test record created in Blog_Requests
- [ ] Table IDs collected for n8n workflow
- [ ] All tables accessible via API

---

## 🚀 **Next Steps**

1. **Complete table creation** following this guide
2. **Collect table IDs** for n8n workflow
3. **Create n8n workflow** using the table IDs
4. **Test the complete flow** with sample data
5. **Integrate frontend** blog request form

---

## 📞 **Support**

If you encounter any issues:
1. Check field types match exactly
2. Verify link table references
3. Ensure proper permissions on database
4. Test API access with provided token

**Ready to start creating the tables?** 🎯
