# n8n Email Idea Workflow - Quick Start Guide

## Overview

This is a quick reference guide for building the n8n workflow to process email ideas with the new building block system.

## Workflow Architecture

```
Webhook → Parse → Extract Sections → Switch (by Email Type) → Process → AI Generate → Build HTML → Update Baserow
```

## Step-by-Step Setup

### 1. Webhook Trigger Node

**Settings:**
- HTTP Method: POST
- Path: `/email-idea-generation`
- Response Mode: Respond When Last Node Finishes

**Receives:**
- JSON payload with email idea data

### 2. Parse Payload Node (Code/Function)

**Purpose:** Extract and organize data from the payload

**Code:**
```javascript
const payload = $input.item.json;

// Extract data (already parsed JSON)
const emailMediaStructure = payload.emailMediaStructure || {
  emailType: payload.emailType,
  sections: payload.sections || [],
  contentSource: payload.contentSource || { type: 'text', value: '' }
};

// Sort sections by order
const sections = (emailMediaStructure.sections || []).sort((a, b) => a.order - b.order);

return {
  json: {
    emailIdeaId: payload.emailIdeaId || payload.tables?.emailIdeas?.recordId,
    clientId: payload.clientId || payload.client_id,
    emailType: emailMediaStructure.emailType,
    sections: sections,
    contentSource: emailMediaStructure.contentSource,
    sectionsCount: sections.length,
    productUVPs: payload.productUVPs || [],
    productUVPsCount: payload.productUVPsCount || 0,
    hasProductUVPs: payload.hasProductUVPs || false,
    baserow: payload.baserow || {},
    tables: payload.tables || {}
  }
};
```

### 3. Extract Sections Node (Code/Function)

**Purpose:** Separate sections by type and extract media

**Code:**
```javascript
const sections = $input.item.json.sections || [];
const emailType = $input.item.json.emailType;
const contentSource = $input.item.json.contentSource;

// Separate sections by type
const headerSections = sections.filter(s => s.type === 'header');
const bodySections = sections.filter(s => s.type === 'body');
const ctaSections = sections.filter(s => s.type === 'cta');

// Extract media URLs
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

**Rule 1: Welcome**
- Condition: `{{ $json.emailType }}` equals `Welcome`
- Output: 1

**Rule 2: Promotional**
- Condition: `{{ $json.emailType }}` equals `Promotional`
- Output: 2

**Rule 3: Newsletter**
- Condition: `{{ $json.emailType }}` equals `Newsletter`
- Output: 3

### 5. Process Sections Node (Each Branch)

**Node Type:** Code/Function

**Purpose:** Process sections and prepare data for AI

**Code (for Promotional branch - customize per branch):**
```javascript
const sections = $input.item.json.sections || [];
const contentSource = $input.item.json.contentSource;
const emailType = $input.item.json.emailType;

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

// Process body sections
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

// Prepare AI context
const aiContext = {
  emailType: emailType,
  contentSource: contentSource,
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

**Purpose:** Generate email content based on sections and content source

**Prompt Template:**
```
Create a {{ $json.emailType }} email with the following structure:

EMAIL TYPE: {{ $json.emailType }}

CONTENT SOURCE:
Type: {{ $json.contentSource.type }}
Value: {{ $json.contentSource.value }}

HEADER SECTION:
Hook: {{ $json.headerData.hook }}
{% if $json.headerData.ctaButton %}Header CTA Button: {{ $json.headerData.ctaButton }}{% endif %}
{% if $json.headerData.media and $json.headerData.media.url %}Header Image: {{ $json.headerData.media.url }}{% endif %}

BODY SECTIONS:
{% for bodySection in $json.bodySections %}
Body Section {{ loop.index }}:
- Type: {{ bodySection.bodyType }}
{% if bodySection.bodyType == 'text' %}
- Body Text Guidance: {{ bodySection.bodyText }}
{% elif bodySection.bodyType == 'product' %}
- Product Name: {{ bodySection.productName }}
- Product Description: {{ bodySection.productDescription }}
- Product CTA: {{ bodySection.productCtaButton }}
{% endif %}
{% if bodySection.media and bodySection.media.url %}Body Image: {{ bodySection.media.url }}{% endif %}
{% endfor %}

CTA SECTION:
URL: {{ $json.ctaData.url }}
Button Name: {{ $json.ctaData.buttonName }}
Description: {{ $json.ctaData.description }}
{% if $json.ctaData.media and $json.ctaData.media.url %}CTA Image: {{ $json.ctaData.media.url }}{% endif %}

INSTRUCTIONS:
1. Create engaging {{ $json.emailType }} email content
2. Use the hook from the header section as the main attention-grabber
3. Incorporate all body sections in order
4. Include the CTA section at the end
5. Use the content source as context for messaging
6. Integrate any images/media provided
7. Maintain professional, brand-appropriate tone
8. Create responsive HTML email code
9. Ensure email client compatibility

Return the complete HTML email code ready to send.
```

### 7. Build HTML Email Node

**Node Type:** Code/Function

**Purpose:** Structure AI-generated content into proper HTML email format

**Code:**
```javascript
const aiGeneratedContent = $input.item.json.message || $input.item.json.content || '';
const sections = $input.item.json.sections || [];
const emailType = $input.item.json.emailType;

// Build HTML structure with email-safe CSS
let htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            padding: 0;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .header h1 {
            margin: 20px 0;
            color: #333;
        }
        .body {
            padding: 20px;
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
            padding: 30px 20px;
            background-color: #f8f9fa;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header, .body, .cta-section {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
`;

// Add header section
const headerSection = sections.find(s => s.type === 'header');
if (headerSection) {
  htmlEmail += '<div class="header">\n';
  
  if (headerSection.media && headerSection.media.url) {
    htmlEmail += `  <img src="${headerSection.media.url}" alt="${headerSection.media.altText || 'Header image'}" style="max-width: 100%; height: auto;" />\n`;
  }
  
  if (headerSection.hook) {
    htmlEmail += `  <h1 style="margin: 20px 0; color: #333;">${headerSection.hook}</h1>\n`;
  }
  
  htmlEmail += '</div>\n';
}

// Add body sections
const bodySections = sections.filter(s => s.type === 'body');
htmlEmail += '<div class="body">\n';
for (const bodySection of bodySections) {
  if (bodySection.media && bodySection.media.url) {
    htmlEmail += `  <img src="${bodySection.media.url}" alt="${bodySection.media.altText || 'Body image'}" style="max-width: 100%; height: auto; display: block; margin: 20px auto;" />\n`;
  }
  
  if (bodySection.bodyType === 'product' && bodySection.productName) {
    htmlEmail += '  <div class="product-section">\n';
    htmlEmail += `    <h2 style="margin: 0 0 10px 0; color: #333;">${bodySection.productName}</h2>\n`;
    if (bodySection.productDescription) {
      htmlEmail += `    <p style="margin: 10px 0; color: #666;">${bodySection.productDescription}</p>\n`;
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
  
  if (ctaSection.media && ctaSection.media.url) {
    htmlEmail += `  <img src="${ctaSection.media.url}" alt="${ctaSection.media.altText || 'CTA image'}" style="max-width: 100%; height: auto; display: block; margin: 0 auto 20px auto;" />\n`;
  }
  
  if (ctaSection.ctaDescription) {
    htmlEmail += `  <p style="margin: 10px 0 20px 0; color: #333; font-size: 16px;">${ctaSection.ctaDescription}</p>\n`;
  }
  
  if (ctaSection.ctaUrl && ctaSection.ctaButtonName) {
    htmlEmail += `  <a href="${ctaSection.ctaUrl}" class="cta-button" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">${ctaSection.ctaButtonName}</a>\n`;
  }
  
  htmlEmail += '</div>\n';
}

// Close HTML
htmlEmail += `
    </div>
    <!-- Mailchimp will add footer here -->
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

**Method:** PATCH
**URL:** `{{ $json.baserow.baseUrl }}/api/database/rows/table/{{ $json.baserow.tableId }}/{{ $json.emailIdeaId }}/`
**Authentication:** Bearer Token: `{{ $json.baserow.token }}`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Token {{ $json.baserow.token }}`

**Body (JSON):**
```json
{
  "field_7223": "{{ $json.generatedHtml }}",
  "field_7200": "Generated"
}
```

**Note:** Replace `field_7223` and `field_7200` with actual Baserow field IDs for your email ideas table.

## Branch-Specific Processing

### Welcome Email Branch

**Characteristics:**
- Friendly, welcoming tone
- Focus on onboarding and introduction
- Clear next steps

**Customizations:**
- Use welcoming language in AI prompt
- Emphasize benefits of getting started
- Include helpful resources

### Promotional Email Branch

**Characteristics:**
- Sales-focused messaging
- Product/service highlights
- Strong CTAs

**Customizations:**
- Emphasize value propositions
- Highlight products from body sections
- Create urgency in messaging

### Newsletter Branch

**Characteristics:**
- Informative and engaging
- Educational content
- Multiple content sections

**Customizations:**
- Use informative tone
- Structure multiple body sections clearly
- Balance content and promotional elements

## Key Points

1. **Section Order:** Always sort sections by `order` field before processing
2. **Media Handling:** Check for both `url` and `imageId` - prefer `url` if available
3. **Content Source:** Use `contentSource.value` as context for AI, not direct content
4. **HTML Structure:** Use email-safe CSS (inline styles preferred)
5. **Testing:** Test each branch separately before combining
6. **Error Handling:** Add error nodes to update Baserow status to "Failed" on errors

## Testing

1. Test with Welcome email type
2. Test with Promotional email type
3. Test with Newsletter email type
4. Test with multiple body sections
5. Test with and without media
6. Test error handling

## Troubleshooting

- **Sections not appearing:** Check section order sorting
- **Media not loading:** Verify URLs are absolute, not relative
- **HTML not rendering:** Check email-safe CSS usage
- **Status not updating:** Verify Baserow field IDs are correct

