// Field mappings for Baserow tables
// These map Baserow field IDs to human-readable property names

// Social Media Content Table (712) Field Mapping
export const socialMediaContentFieldMapping = {
  "field_6920": "postId",
  "field_7144": "hook",
  "field_7145": "post",
  "field_7147": "cta",
  "field_7148": "hashtags",
  "field_6923": "platform",
  "field_6921": "contentType",
  "field_7149": "characterCount",
  "field_6922": "imagePrompt",
  "field_6929": "image", // This appears to be unused
  "field_7193": "images", // This is the actual linked field to Images table
  "field_6925": "angle",
  "field_6926": "intent",
  "field_7166": "contentTheme",
  "field_7167": "psychologicalTrigger",
  "field_7168": "engagementObjective",
  "field_7146": "comments",
  "field_7150": "engagementPrediction",
  "field_6950": "status",
  "field_6927": "approvedBy",
  "field_7152": "contentIdea", // Links to Content Ideas table
  "field_6928": "scheduledTime",
  "field_6930": "createdAt",
  "field_7151": "updatedAt"
} as const

// Brand Assets Table (728) Field Mapping
export const brandAssetsFieldMapping = {
  "field_7197": "assetName",
  "field_7155": "platform",
  "field_7156": "contentType",
  "field_7157": "assetType",
  "field_7158": "assetInformation",
  "field_7169": "brandVoiceGuidelines",
  "field_7170": "approvedHashtags",
  "field_7171": "toneStylePreferences",
  "field_7172": "forbiddenWordsTopics",
  "field_7173": "platformSpecificRules",
  "field_7159": "file",
  "field_7160": "fileUrl",
  "field_7161": "status",
  "field_7162": "priority",
  "field_7163": "createdDate",
  "field_7164": "lastUpdated",
  "field_7165": "notes"
} as const

// Images Table (729) Field Mapping
export const imagesFieldMapping = {
  "field_7177": "imageId", // Auto number
  "field_7178": "image", // Main image field (File)
  "field_7179": "imagePrompt", // Image Prompt (Long Text)
  "field_7180": "imageType", // Image Type (Single Select)
  "field_7181": "imageScene", // Image Scene (Long Text)
  "field_7182": "imageStyle", // Image Style (Single Select)
  "field_7183": "imageModel", // Image Model (Single Select)
  "field_7184": "imageSize", // Image Size (Single Select)
  "field_7185": "imageStatus", // Image Status (Single Select)
  "field_7186": "referenceImage", // Reference Image (File)
  "field_7187": "referenceUrl", // Reference URL
  "field_7188": "captionText", // Caption Text (Single Line text)
  "field_7189": "captionFontStyle", // Caption Font Style (Single Select)
  "field_7190": "captionFontSize", // Caption Font Size (Single Select)
  "field_7191": "captionPosition", // Caption Position (Single Select)
  "field_7228": "voiceNote", // Voice Note (File)
  "field_7192": "socialMediaContent", // Links to Social Media Content table
  "field_7194": "clientId", // Client ID
  "field_7195": "createdAt", // Created At
  "field_7196": "acceptedAt", // Accepted At
  "field_7225": "emailIdeas", // Linked to email ideas
  "field_7226": "emailImages", // Email image position (Single Select)
  "field_7227": "imageLinkUrl" // Image Link URL (URL field)
} as const

// Email Ideas Table (730) Field Mapping
export const emailIdeasFieldMapping = {
  "field_7198": "emailId", // Auto Number
  "field_7199": "emailIdeaName",
  "field_7201": "emailType",
  "field_7202": "hook",
  "field_7203": "cta",
  "field_7211": "emailTextIdea",
  "field_7213": "emailVoiceIdea", // File
  "field_7212": "emailUrlIdea", // URL
  "field_7214": "emailVideoIdea", // File
  "field_7215": "emailImageIdea", // File
  "field_7200": "status",
  "field_7216": "lastModified",
  "field_7217": "createdDate",
  "field_7221": "templates", // Link to Templates table
  "field_7223": "generatedHtml",
  "field_7224": "images" // Link to Images table
} as const

// Templates Table (731) Field Mapping
export const templatesFieldMapping = {
  "field_7204": "templateId", // Auto Number
  "field_7205": "templateName",
  "field_7207": "templateType",
  "field_7206": "templateCategory",
  "field_7208": "htmlTemplate",
  "field_7209": "cssStyles",
  "field_7210": "isActive",
  "field_7218": "lastModified",
  "field_7219": "createdDate"
} as const

// Image Ideas Table (732) Field Mapping
export const imageIdeasFieldMapping = {
  "field_7228": "imageIdeaId", // Auto Number
  "field_7229": "imageIdeaName", // Single Line Text
  "field_7230": "imagePrompt", // Long Text
  "field_7231": "imageScene", // Long Text
  "field_7232": "imageType", // Single Select
  "field_7233": "imageStyle", // Single Select
  "field_7234": "imageModel", // Single Select
  "field_7235": "imageSize", // Single Select
  "field_7236": "referenceImage", // File
  "field_7237": "referenceUrl", // URL
  "field_7238": "voiceNote", // File
  "field_7239": "operationType", // Single Select (generate, combine, edit, browse)
  "field_7240": "selectedImages", // Link to Images table (for combine/edit operations)
  "field_7241": "uploadedImages", // File (for combine/edit operations)
  "field_7242": "generatedImage", // File (result)
  "field_7243": "imageStatus", // Single Select
  "field_7244": "createdAt", // Created Date
  "field_7245": "updatedAt", // Last Modified
  "field_7246": "notes" // Long Text
} as const

// Reverse mappings for converting from human-readable names to field IDs
export const socialMediaContentReverseMapping = Object.fromEntries(
  Object.entries(socialMediaContentFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

export const brandAssetsReverseMapping = Object.fromEntries(
  Object.entries(brandAssetsFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

export const imagesReverseMapping = Object.fromEntries(
  Object.entries(imagesFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

export const emailIdeasReverseMapping = Object.fromEntries(
  Object.entries(emailIdeasFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

export const templatesReverseMapping = Object.fromEntries(
  Object.entries(templatesFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

export const imageIdeasReverseMapping = Object.fromEntries(
  Object.entries(imageIdeasFieldMapping).map(([fieldId, propName]) => [propName, fieldId])
) as Record<string, string>

// Helper function to safely extract values from Baserow fields
const extractBaserowValue = (fieldValue: any): any => {
  if (fieldValue === null || fieldValue === undefined) {
    return fieldValue
  }
  
  // If it's an object with a 'value' property (Baserow select field), extract the value
  if (typeof fieldValue === 'object' && fieldValue !== null && 'value' in fieldValue) {
    return fieldValue.value
  }
  
  // If it's an array of objects with 'value' properties, extract the values
  if (Array.isArray(fieldValue) && fieldValue.length > 0 && typeof fieldValue[0] === 'object' && fieldValue[0] !== null && 'value' in fieldValue[0]) {
    return fieldValue.map(item => item.value)
  }
  
  // If it's an array of file objects (Baserow file field), extract the URL from the first file
  if (Array.isArray(fieldValue) && fieldValue.length > 0 && typeof fieldValue[0] === 'object' && fieldValue[0] !== null && 'url' in fieldValue[0]) {
    return fieldValue[0].url // Return the URL of the first file
  }
  
  // Otherwise, return the value as is
  return fieldValue
}

// Utility functions for field mapping
export const mapSocialMediaContentFromBaserow = (baserowData: any) => {
  const mapped: any = {}
  for (const [fieldId, propName] of Object.entries(socialMediaContentFieldMapping)) {
    if (baserowData[fieldId] !== undefined) {
      mapped[propName] = extractBaserowValue(baserowData[fieldId])
    }
  }
  return mapped
}

export const mapSocialMediaContentToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = socialMediaContentReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}

export const mapBrandAssetsFromBaserow = (baserowData: any) => {
  const mapped: any = {}
  for (const [fieldId, propName] of Object.entries(brandAssetsFieldMapping)) {
    if (baserowData[fieldId] !== undefined) {
      mapped[propName] = extractBaserowValue(baserowData[fieldId])
    }
  }
  return mapped
}

export const mapBrandAssetsToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = brandAssetsReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}

export const mapImagesFromBaserow = (baserowData: any) => {
  const mapped: any = {
    id: baserowData.id // Preserve the Baserow record ID
  }
  for (const [fieldId, propName] of Object.entries(imagesFieldMapping)) {
    if (baserowData[fieldId] !== undefined) {
      mapped[propName] = extractBaserowValue(baserowData[fieldId])
    }
  }
  return mapped
}

export const mapImagesToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = imagesReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}

export const mapEmailIdeasFromBaserow = (baserowData: any) => {
  const mapped: any = {}
  for (const [fieldId, propName] of Object.entries(emailIdeasFieldMapping)) {
    // Always include the field, even if undefined, null, or empty string
    // This ensures fields like generatedHtml are always present in the mapped result
    if (baserowData.hasOwnProperty(fieldId)) {
      mapped[propName] = extractBaserowValue(baserowData[fieldId])
    } else {
      // Field doesn't exist in Baserow response, set to empty string or null
      mapped[propName] = ''
    }
  }
  
  // Ensure generatedHtml is always present (important for displaying workflow-generated content)
  if (!mapped.hasOwnProperty('generatedHtml')) {
    // Try to find it by field ID directly
    const generatedHtmlFieldId = 'field_7223'
    if (baserowData.hasOwnProperty(generatedHtmlFieldId)) {
      mapped.generatedHtml = extractBaserowValue(baserowData[generatedHtmlFieldId])
    } else {
      mapped.generatedHtml = ''
    }
  }
  
  return mapped
}

export const mapEmailIdeasToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = emailIdeasReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}

export const mapTemplatesFromBaserow = (baserowData: any) => {
  const mapped: any = {}
  for (const [fieldId, propName] of Object.entries(templatesFieldMapping)) {
    if (baserowData[fieldId] !== undefined) {
      mapped[propName] = extractBaserowValue(baserowData[fieldId])
    }
  }
  return mapped
}

export const mapTemplatesToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = templatesReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}

export const mapImageIdeasFromBaserow = (baserowData: any) => {
  const mapped: any = {
    id: baserowData.id // Preserve the Baserow record ID
  }
  for (const [fieldId, propName] of Object.entries(imageIdeasFieldMapping)) {
    if (baserowData[fieldId] !== undefined) {
      let value = baserowData[fieldId]
      
      // Handle single select fields that return objects with {id, value, color}
      if (typeof value === 'object' && value !== null && 'value' in value) {
        value = value.value
      }
      
      mapped[propName] = value
    }
  }
  return mapped
}

export const mapImageIdeasToBaserow = (data: any) => {
  const mapped: any = {}
  for (const [propName, value] of Object.entries(data)) {
    const fieldId = imageIdeasReverseMapping[propName]
    if (fieldId && value !== undefined) {
      mapped[fieldId] = value
    }
  }
  return mapped
}