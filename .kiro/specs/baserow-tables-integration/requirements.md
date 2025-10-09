# Requirements Document

## Introduction

This feature extends the Content Engine to integrate with two new Baserow tables for Modern Management: Social Media Content (712) and Brand Asset (728). This will enable the system to store generated social media posts and manage brand assets/guidelines that inform content creation.

## Requirements

### Requirement 1: Social Media Content Table Integration

**User Story:** As a content creator, I want the system to store generated social media posts in a dedicated table, so that I can track, review, and manage all created content.

#### Acceptance Criteria

1. WHEN a content idea is processed by n8n THEN the system SHALL create records in the Social Media Content table (712)
2. WHEN storing social media content THEN the system SHALL map all relevant fields including Post ID, Hook, Post, CTA, Hashtags, Platform, etc.
3. WHEN content is generated THEN the system SHALL link it back to the original Content Idea record
4. WHEN viewing content ideas THEN users SHALL be able to see associated generated social media posts
5. WHEN content status changes THEN the system SHALL update the Status field appropriately

### Requirement 2: Brand Asset Management

**User Story:** As a content manager, I want to store and manage brand assets and guidelines, so that AI content generation can follow consistent brand voice and visual standards.

#### Acceptance Criteria

1. WHEN creating brand assets THEN the system SHALL support multiple asset types (Brand Voice, Visual Asset, Template, Guidelines)
2. WHEN storing brand assets THEN the system SHALL categorize by platform (Facebook, Instagram, X, LinkedIn, etc.)
3. WHEN uploading assets THEN the system SHALL support both file uploads and external URLs
4. WHEN managing assets THEN the system SHALL track status (Active, Inactive, Draft) and priority levels
5. WHEN AI generates content THEN the system SHALL reference relevant brand assets based on platform and content type

### Requirement 3: Environment Configuration Updates

**User Story:** As a developer, I want the new table configurations in environment variables, so that the system can connect to the correct Baserow tables.

#### Acceptance Criteria

1. WHEN configuring the system THEN environment variables SHALL include the new table IDs
2. WHEN accessing tables THEN the client configuration SHALL map to correct table IDs
3. WHEN switching between clients THEN the system SHALL use client-specific table configurations

### Requirement 4: API Integration

**User Story:** As a system integrator, I want API endpoints for the new tables, so that the frontend can perform CRUD operations on social media content and brand assets.

#### Acceptance Criteria

1. WHEN accessing social media content THEN the system SHALL provide GET/POST/PATCH endpoints
2. WHEN managing brand assets THEN the system SHALL provide full CRUD operations
3. WHEN creating records THEN the system SHALL validate required fields and data types
4. WHEN querying data THEN the system SHALL support filtering by platform, status, and content type

### Requirement 5: UI Components

**User Story:** As a content creator, I want user interfaces for managing social media content and brand assets, so that I can easily view, edit, and organize content.

#### Acceptance Criteria

1. WHEN viewing content ideas THEN users SHALL see a list of generated social media posts
2. WHEN managing brand assets THEN users SHALL have a dedicated management interface
3. WHEN creating brand assets THEN the system SHALL provide forms for all asset types
4. WHEN viewing social media content THEN users SHALL see all relevant fields in a readable format
5. WHEN editing content THEN users SHALL be able to update status, scheduling, and content fields

### Requirement 6: n8n Webhook Integration

**User Story:** As an automation user, I want n8n workflows to create social media content records, so that generated content is automatically stored and linked to content ideas.

#### Acceptance Criteria

1. WHEN n8n generates content THEN it SHALL create records in the Social Media Content table
2. WHEN creating social media records THEN the system SHALL link them to the originating Content Idea
3. WHEN content is generated THEN all relevant fields SHALL be populated from the n8n workflow
4. WHEN workflows complete THEN the system SHALL update the original Content Idea status