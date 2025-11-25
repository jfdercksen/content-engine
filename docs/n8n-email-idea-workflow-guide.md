# n8n Email Idea Workflow Guide

## Overview

This guide explains how to structure your n8n workflow to process email ideas created with the new building block system. The workflow receives email idea data in JSON format and generates HTML emails based on the email type (Welcome, Promotional, or Newsletter) and the configured sections.

## Data Structure

### Payload Structure

The workflow receives data via webhook from the endpoint: `/api/webhooks/n8n/email-idea-generation`

#### Main Payload Fields (JSON Body)

The n8n webhook receives a JSON payload with the following structure:

```json
{
  "client_id": "mg_bryanston",
  "base_id": "123",
  "table_id": "730",
  "event": "email_idea_generation",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "clientId": "mg_bryanston",
  "client": {
    "name": "MG Bryanston",
    "id": "mg_bryanston"
  },
  "tables": {
    "emailIdeas": {
      "id": "730",
      "recordId": "123"
    }
  },
  "baserow": {
    "baseUrl": "https://baserow.example.com",
    "databaseId": "123",
    "token": "***",
    "tableId": "730",
    "recordId": "123"
  },
  "emailMediaStructure": {
    "emailType": "Welcome",
    "sections": [...],
    "contentSource": {...}
  },
  "emailType": "Welcome",
  "contentSource": {
    "type": "text",
    "value": "Content source value"
  },
  "sections": [...],
  "sectionsCount": 3,
  "emailIdeaId": "123",
  "metadata": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "source": "content-engine-app",
    "version": "2.0",
    "contentType": "email_idea"
  }
}
```

**Key Fields:**
- `emailIdeaId` (string): The ID of the email idea record in Baserow (already created)
- `clientId` (string): The client identifier
- `emailMediaStructure` (object): The complete email structure (parsed JSON, see below)
- `emailType` (string): One of: `Welcome`, `Promotional`, `Newsletter`
- `contentSource` (object): `{ type: "text" | "voice" | "url", value: "string" }`
- `sections` (array): Array of EmailSection objects (already parsed and sorted)
- `sectionsCount` (number): Number of sections in the email
- `productUVPs` (array): Array of Product UVP objects (automatically fetched if product sections exist)
- `productUVPsCount` (number): Number of Product UVPs found
- `hasProductUVPs` (boolean): Whether any Product UVPs were found

### Complete Payload Example

```json
{
  "client_id": "mg_bryanston",
  "base_id": "123",
  "table_id": "730",
  "event": "email_idea_generation",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "clientId": "mg_bryanston",
  "client": {
    "name": "MG Bryanston",
    "id": "mg_bryanston"
  },
  "tables": {
    "emailIdeas": {
      "id": "730",
      "recordId": "123"
    }
  },
  "baserow": {
    "baseUrl": "https://baserow.aiautomata.co.za",
    "databaseId": "123",
    "token": "your-baserow-token",
    "tableId": "730",
    "recordId": "123"
  },
  "emailMediaStructure": {
    "emailType": "Welcome",
    "sections": [...],
    "contentSource": {...}
  },
  "emailType": "Welcome",
  "contentSource": {
    "type": "text",
    "value": "This is the content source text for AI processing"
  },
  "sections": [...],
  "sectionsCount": 3,
  "emailIdeaId": "123",
  "metadata": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "source": "content-engine-app",
    "version": "2.0",
    "contentType": "email_idea"
  }
}
```

### Email Media Structure (JSON)

The `emailMediaStructure` object contains:

```json
{
  "emailType": "Welcome" | "Promotional" | "Newsletter",
  "sections": [
    {
      "id": "section-1234567890-abc123",
      "type": "header" | "body" | "cta",
      "order": 0,
      "media": {
        "type": "image" | "video" | null,
        "url": "string or null",
        "imageId": "string or null",
        "altText": "string or null"
      },
      // Header section fields:
      "hook": "string (required for header)",
      "ctaButton": "string or null (optional for header)",
      
      // Body section fields:
      "bodyType": "text" | "product" (for body sections),
      "bodyText": "string or null (guidance for AI)",
      "productName": "string or null (required if bodyType is 'product')",
      "productDescription": "string or null (optional)",
      "productCtaButton": "string or null (optional)",
      
      // CTA section fields:
      "ctaUrl": "string (required for cta)",
      "ctaButtonName": "string (required for cta)",
      "ctaDescription": "string (required for cta)"
    }
  ],
  "contentSource": {
    "type": "text" | "voice" | "url",
    "value": "string - the actual content for AI processing"
  }
}
```

## Workflow Structure

### Recommended Flow

```
1. Webhook Trigger
   ↓
2. Parse Payload
   ↓
3. Extract & Validate Data
   ↓
4. Switch Node (by emailType)
   ├─ Welcome → Welcome Email Branch
   ├─ Promotional → Promotional Email Branch
   └─ Newsletter → Newsletter Email Branch
   ↓
5. Process Sections (in each branch)
   ↓
6. Generate HTML Email
   ↓
7. Update Baserow Record
   ↓
8. Send to Email Platform (Optional)
```

## Detailed Node Configuration

### 1. Webhook Trigger Node

**Node Type:** Webhook (POST)

**Settings:**
- HTTP Method: POST
- Path: `/email-idea-generation`
- Response Mode: Respond When Last Node Finishes

**Output:**
- Receives FormData from the API

### 2. Parse Payload Node

**Node Type:** Code / Function

**Purpose:** Extract and validate the data structure (data is already parsed in JSON format)

**JavaScript Code:**

```javascript
// Data is already parsed as JSON from webhook
const payload = $input.item.json;

// Extract emailMediaStructure (already parsed)
const emailMediaStructure = payload.emailMediaStructure || {
  emailType: payload.emailType,
  sections: payload.sections || [],
  contentSource: payload.contentSource || { type: 'text', value: '' }
};

// Ensure sections are sorted by order
const sections = (emailMediaStructure.sections || payload.sections || []).sort((a, b) => a.order - b.order);

// Extract content source
const contentSource = emailMediaStructure.contentSource || payload.contentSource || { type: 'text', value: '' };

// Extract client info
const clientId = payload.clientId || payload.client_id;
const emailIdeaId = payload.emailIdeaId || payload.tables?.emailIdeas?.recordId || payload.baserow?.recordId;

// Extract Product UVP data (if available)
const productUVPs = payload.productUVPs || []
const hasProductUVPs = payload.hasProductUVPs || false

// Return processed data
return {
  json: {
    emailIdeaId: emailIdeaId,
    clientId: clientId,
    emailType: emailMediaStructure.emailType || payload.emailType,
    sections: sections,
    contentSource: contentSource,
    sectionsCount: sections.length,
    productUVPs: productUVPs,
    productUVPsCount: productUVPs.length,
    hasProductUVPs: hasProductUVPs,
    baserow: payload.baserow || {},
    client: payload.client || {},
    tables: payload.tables || {}
  }
};
```

### 3. Extract Sections Node

**Node Type:** Code / Function

**Purpose:** Extract different section types into separate arrays

**JavaScript Code:**

```javascript
const sections = $input.item.json.sections || [];
const emailType = $input.item.json.emailType;
const contentSource = $input.item.json.contentSource;

// Separate sections by type
const headerSections = sections.filter(s => s.type === 'header');
const bodySections = sections.filter(s => s.type === 'body');
const ctaSections = sections.filter(s => s.type === 'cta');

// Extract media URLs from all sections
const mediaUrls = sections
  .filter(s => s.media && s.media.url)
  .map(s => ({
    url: s.media.url,
    altText: s.media.altText || '',
    sectionType: s.type,
    sectionOrder: s.order
  }));

return {
  json: {
    ...$input.item.json,
    headerSections: headerSections,
    bodySections: bodySections,
    ctaSections: ctaSections,
    mediaUrls: mediaUrls,
    hasHeader: headerSections.length > 0,
    hasBody: bodySections.length > 0,
    hasCTA: ctaSections.length > 0
  }
};
```

### 4. Switch Node (Route by Email Type)

**Node Type:** Switch

**Mode:** Rules

**Rules:**

1. **Welcome Emails**
   - Condition: `{{ $json.emailType }}` equals `Welcome`
   - Route to: Welcome Email Processing Branch

2. **Promotional Emails**
   - Condition: `{{ $json.emailType }}` equals `Promotional`
   - Route to: Promotional Email Processing Branch

3. **Newsletter Emails**
   - Condition: `{{ $json.emailType }}` equals `Newsletter`
   - Route to: Newsletter Email Processing Branch

### 5. Process Sections Node (Repeated in each branch)

**Node Type:** Code / Function

**Purpose:** Process sections and prepare data for HTML generation

**JavaScript Code (Example for Promotional branch):**

```javascript
const sections = $input.item.json.sections || [];
const contentSource = $input.item.json.contentSource;

// Process header section
let headerData = null;
const headerSection = sections.find(s => s.type === 'header');
if (headerSection) {
  headerData = {
    hook: headerSection.hook || '',
    ctaButton: headerSection.ctaButton || null,
    media: headerSection.media || null
  };
}

// Process body sections and match with Product UVP data
const productUVPs = $input.item.json.productUVPs || [];
const bodySections = sections.filter(s => s.type === 'body').map(section => {
  const bodyData = {
    bodyType: section.bodyType || 'text',
    media: section.media || null
  };
  
  if (section.bodyType === 'text') {
    bodyData.bodyText = section.bodyText || '';
  } else if (section.bodyType === 'product') {
    bodyData.productName = section.productName || '';
    bodyData.productDescription = section.productDescription || null;
    bodyData.productCtaButton = section.productCtaButton || null;
    
    // Match with Product UVP data if available
    const matchingUvp = productUVPs.find(uvp => 
      uvp.productName && section.productName &&
      uvp.productName.toLowerCase().trim() === section.productName.toLowerCase().trim()
    );
    
    if (matchingUvp) {
      bodyData.productUvp = {
        id: matchingUvp.id,
        productName: matchingUvp.productName,
        productUrl: matchingUvp.productUrl,
        customerType: matchingUvp.customerType,
        industryCategory: matchingUvp.industryCategory,
        problemSolved: matchingUvp.problemSolved,
        keyDifferentiator: matchingUvp.keyDifferentiator,
        uvp: matchingUvp.uvp
      };
    }
  }
  
  return bodyData;
});

// Process CTA section
let ctaData = null;
const ctaSection = sections.find(s => s.type === 'cta');
if (ctaSection) {
  ctaData = {
    url: ctaSection.ctaUrl || '',
    buttonName: ctaSection.ctaButtonName || '',
    description: ctaSection.ctaDescription || '',
    media: ctaSection.media || null
  };
}

// Combine content source with section data for AI processing
const aiContext = {
  contentSource: contentSource,
  emailType: $input.item.json.emailType,
  headerData: headerData,
  bodySections: bodySections,
  ctaData: ctaData
};

return {
  json: {
    ...$input.item.json,
    headerData: headerData,
    bodySections: bodySections,
    ctaData: ctaData,
    aiContext: aiContext
  }
};
```

### 6. AI Content Generation Node

**Node Type:** OpenAI / Anthropic / AI Provider

**Purpose:** Generate email content using AI based on sections and content source

**Prompt Template (Example):**

```
You are an email marketing expert creating a {{ $json.emailType }} email.

Email Type: {{ $json.emailType }}

Content Source: {{ $json.contentSource.type }}
Source Value: {{ $json.contentSource.value }}

SECTIONS TO CREATE:

1. HEADER SECTION:
   Hook: {{ $json.headerData.hook }}
   CTA Button: {{ $json.headerData.ctaButton || 'None' }}
   {% if $json.headerData.media %}Header Image URL: {{ $json.headerData.media.url }}{% endif %}

2. BODY SECTIONS:
   {% for bodySection in $json.bodySections %}
   Body Section {{ loop.index }}:
   - Type: {{ bodySection.bodyType }}
   {% if bodySection.bodyType == 'text' %}
   - Body Text Guidance: {{ bodySection.bodyText }}
   {% elif bodySection.bodyType == 'product' %}
   - Product Name: {{ bodySection.productName }}
   - Product Description: {{ bodySection.productDescription || 'None' }}
   - Product CTA: {{ bodySection.productCtaButton || 'None' }}
   {% if bodySection.productUvp %}
   - Product UVP Details:
     * Problem Solved: {{ bodySection.productUvp.problemSolved }}
     * Key Differentiator: {{ bodySection.productUvp.keyDifferentiator }}
     * UVP: {{ bodySection.productUvp.uvp }}
     * Customer Type: {{ bodySection.productUvp.customerType }}
     * Industry Category: {{ bodySection.productUvp.industryCategory }}
     * Product URL: {{ bodySection.productUvp.productUrl }}
   {% endif %}
   {% endif %}
   {% if bodySection.media %}Image URL: {{ bodySection.media.url }}{% endif %}
   {% endfor %}

3. CTA SECTION:
   CTA URL: {{ $json.ctaData.url }}
   Button Name: {{ $json.ctaData.buttonName }}
   Description: {{ $json.ctaData.description }}
   {% if $json.ctaData.media %}CTA Image URL: {{ $json.ctaData.media.url }}{% endif %}

{% if $json.hasProductUVPs %}
PRODUCT UVP INFORMATION (for reference):
{% for uvp in $json.productUVPs %}
- {{ uvp.productName }}:
  * Problem Solved: {{ uvp.problemSolved }}
  * Key Differentiator: {{ uvp.keyDifferentiator }}
  * UVP: {{ uvp.uvp }}
  * Customer Type: {{ uvp.customerType }}
  * Industry Category: {{ uvp.industryCategory }}
{% endfor %}
{% endif %}

Create a professional, engaging {{ $json.emailType }} email that:
- Uses the hook provided in the header section
- Incorporates all body sections in order
- Includes the CTA section at the end
- Integrates any images/media provided
- Maintains brand voice and tone
- Is optimized for email clients (responsive HTML)
- Uses the content source as context for the messaging
{% if $json.hasProductUVPs %}
- Incorporates Product UVP information where relevant (problem solved, key differentiators, unique value propositions)
- Uses Product UVP details to enhance product descriptions and value propositions
{% endif %}

Return the HTML email code ready to send.
```

### 7. Build HTML Email Node

**Node Type:** Code / Function

**Purpose:** Structure the AI-generated content into proper HTML email format

**JavaScript Code:**

```javascript
const aiGeneratedContent = $input.item.json.message || $input.item.json.content || '';
const sections = $input.item.json.sections || [];
const emailType = $input.item.json.emailType;

// Build HTML structure
let htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
        /* Email-safe CSS */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
        }
        .header img {
            max-width: 100%;
            height: auto;
        }
        .body {
            padding: 20px 0;
        }
        .body img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
        }
        .product-section {
            border: 1px solid #ddd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .cta-section {
            text-align: center;
            padding: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .cta-button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
`;

// Add header section
const headerSection = sections.find(s => s.type === 'header');
if (headerSection) {
  htmlEmail += '<div class="header">\n';
  
  // Add header image if available
  if (headerSection.media && headerSection.media.url) {
    htmlEmail += `  <img src="${headerSection.media.url}" alt="${headerSection.media.altText || 'Header image'}" />\n`;
  }
  
  // Add hook
  if (headerSection.hook) {
    htmlEmail += `  <h1>${headerSection.hook}</h1>\n`;
  }
  
  htmlEmail += '</div>\n';
}

// Add body sections
const bodySections = sections.filter(s => s.type === 'body');
htmlEmail += '<div class="body">\n';
for (const bodySection of bodySections) {
  // Add body image if available
  if (bodySection.media && bodySection.media.url) {
    htmlEmail += `  <img src="${bodySection.media.url}" alt="${bodySection.media.altText || 'Body image'}" />\n`;
  }
  
  // Add content based on body type
  if (bodySection.bodyType === 'product' && bodySection.productName) {
    htmlEmail += '  <div class="product-section">\n';
    htmlEmail += `    <h2>${bodySection.productName}</h2>\n`;
    if (bodySection.productDescription) {
      htmlEmail += `    <p>${bodySection.productDescription}</p>\n`;
    }
    if (bodySection.productCtaButton) {
      const ctaSection = sections.find(s => s.type === 'cta');
      const ctaUrl = ctaSection ? ctaSection.ctaUrl : '#';
      htmlEmail += `    <a href="${ctaUrl}" class="cta-button">${bodySection.productCtaButton}</a>\n`;
    }
    htmlEmail += '  </div>\n';
  }
}

// Insert AI-generated content
htmlEmail += `  ${aiGeneratedContent}\n`;
htmlEmail += '</div>\n';

// Add CTA section
const ctaSection = sections.find(s => s.type === 'cta');
if (ctaSection) {
  htmlEmail += '<div class="cta-section">\n';
  
  // Add CTA image if available
  if (ctaSection.media && ctaSection.media.url) {
    htmlEmail += `  <img src="${ctaSection.media.url}" alt="${ctaSection.media.altText || 'CTA image'}" />\n`;
  }
  
  // Add CTA description
  if (ctaSection.ctaDescription) {
    htmlEmail += `  <p>${ctaSection.ctaDescription}</p>\n`;
  }
  
  // Add CTA button
  if (ctaSection.ctaUrl && ctaSection.ctaButtonName) {
    htmlEmail += `  <a href="${ctaSection.ctaUrl}" class="cta-button">${ctaSection.ctaButtonName}</a>\n`;
  }
  
  htmlEmail += '</div>\n';
}

// Add footer (Mailchimp will add their footer, so keep this minimal)
htmlEmail += `
    <div class="footer">
        <p>© ${new Date().getFullYear()} All rights reserved.</p>
    </div>
</body>
</html>
`;

return {
  json: {
    ...$input.item.json,
    generatedHtml: htmlEmail
  }
};
```

### 8. Update Baserow Record Node

**Node Type:** HTTP Request

**Purpose:** Update the email idea record with generated HTML

**Settings:**
- Method: PATCH
- URL: `{{ $env.BASEROW_API_URL }}/api/database/rows/table/{{ $env.EMAIL_IDEAS_TABLE_ID }}/{{ $json.emailIdeaId }}/`
- Authentication: Bearer Token (`{{ $env.BASEROW_API_TOKEN }}`)
- Headers:
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "generatedhtml": "{{ $json.generatedHtml }}",
  "status": "Generated"
}
```

## Workflow Branches

### Welcome Email Branch

**Path:** Switch → Welcome → Process Sections → AI Generation → Build HTML → Update Baserow

**Characteristics:**
- Friendly, welcoming tone
- Focus on onboarding and introduction
- Use header hook to create engaging opening
- Include clear next steps in CTA

### Promotional Email Branch

**Path:** Switch → Promotional → Process Sections → AI Generation → Build HTML → Update Baserow

**Characteristics:**
- Sales-focused messaging
- Highlight products/services from body sections
- Strong, action-oriented CTAs
- Emphasis on benefits and value propositions

### Newsletter Branch

**Path:** Switch → Newsletter → Process Sections → AI Generation → Build HTML → Update Baserow

**Characteristics:**
- Informative and engaging content
- Educational tone
- Multiple body sections for variety
- Balanced mix of content and promotional elements

## Error Handling

### Error Handling Node

**Node Type:** Error Trigger

**Placement:** After each major processing node

**Actions:**
1. Log error details
2. Update Baserow record with `status: "Failed"`
3. Send notification (optional)
4. End workflow gracefully

### Error Update to Baserow

```json
{
  "status": "Failed",
  "generatedhtml": null
}
```

## Testing Checklist

- [ ] Webhook receives data correctly
- [ ] JSON parsing works for emailMediaStructure
- [ ] Sections are sorted by order correctly
- [ ] Switch node routes correctly by emailType
- [ ] Each branch processes sections correctly
- [ ] AI generates appropriate content
- [ ] HTML is properly structured
- [ ] Images/media URLs are included correctly
- [ ] Baserow record updates successfully
- [ ] Error handling works as expected

## Example Workflow JSON

See `n8n-email-wordpress-posting-workflow.json` for reference structure.

## Tips

1. **Section Ordering:** Always sort sections by `order` field before processing
2. **Media Handling:** Check for both `url` and `imageId` - use `url` if available, otherwise fetch from Baserow Images table using `imageId`
3. **Content Source:** Use the `contentSource.value` as context for AI, not as direct content
4. **HTML Structure:** Use email-safe CSS (inline styles preferred)
5. **Testing:** Test each branch separately before combining
6. **Logging:** Add logging nodes to debug section processing

## Common Issues

1. **Missing Sections:** Check that sections are properly filtered by type
2. **Media URLs:** Ensure media URLs are absolute, not relative
3. **HTML Rendering:** Test HTML in multiple email clients
4. **Order Issues:** Always sort sections by `order` before processing
5. **Required Fields:** Validate that required fields (hook, ctaUrl, etc.) are present

## Next Steps

1. Import this workflow structure into n8n
2. Configure AI provider credentials
3. Set up Baserow API credentials
4. Test with sample data from each email type
5. Customize HTML templates per email type
6. Add additional processing steps as needed

