# Requirements Document

## Introduction

This feature enables users to view all social media posts that were generated from a specific content idea. After the n8n workflow processes a content idea and creates multiple social media posts across different platforms, users need a way to easily access and review all the generated content. This feature adds an "Open" button to content idea rows that displays all linked social media posts in a dedicated view.

## Requirements

### Requirement 1

**User Story:** As a content manager, I want to see an "Open" button on each content idea row, so that I can quickly access the generated posts for that idea.

#### Acceptance Criteria

1. WHEN viewing the content ideas table THEN the system SHALL display an "Open" button in each row
2. WHEN a content idea has no linked posts THEN the system SHALL disable or hide the "Open" button
3. WHEN a content idea has linked posts THEN the system SHALL enable the "Open" button with appropriate visual styling

### Requirement 2

**User Story:** As a content manager, I want to click the "Open" button and see all generated posts for that content idea, so that I can review the content created by the n8n workflow.

#### Acceptance Criteria

1. WHEN I click the "Open" button THEN the system SHALL fetch all social media posts linked to that content idea
2. WHEN the posts are loaded THEN the system SHALL display them in a dedicated view or modal
3. WHEN there are no posts found THEN the system SHALL display an appropriate message indicating no posts exist
4. WHEN there is an error fetching posts THEN the system SHALL display an error message to the user

### Requirement 3

**User Story:** As a content manager, I want to see detailed information about each generated post, so that I can understand what content was created for each platform.

#### Acceptance Criteria

1. WHEN viewing the posts THEN the system SHALL display the post content/text
2. WHEN viewing the posts THEN the system SHALL display the target platform for each post
3. WHEN viewing the posts THEN the system SHALL display the post status (if available)
4. WHEN viewing the posts THEN the system SHALL display creation date/time
5. WHEN posts have associated media THEN the system SHALL display or link to the media files

### Requirement 4

**User Story:** As a content manager, I want to easily navigate back to the content ideas list, so that I can review other content ideas without losing my place.

#### Acceptance Criteria

1. WHEN viewing the posts THEN the system SHALL provide a clear way to close the view
2. WHEN I close the posts view THEN the system SHALL return me to the content ideas table
3. WHEN using a modal approach THEN the system SHALL allow closing via escape key or clicking outside
4. WHEN using a dedicated page THEN the system SHALL provide a back button or breadcrumb navigation

### Requirement 5

**User Story:** As a content manager, I want the posts view to be responsive and accessible, so that I can use it effectively on different devices and screen sizes.

#### Acceptance Criteria

1. WHEN viewing posts on mobile devices THEN the system SHALL display content in a mobile-friendly layout
2. WHEN viewing posts on desktop THEN the system SHALL utilize available screen space effectively
3. WHEN using keyboard navigation THEN the system SHALL support proper tab order and focus management
4. WHEN using screen readers THEN the system SHALL provide appropriate ARIA labels and descriptions