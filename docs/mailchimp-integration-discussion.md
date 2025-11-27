# Mailchimp Integration Discussion

## Overview
This document outlines what information we need to store in the app and what to send to the n8n workflow to create draft emails in Mailchimp.

---

## 1. Fields to Add to Email Ideas Table (Baserow)

### Required Fields for Mailchimp Integration

#### A. Email Campaign Metadata
- **Subject Line** (text field) - Required for Mailchimp campaigns
- **Preview Text** (text field) - Optional but recommended (appears in email client preview)
- **From Name** (text field) - Sender display name (e.g., "John from Company")
- **From Email** (email field) - Sender email address (must be verified in Mailchimp)
- **Reply-To Email** (email field) - Where replies should go (defaults to from email if empty)

#### B. Mailchimp Campaign Tracking
- **Mailchimp Campaign ID** (text field) - The ID of the created campaign in Mailchimp
- **Mailchimp Draft ID** (text field) - The ID of the draft email within the campaign
- **Mailchimp Campaign URL** (url field) - Direct link to edit/view the campaign in Mailchimp
- **Mailchimp Audience/List ID** (text field) - Which Mailchimp audience/list to send to
- **Mailchimp Segment ID** (text field, optional) - If targeting a specific segment within the list

#### C. Scheduling & Status
- **Mailchimp Send Status** (single select) - Options:
  - `Not Created` (default)
  - `Draft Created`
  - `Scheduled`
  - `Sent`
  - `Failed`
- **Mailchimp Scheduled Date** (date field, optional) - When to send if scheduled
- **Mailchimp Sent Date** (date field, optional) - When the email was actually sent

#### D. Campaign Settings (Optional but Recommended)
- **Mailchimp Campaign Type** (single select) - Options:
  - `Regular` (standard campaign)
  - `Plaintext` (plain text version)
  - `A/B Test` (if doing split testing)
- **Mailchimp Tracking Enabled** (boolean) - Whether to track opens/clicks
- **Mailchimp Auto Footer** (boolean) - Whether to include Mailchimp's default footer

---

## 2. What to Send to n8n Webhook Payload

### Current Payload Structure (Already Sending)
```json
{
  "client_id": "modern-management",
  "emailIdeaId": "123",
  "generatedHtml": "<html>...</html>",
  "emailType": "Promotional",
  "emailIdeaName": "Summer Sale Email",
  "baserow": {
    "baseUrl": "...",
    "databaseId": "...",
    "token": "...",
    "tableId": "730",
    "recordId": "123"
  },
  "emailIdeasFieldMappings": {
    "fieldIdToName": {...},
    "nameToFieldId": {...},
    "commonFields": {...}
  }
}
```

### Additional Fields to Add for Mailchimp

```json
{
  // ... existing payload fields ...
  
  // NEW: Mailchimp Configuration
  "mailchimp": {
    "apiKey": "YOUR_MAILCHIMP_API_KEY", // Or store per-client in app config
    "serverPrefix": "us1", // e.g., us1, us2, etc. (from API key or config)
    "audienceId": "abc123def456", // Required: Which Mailchimp audience/list
    "segmentId": null, // Optional: Specific segment within audience
    "campaignSettings": {
      "type": "regular", // regular, plaintext, ab_split
      "trackOpens": true,
      "trackClicks": true,
      "autoFooter": false
    }
  },
  
  // NEW: Email Campaign Details
  "emailCampaign": {
    "subjectLine": "Summer Sale - 50% Off Everything!", // Required
    "previewText": "Don't miss out on our biggest sale of the year!", // Optional
    "fromName": "John from Modern Management", // Required
    "fromEmail": "john@modernmanagement.com", // Required (must be verified)
    "replyToEmail": "support@modernmanagement.com", // Optional (defaults to fromEmail)
    "scheduledDate": null, // ISO date string if scheduling, null for draft
    "timezone": "America/New_York" // Optional, defaults to account timezone
  },
  
  // NEW: Mailchimp Field Mappings (for updating Baserow after creation)
  "mailchimpFieldMappings": {
    "mailchimpCampaignId": "field_XXXXX", // Field ID in Baserow
    "mailchimpDraftId": "field_XXXXX",
    "mailchimpCampaignUrl": "field_XXXXX",
    "mailchimpAudienceId": "field_XXXXX",
    "mailchimpSegmentId": "field_XXXXX",
    "mailchimpSendStatus": "field_XXXXX",
    "mailchimpScheduledDate": "field_XXXXX",
    "mailchimpSentDate": "field_XXXXX"
  }
}
```

---

## 3. What the n8n Workflow Should Do

### Step 1: Validate Input
- Check that `generatedHtml` exists and is valid HTML
- Verify `emailCampaign.subjectLine` is provided
- Verify `emailCampaign.fromName` and `emailCampaign.fromEmail` are provided
- Verify `mailchimp.audienceId` is provided
- Verify `mailchimp.apiKey` is valid

### Step 2: Create Mailchimp Campaign
1. **Create Campaign** using Mailchimp API:
   - POST to `/3.0/campaigns`
   - Set campaign type (regular, plaintext, etc.)
   - Set audience/list ID
   - Set campaign settings (tracking, etc.)

2. **Create Campaign Content**:
   - PUT to `/3.0/campaigns/{campaign_id}/content`
   - Set HTML content from `generatedHtml`
   - Optionally create plaintext version

3. **Set Campaign Settings**:
   - PUT to `/3.0/campaigns/{campaign_id}`
   - Set subject line
   - Set from name and email
   - Set reply-to email
   - Set preview text
   - If scheduled, set send time

### Step 3: Update Baserow Record
After successfully creating the Mailchimp campaign, update the email idea record in Baserow with:
- `mailchimpCampaignId` = campaign ID from Mailchimp
- `mailchimpDraftId` = draft ID (usually same as campaign ID for regular campaigns)
- `mailchimpCampaignUrl` = `https://{serverPrefix}.admin.mailchimp.com/campaigns/show/?id={campaign_id}`
- `mailchimpAudienceId` = audience ID used
- `mailchimpSegmentId` = segment ID if used
- `mailchimpSendStatus` = "Draft Created"
- `mailchimpScheduledDate` = scheduled date if provided
- `status` = "Draft Created" (or keep existing status)

### Step 4: Return Response
Return to the app:
```json
{
  "success": true,
  "mailchimpCampaignId": "abc123",
  "mailchimpCampaignUrl": "https://us1.admin.mailchimp.com/campaigns/show/?id=abc123",
  "message": "Draft email created successfully in Mailchimp"
}
```

---

## 4. Where to Store Mailchimp API Credentials

### Option A: Per-Client Configuration (Recommended)
Store in client config (similar to Baserow token):
```json
{
  "clientId": "modern-management",
  "mailchimp": {
    "apiKey": "abc123-us1",
    "serverPrefix": "us1",
    "defaultAudienceId": "def456",
    "defaultFromName": "Modern Management",
    "defaultFromEmail": "noreply@modernmanagement.com",
    "defaultReplyToEmail": "support@modernmanagement.com"
  }
}
```

### Option B: Environment Variables
Store as environment variables (less flexible for multi-client):
```
MAILCHIMP_API_KEY=abc123-us1
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_DEFAULT_AUDIENCE_ID=def456
```

### Option C: User Input in Form
Allow users to enter Mailchimp credentials when creating/sending email (most flexible but requires UI changes)

**Recommendation**: Use Option A (per-client config) with ability to override in the email idea form if needed.

---

## 5. UI/UX Considerations

### Email Idea Form Updates
Add new section for "Mailchimp Settings":
- Subject Line (required)
- Preview Text (optional)
- From Name (required, with default from client config)
- From Email (required, with default from client config)
- Reply-To Email (optional, defaults to from email)
- Audience/List (dropdown, populated from Mailchimp API or client config)
- Segment (optional dropdown, populated from selected audience)
- Schedule Date/Time (optional)
- Campaign Settings (checkboxes for tracking, auto footer, etc.)

### Email Ideas List View
Add columns:
- Mailchimp Status (badge showing Draft Created, Scheduled, Sent, etc.)
- Mailchimp Campaign Link (button to open in Mailchimp)

### Email Preview Modal
Add "Send to Mailchimp" button:
- Opens modal/form to configure Mailchimp settings
- Creates draft in Mailchimp
- Updates status in app

---

## 6. Questions to Discuss

1. **API Key Storage**: Should Mailchimp API keys be stored per-client in the app config, or entered by users per email?

2. **Audience Selection**: Should we:
   - Fetch audiences from Mailchimp API and show dropdown?
   - Store default audience per client in config?
   - Allow both (default + override)?

3. **Subject Line Source**: Should subject line:
   - Be a new field in the email idea form?
   - Be auto-generated from email idea name?
   - Be extracted from the generated HTML (if it contains a title)?

4. **Scheduling**: Should scheduling be:
   - Part of the initial "Send to Mailchimp" action?
   - A separate action after draft is created?
   - Both options available?

5. **Error Handling**: What should happen if:
   - Mailchimp API fails?
   - Email address is not verified in Mailchimp?
   - Audience doesn't exist?
   - HTML is invalid?

6. **Status Updates**: Should we:
   - Poll Mailchimp API to check if email was sent?
   - Use Mailchimp webhooks to update status?
   - Manual status updates only?

7. **Multiple Mailchimp Accounts**: Do clients need to support multiple Mailchimp accounts, or one per client?

---

## 7. Implementation Priority

### Phase 1: Basic Draft Creation
- Add Mailchimp fields to Email Ideas table
- Add Mailchimp settings to webhook payload
- Create n8n workflow to create draft in Mailchimp
- Update Baserow with Mailchimp campaign info

### Phase 2: UI Integration
- Add Mailchimp settings to email idea form
- Add "Send to Mailchimp" button/action
- Display Mailchimp status in list view
- Add link to Mailchimp campaign

### Phase 3: Advanced Features
- Scheduling support
- Segment targeting
- A/B testing
- Status polling/webhooks
- Multiple Mailchimp account support

---

## Next Steps

1. **Decide on API key storage approach** (per-client config recommended)
2. **Confirm required fields** for Email Ideas table
3. **Design the webhook payload structure** (use structure above as starting point)
4. **Plan the n8n workflow** (steps outlined above)
5. **Design UI changes** (form fields, buttons, status display)

Let's discuss these points and finalize the approach before implementation!

