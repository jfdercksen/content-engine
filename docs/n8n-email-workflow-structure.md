# n8n Email Idea Workflow - Visual Structure

## High-Level Workflow Flow

```
┌─────────────────────┐
│  Webhook Trigger    │
│  (POST /email-idea  │
│   -generation)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Parse Payload      │
│  - Extract JSON     │
│  - Parse sections   │
│  - Extract content  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Extract Sections   │
│  - Header sections  │
│  - Body sections    │
│  - CTA sections     │
│  - Media URLs       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Switch Node        │
│  (By Email Type)    │
└─────┬───────┬───────┘
      │       │       │
      ▼       ▼       ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Welcome  │ │Promo-   │ │News-    │
│Branch   │ │tional   │ │letter   │
│         │ │Branch   │ │Branch   │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └─────┬─────┴─────┬─────┘
           │           │
           ▼           ▼
     ┌─────────────────────┐
     │ Process Sections    │
     │ - Process header    │
     │ - Process bodies    │
     │ - Process CTA       │
     │ - Prepare AI ctx    │
     └──────────┬──────────┘
                │
                ▼
     ┌─────────────────────┐
     │ AI Content          │
     │ Generation          │
     │ - Use sections      │
     │ - Use content src   │
     │ - Generate content  │
     └──────────┬──────────┘
                │
                ▼
     ┌─────────────────────┐
     │ Build HTML Email    │
     │ - Structure HTML    │
     │ - Add media         │
     │ - Format content    │
     └──────────┬──────────┘
                │
                ▼
     ┌─────────────────────┐
     │ Update Baserow      │
     │ - Save HTML         │
     │ - Update status     │
     └─────────────────────┘
```

## Branch-Specific Flows

### Welcome Email Branch

```
Switch (Welcome)
  ↓
Process Sections
  ↓
AI Generation (Welcome Tone)
  ↓
Build HTML (Welcome Template)
  ↓
Update Baserow
```

**Welcome Email Characteristics:**
- Friendly, welcoming tone
- Focus on introduction and onboarding
- Clear next steps
- Supportive messaging

### Promotional Email Branch

```
Switch (Promotional)
  ↓
Process Sections
  ↓
Extract Products/Services
  ↓
AI Generation (Sales Tone)
  ↓
Build HTML (Promotional Template)
  ↓
Update Baserow
```

**Promotional Email Characteristics:**
- Sales-focused messaging
- Product/service highlights
- Strong CTAs
- Benefit-oriented content

### Newsletter Branch

```
Switch (Newsletter)
  ↓
Process Sections
  ↓
Process Multiple Body Sections
  ↓
AI Generation (Informative Tone)
  ↓
Build HTML (Newsletter Template)
  ↓
Update Baserow
```

**Newsletter Email Characteristics:**
- Informative and engaging
- Educational content
- Multiple content sections
- Balanced promotional mix

## Data Flow

### Input Data Structure

```
Webhook Payload
├── emailIdeaId (string)
├── clientId (string)
├── emailMediaStructure (JSON string)
│   ├── emailType: "Welcome" | "Promotional" | "Newsletter"
│   ├── sections: Array<EmailSection>
│   │   ├── Header Section
│   │   ├── Body Section(s)
│   │   └── CTA Section
│   └── contentSource: { type, value }
└── section_0, section_1, ... (JSON strings)
```

### Processing Data Structure

```
After Parsing
├── emailIdeaId
├── clientId
├── emailType
├── sections (sorted by order)
├── headerSections: Array<HeaderSection>
├── bodySections: Array<BodySection>
├── ctaSections: Array<CTASection>
└── contentSource
```

### Output Data Structure

```
Final Output
├── emailIdeaId
├── generatedHtml (string)
└── status: "Generated"
```

## Section Processing Flow

### Header Section Processing

```
Header Section
  ├── Extract hook (required)
  ├── Extract CTA button (optional)
  └── Extract media (optional)
      └── Use in HTML: <img src="{url}" alt="{altText}" />
```

### Body Section Processing

```
Body Section
  ├── Determine type: "text" | "product"
  │
  ├── If "text":
  │   └── Extract bodyText (guidance for AI)
  │
  └── If "product":
      ├── Extract productName (required)
      ├── Extract productDescription (optional)
      ├── Extract productCtaButton (optional)
      └── Extract media (optional)
```

### CTA Section Processing

```
CTA Section
  ├── Extract ctaUrl (required)
  ├── Extract ctaButtonName (required)
  ├── Extract ctaDescription (required)
  └── Extract media (optional)
```

## Key Decision Points

### 1. Email Type Routing

**Decision:** Which branch to use?
- **Welcome** → Welcome Branch
- **Promotional** → Promotional Branch
- **Newsletter** → Newsletter Branch

### 2. Section Type Processing

**Decision:** How to process each section?
- **Header** → Extract hook, CTA button, media
- **Body (text)** → Extract body text guidance
- **Body (product)** → Extract product details
- **CTA** → Extract CTA details

### 3. Media Handling

**Decision:** How to handle media?
- **If URL exists** → Use directly in HTML
- **If imageId exists** → Fetch from Baserow Images table
- **If neither** → Skip media in HTML

## Workflow Variables

### Environment Variables

- `BASEROW_API_URL`: Baserow API base URL
- `BASEROW_API_TOKEN`: Baserow API token
- `EMAIL_IDEAS_TABLE_ID`: Email Ideas table ID
- `IMAGES_TABLE_ID`: Images table ID (for fetching by imageId)
- `AI_API_KEY`: AI provider API key
- `AI_MODEL`: AI model to use (e.g., "gpt-4", "claude-3")

### Workflow Variables

- `emailType`: Current email type being processed
- `sectionsCount`: Number of sections
- `generatedHtml`: Generated HTML email
- `clientId`: Client identifier
- `emailIdeaId`: Email idea record ID

## Error Handling Flow

```
Any Node
  ↓ (on error)
Error Trigger Node
  ↓
Log Error
  ↓
Update Baserow Status: "Failed"
  ↓
Send Notification (optional)
  ↓
End Workflow
```

## Testing Data

### Test Payload Example

```json
{
  "emailIdeaId": "123",
  "clientId": "mg_bryanston",
  "emailMediaStructure": "{\"emailType\":\"Promotional\",\"sections\":[{\"id\":\"section-1\",\"type\":\"header\",\"order\":0,\"media\":{\"type\":\"image\",\"url\":\"https://example.com/image.jpg\",\"imageId\":null,\"altText\":\"Header image\"},\"hook\":\"Get 50% off today!\",\"ctaButton\":\"Shop Now\"},{\"id\":\"section-2\",\"type\":\"body\",\"order\":1,\"bodyType\":\"product\",\"productName\":\"Premium Product\",\"productDescription\":\"Best product ever\",\"media\":null},{\"id\":\"section-3\",\"type\":\"cta\",\"order\":2,\"ctaUrl\":\"https://example.com/shop\",\"ctaButtonName\":\"Buy Now\",\"ctaDescription\":\"Limited time offer\"}],\"contentSource\":{\"type\":\"text\",\"value\":\"This is promotional content about our products.\"}}"
}
```

## Quick Reference

### Section Types

1. **Header Section**
   - Required: `hook`
   - Optional: `ctaButton`, `media`

2. **Body Section**
   - Required: `bodyType` ("text" or "product")
   - If product: Required `productName`
   - Optional: `bodyText`, `productDescription`, `productCtaButton`, `media`

3. **CTA Section**
   - Required: `ctaUrl`, `ctaButtonName`, `ctaDescription`
   - Optional: `media`

### Email Type Routing

- `Welcome` → Welcome Email Template
- `Promotional` → Promotional Email Template
- `Newsletter` → Newsletter Email Template

### Status Values

- `Draft`: Email idea created but not processed
- `Generating`: Workflow is processing
- `Generated`: HTML email generated successfully
- `Failed`: Processing failed

