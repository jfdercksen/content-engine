# Blog Post Workflow Implementation Guide
## Step-by-Step Instructions for Building MVP Blog Creation System

---

## 📋 **Overview**

This guide will walk you through building a comprehensive blog post creation workflow using n8n, Baserow, and AI agents. We'll start with an MVP and build up to the full system.

**Target Architecture**: Multi-client blog post creation with SEO optimization, keyword research, and automated content generation.

---

## 🎯 **Phase 1: MVP Foundation (Weeks 1-2)**

### **Step 1: Baserow Database Schema Design**

#### **1.1 Create Blog_Posts Table**

**Table Name**: `Blog_Posts`
**Purpose**: Store all blog post data and metadata

```sql
-- Field Structure for Blog_Posts Table
Fields to create in Baserow:

1. id (Auto Number) - Primary key
2. title (Single line text) - Required
4. slug (Single line text) - Auto-generated from title
5. content (Long text) - Full blog post content
6. meta_title (Single line text) - SEO meta title
7. meta_description (Long text) - SEO meta description
8. focus_keyword (Single line text) - Primary keyword
9. secondary_keywords (Multiple select) - Additional keywords
10. status (Single select) - Options: draft, processing, review, published
11. seo_score (Number) - SEO optimization score (0-100)
12. word_count (Number) - Article word count
13. readability_score (Number) - Readability score
14. created_at (Created time) - Auto-generated
15. updated_at (Last modified time) - Auto-generated
16. scheduled_publish_date (Date) - Optional publish date
17. author_id (Link to another table: Users) - Optional
18. featured_image_prompt (Long text) - AI image generation prompt
19. alt_texts (Long text) - Image alt text descriptions
20. internal_links (Long text) - JSON array of internal links
21. external_sources (Long text) - JSON array of external sources
22. category (Single select) - Blog category
23. tags (Multiple select) - Blog tags
24. processing_log (Long text) - Workflow execution log
```

#### **1.2 Create Blog_Requests Table**

**Table Name**: `Blog_Requests`
**Purpose**: Track incoming blog requests and their processing status

```sql
-- Field Structure for Blog_Requests Table
Fields to create in Baserow:

1. id (Auto Number) - Primary key
2. input_type (Single select) - Options: text, voice_note, url
3. original_content (Long text) - Raw input content
4. processed_content (Long text) - Cleaned/processed content
5. submission_timestamp (Created time) - Auto-generated
8. status (Single select) - Options: submitted, processing, keyword_research, content_created, seo_optimized, completed, failed
9. workflow_execution_id (Single line text) - n8n execution ID
10. selected_keyword (Single line text) - User-selected or auto-selected keyword
11. keyword_data (Long text) - JSON of keyword research results
12. content_length (Number) - Character count of processed content
13. error_message (Long text) - Error details if failed
14. completion_timestamp (Date) - When workflow completed
15. blog_post_id (Link to another table: Blog_Posts) - Link to created post
```

#### **1.3 Create Keyword_Research Table**

**Table Name**: `Keyword_Research`
**Purpose**: Store keyword research data and metrics

```sql
-- Field Structure for Keyword_Research Table
Fields to create in Baserow:

1. id (Auto Number) - Primary key
2. blog_request_id (Link to another table: Blog_Requests) - Required
3. keyword (Single line text) - The keyword
4. search_volume (Number) - Monthly search volume
5. keyword_difficulty (Number) - Difficulty score (0-100)
6. search_intent (Single select) - Options: informational, commercial, navigational, transactional
7. cpc (Number) - Cost per click
8. competition_level (Single select) - Options: low, medium, high
9. related_keywords (Long text) - JSON array of related keywords
10. serp_features (Multiple select) - SERP features present
11. opportunity_score (Number) - Calculated opportunity score
12. research_timestamp (Created time) - Auto-generated
13. is_selected (Checkbox) - Whether this keyword was selected
```

#### **1.4 Update Clients Table (if not exists)**

**Table Name**: `Clients`
**Purpose**: Client information and configuration

```sql
-- Additional fields to add to existing Clients table:
Fields to add to Baserow:

1. blog_content_guidelines (Long text) - Blog-specific guidelines
2. blog_tone_preference (Single select) - Options: professional, casual, technical, friendly
3. blog_categories (Multiple select) - Preferred blog categories
4. blog_tags (Multiple select) - Preferred blog tags
5. blog_seo_preferences (Long text) - SEO preferences and requirements
6. blog_target_audience (Long text) - Blog-specific target audience
7. blog_competitors (Long text) - Competitor websites for analysis
8. blog_content_calendar (Long text) - Content calendar preferences
9. blog_approval_workflow (Single select) - Options: auto_publish, review_required, client_approval
10. blog_notification_email (Email) - Email for blog notifications
```

### **Step 2: Frontend Integration Setup**

#### **2.1 Create Blog Request Form Component**

**File**: `src/components/forms/BlogRequestForm.tsx`

```typescript
import React, { useState } from 'react';
import { useClientConfig } from '@/hooks/useClientConfig';

interface BlogRequestFormProps {
  clientId: string;
  onSubmit: (data: BlogRequestData) => void;
}

interface BlogRequestData {
  input_type: 'text' | 'voice_note' | 'url';
  content: string;
  submission_timestamp: string;
}

export const BlogRequestForm: React.FC<BlogRequestFormProps> = ({ clientId, onSubmit }) => {
  const [inputType, setInputType] = useState<'text' | 'voice_note' | 'url'>('text');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const blogRequestData: BlogRequestData = {
      input_type: inputType,
      content: content,
      submission_timestamp: new Date().toISOString()
    };

    try {
      await onSubmit(blogRequestData);
      setContent('');
    } catch (error) {
      console.error('Blog request submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Input Type</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="text"
              checked={inputType === 'text'}
              onChange={(e) => setInputType(e.target.value as 'text')}
              className="mr-2"
            />
            Text Input
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="voice_note"
              checked={inputType === 'voice_note'}
              onChange={(e) => setInputType(e.target.value as 'voice_note')}
              className="mr-2"
            />
            Voice Note
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="url"
              checked={inputType === 'url'}
              onChange={(e) => setInputType(e.target.value as 'url')}
              className="mr-2"
            />
            URL
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Content</label>
        {inputType === 'text' && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your blog post idea, topic, or key points..."
            className="w-full p-3 border rounded-lg h-32"
            required
          />
        )}
        {inputType === 'voice_note' && (
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              // Handle voice file upload
              const file = e.target.files?.[0];
              if (file) {
                // Convert to base64 or upload to server
                setContent(file.name); // Placeholder
              }
            }}
            className="w-full p-3 border rounded-lg"
            required
          />
        )}
        {inputType === 'url' && (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com/article-to-use-as-reference"
            className="w-full p-3 border rounded-lg"
            required
          />
        )}
      </div>


      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating Blog Post...' : 'Create Blog Post'}
      </button>
    </form>
  );
};
```

#### **2.2 Create Blog Request API Endpoint**

**File**: `src/app/api/blog/request/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createBaserowRecord } from '@/lib/baserow/baserow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { input_type, content, submission_timestamp } = body;
    
    if (!input_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create blog request record in Baserow
    const blogRequestData = {
      input_type: input_type,
      original_content: content,
      submission_timestamp: submission_timestamp,
      status: 'submitted',
      workflow_execution_id: null,
      content_length: content.length
    };

    const record = await createBaserowRecord('Blog_Requests', blogRequestData);

    // Trigger n8n workflow
    const n8nWebhookUrl = process.env.N8N_BLOG_WORKFLOW_WEBHOOK_URL;
    
    if (n8nWebhookUrl) {
      const n8nPayload = {
        ...body,
        baserow_record_id: record.id,
        webhook_timestamp: new Date().toISOString()
      };

      // Fire and forget to n8n
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload)
      }).catch(error => {
        console.error('Failed to trigger n8n workflow:', error);
      });
    }

    return NextResponse.json({
      success: true,
      record_id: record.id,
      message: 'Blog request submitted successfully'
    });

  } catch (error) {
    console.error('Blog request creation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Step 3: n8n Workflow MVP Setup**

#### **3.1 Create Basic Blog Workflow**

**Workflow Name**: `Blog Post Creation MVP`
**Webhook URL**: `https://n8n.aiautomata.co.za/webhook/blog-creation-mvp`

**Node Structure**:

1. **Webhook Trigger**
   - Path: `/blog-creation-mvp`
   - HTTP Method: POST
   - Expected payload matches BlogRequestForm

2. **Input Type Router (Switch Node)**
   - Route based on `{{ $json.input_type }}`
   - Output 0: text processing
   - Output 1: voice note processing  
   - Output 2: URL processing

3. **Content Processor (Code Node)**
   ```javascript
   // Basic content processing for MVP
   const inputType = $json.input_type;
   const content = $json.content;
   
   let processedContent = content;
   
   if (inputType === 'text') {
     // Clean and format text input
     processedContent = content.trim();
   } else if (inputType === 'url') {
     // For MVP, we'll just store the URL
     processedContent = `Reference URL: ${content}`;
   } else if (inputType === 'voice_note') {
     // For MVP, we'll need to implement voice transcription
     processedContent = `Voice note file: ${content}`;
   }
   
   return {
     json: {
       ...$json,
       processed_content: processedContent,
       content_length: processedContent.length,
       processing_timestamp: new Date().toISOString()
     }
   };
   ```

4. **Keyword Research (HTTP Request to Serper)**
   - URL: `https://google.serper.dev/search`
   - Method: POST
   - Headers: `X-API-KEY: {{ $vars.SERPER_API_KEY }}`
   - Body: 
   ```json
   {
     "q": "{{ $json.processed_content }}",
     "type": "search",
     "num": 10
   }
   ```

5. **Keyword Analysis (Code Node)**
   ```javascript
   // Process Serper API response and extract keywords
   const serperResponse = $json;
   const processedContent = $('Content Processor').item.json.processed_content;
   
   // Extract potential keywords from content
   const words = processedContent.toLowerCase().split(/\s+/);
   const wordCount = {};
   
   // Simple keyword extraction (can be enhanced with AI later)
   words.forEach(word => {
     if (word.length > 4) { // Filter short words
       wordCount[word] = (wordCount[word] || 0) + 1;
     }
   });
   
   // Sort by frequency
   const topKeywords = Object.entries(wordCount)
     .sort(([,a], [,b]) => b - a)
     .slice(0, 5)
     .map(([word, count]) => ({ keyword: word, frequency: count }));
   
   return {
     json: {
       ...$('Content Processor').item.json,
       top_keywords: topKeywords,
       serper_data: serperResponse
     }
   };
   ```

6. **AI Content Generation (OpenAI Agent)**
   - Model: GPT-4 or Claude
   - System Prompt:
   ```
   You are a professional blog writer. Create a comprehensive blog post based on the provided content and keywords.
   
   Requirements:
   - Use the primary keyword naturally throughout the content
   - Write in a professional, engaging tone
   - Include a compelling title
   - Structure with clear headings (H2, H3)
   - Aim for 1000-1500 words
   - Include a strong introduction and conclusion
   - Add relevant internal linking suggestions
   
   Content to work with: {{ $json.processed_content }}
   Primary keyword: {{ $json.top_keywords[0].keyword }}
   
   Return the blog post in this JSON format:
   {
     "title": "Blog Post Title",
     "content": "Full blog post content with HTML formatting",
     "meta_title": "SEO optimized meta title",
     "meta_description": "SEO meta description (150-160 chars)",
     "focus_keyword": "primary keyword",
     "word_count": 0,
     "readability_score": 0,
     "internal_links": ["suggestion1", "suggestion2"],
     "tags": ["tag1", "tag2", "tag3"]
   }
   ```

7. **SEO Optimization (Code Node)**
   ```javascript
   // Basic SEO optimization for MVP
   const aiOutput = $json;
   const content = aiOutput.content;
   const focusKeyword = aiOutput.focus_keyword;
   
   // Calculate basic SEO metrics
   const wordCount = content.split(/\s+/).length;
   const keywordCount = (content.toLowerCase().match(new RegExp(focusKeyword.toLowerCase(), 'g')) || []).length;
   const keywordDensity = (keywordCount / wordCount) * 100;
   
   // Basic readability score (simplified)
   const avgWordsPerSentence = wordCount / (content.split(/[.!?]+/).length - 1);
   const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
   
   // SEO score calculation (basic)
   const seoScore = Math.min(100, 
     (keywordDensity > 1 && keywordDensity < 3 ? 30 : 10) + // Keyword density
     (wordCount > 800 ? 25 : 10) + // Content length
     (aiOutput.meta_title && aiOutput.meta_title.length > 30 && aiOutput.meta_title.length < 60 ? 20 : 10) + // Meta title
     (aiOutput.meta_description && aiOutput.meta_description.length > 120 && aiOutput.meta_description.length < 160 ? 15 : 5) + // Meta description
     (readabilityScore > 60 ? 10 : 5) // Readability
   );
   
   return {
     json: {
       ...aiOutput,
       seo_score: Math.round(seoScore),
       readability_score: Math.round(readabilityScore),
       keyword_density: Math.round(keywordDensity * 100) / 100
     }
   };
   ```

8. **Store in Baserow (HTTP Request)**
   - URL: `https://baserow.aiautomata.co.za/api/database/rows/table/{{ $vars.BLOG_POSTS_TABLE_ID }}/`
   - Method: POST
   - Headers: `Authorization: Token {{ $vars.BASEROW_TOKEN }}`
   - Body:
   ```json
   {
     "title": "{{ $json.title }}",
     "slug": "{{ $json.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') }}",
     "content": "{{ $json.content }}",
     "meta_title": "{{ $json.meta_title }}",
     "meta_description": "{{ $json.meta_description }}",
     "focus_keyword": "{{ $json.focus_keyword }}",
     "secondary_keywords": {{ JSON.stringify($json.tags) }},
     "status": "review",
     "seo_score": {{ $json.seo_score }},
     "word_count": {{ $json.word_count }},
     "readability_score": {{ $json.readability_score }},
     "featured_image_prompt": "Create a professional image for: {{ $json.title }}",
     "internal_links": {{ JSON.stringify($json.internal_links) }},
     "category": "General",
     "tags": {{ JSON.stringify($json.tags) }}
   }
   ```

9. **Update Blog Request Status (HTTP Request)**
   - URL: `https://baserow.aiautomata.co.za/api/database/rows/table/{{ $vars.BLOG_REQUESTS_TABLE_ID }}/{{ $('Webhook').item.json.baserow_record_id }}/`
   - Method: PATCH
   - Headers: `Authorization: Token {{ $vars.BASEROW_TOKEN }}`
   - Body:
   ```json
   {
     "status": "completed",
     "blog_post_id": {{ $json.id }},
     "completion_timestamp": "{{ new Date().toISOString() }}",
     "processing_log": "Blog post created successfully with SEO score: {{ $('SEO Optimization').item.json.seo_score }}"
   }
   ```

10. **Response (Respond to Webhook)**
    - Status: 200
    - Body:
    ```json
    {
      "success": true,
      "message": "Blog post created successfully",
      "blog_post_id": "{{ $('Store in Baserow').item.json.id }}",
      "seo_score": "{{ $('SEO Optimization').item.json.seo_score }}",
      "word_count": "{{ $('SEO Optimization').item.json.word_count }}",
      "status": "ready_for_review"
    }
    ```

### **Step 4: Environment Variables Setup**

**File**: `.env.local`

```bash
# n8n Integration
N8N_BLOG_WORKFLOW_WEBHOOK_URL=https://n8n.aiautomata.co.za/webhook/blog-creation-mvp

# Baserow Configuration
BASEROW_TOKEN=your_baserow_token_here
BASEROW_BASE_URL=https://baserow.aiautomata.co.za
BLOG_POSTS_TABLE_ID=your_blog_posts_table_id
BLOG_REQUESTS_TABLE_ID=your_blog_requests_table_id
KEYWORD_RESEARCH_TABLE_ID=your_keyword_research_table_id

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Keyword Research
SERPER_API_KEY=your_serper_api_key

# Voice Processing (for future enhancement)
OPENAI_WHISPER_API_KEY=your_whisper_api_key
```

### **Step 5: Testing & Validation**

#### **5.1 Test Data Setup**

Create test records in Baserow:

1. **Test Client Record**
   - Name: "Test Blog Client"
   - Industry: "Technology"
   - Blog tone preference: "Professional"
   - Target audience: "Business professionals"

2. **Test Blog Request**
   - Input type: "text"
   - Content: "I want to write about the benefits of automation in content marketing"
   - User email: "test@example.com"

#### **5.2 Workflow Testing Steps**

1. **Test Webhook Endpoint**
   ```bash
   curl -X POST https://n8n.aiautomata.co.za/webhook/blog-creation-mvp \
     -H "Content-Type: application/json" \
     -d '{
       "input_type": "text",
       "content": "Benefits of automation in content marketing",
       "submission_timestamp": "2025-01-01T10:00:00Z"
     }'
   ```

2. **Verify Baserow Records**
   - Check Blog_Requests table for new record
   - Check Blog_Posts table for created post
   - Verify keyword research data

3. **Test Frontend Integration**
   - Submit form through UI
   - Verify API response
   - Check for error handling

---

## 🚀 **Phase 2: Enhanced Features (Weeks 3-4)**

### **Step 6: Advanced Keyword Research**

#### **6.1 Enhanced Serper Integration**
- Multiple keyword variations
- Competitor analysis
- Search volume data
- SERP feature detection

#### **6.2 Keyword Selection Interface**
- Frontend component for keyword selection
- Real-time keyword data display
- Auto-selection with manual override

### **Step 7: Content Quality Enhancement**

#### **7.1 Multi-AI Agent System**
- Content analysis agent
- SEO optimization agent
- Quality control agent
- Fact-checking agent

#### **7.2 Advanced SEO Features**
- Schema markup generation
- Internal linking optimization
- Image optimization prompts
- Social media optimization

---

## 📊 **Phase 3: Full System (Weeks 5-6)**

### **Step 8: Complete Workflow Implementation**

#### **8.1 All 8 Phases Implementation**
- Full input processing pipeline
- Comprehensive keyword research
- Advanced content generation
- Complete SEO optimization
- Client notification system

#### **8.2 Analytics & Monitoring**
- Performance metrics tracking
- Success rate monitoring
- Client satisfaction tracking
- SEO performance analysis

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions**

1. **Baserow Connection Issues**
   - Verify API token
   - Check table IDs
   - Validate field names

2. **n8n Workflow Errors**
   - Check webhook configuration
   - Verify node connections
   - Review execution logs

3. **AI Content Quality Issues**
   - Adjust system prompts
   - Modify temperature settings
   - Enhance input preprocessing

4. **SEO Score Calculation**
   - Verify keyword density
   - Check meta tag lengths
   - Validate readability metrics

---

## 📈 **Success Metrics**

### **MVP Success Criteria**
- [ ] Blog requests successfully submitted
- [ ] Content generated with 70+ SEO score
- [ ] Baserow records created correctly
- [ ] Workflow completes within 5 minutes
- [ ] Error rate below 5%

### **Enhanced Features Success Criteria**
- [ ] Keyword research accuracy > 80%
- [ ] Content quality score > 85%
- [ ] Client satisfaction > 90%
- [ ] SEO performance improvement > 50%

---

## 📝 **Next Steps**

1. **Review this guide** and confirm approach
2. **Set up Baserow tables** following the schema
3. **Create the MVP workflow** in n8n
4. **Test with sample data** to validate functionality
5. **Implement frontend integration** 
6. **Deploy and monitor** the system
7. **Iterate based on results** and user feedback

---

**Ready to start building? Let's begin with Step 1: Baserow Database Schema Design!** 🚀
