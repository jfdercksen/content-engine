# Implementation Plan

- [ ] 1. Extend BaserowAPI with social media posts fetching capability
  - Add `getSocialMediaPostsByContentIdea` method to BaserowAPI class
  - Implement proper filtering to query posts linked to specific content idea
  - Add error handling and response validation
  - _Requirements: 2.1, 2.3_

- [ ] 2. Create API route for fetching social media posts by content idea
  - Create `/api/baserow/[clientId]/social-media-posts/[contentIdeaId]/route.ts`
  - Implement GET handler that uses BaserowAPI to fetch linked posts
  - Add proper error handling and response formatting
  - Include client validation and authentication
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Create PostsViewer component for displaying social media posts
  - Create `src/components/posts/PostsViewer.tsx` component
  - Implement modal layout with proper responsive design
  - Add loading states and error handling UI
  - Include empty state when no posts are found
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2_

- [ ] 4. Create PostCard component for individual post display
  - Create `src/components/posts/PostCard.tsx` component
  - Display post content, platform, status, and creation date
  - Handle media files display and links
  - Add proper styling and responsive layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2_

- [ ] 5. Add "Open" button to ContentIdeasTable component
  - Modify `src/components/tables/ContentIdeasTable.tsx`
  - Add "Open" button to each content idea card
  - Implement click handler to open posts viewer
  - Add conditional rendering based on posts availability
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Integrate PostsViewer with ContentIdeasTable
  - Add state management for modal visibility in ContentIdeasTable
  - Pass necessary props (contentIdeaId, clientId) to PostsViewer
  - Implement proper modal opening/closing behavior
  - Add keyboard and accessibility support
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 5.3, 5.4_

- [ ] 7. Add TypeScript interfaces for social media posts
  - Create `src/types/posts.ts` with SocialMediaPost interface
  - Define PostsResponse interface for API responses
  - Add proper typing for component props
  - Export types for use across components
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Implement error handling and loading states
  - Add error boundaries for PostsViewer component
  - Implement retry functionality for failed API calls
  - Add skeleton loading states while fetching posts
  - Create user-friendly error messages
  - _Requirements: 2.3, 5.1, 5.2_

- [ ] 9. Add unit tests for BaserowAPI posts method
  - Create tests for `getSocialMediaPostsByContentIdea` method
  - Test successful responses and error scenarios
  - Mock Baserow API responses for testing
  - Verify proper filtering and data transformation
  - _Requirements: 2.1, 2.3_

- [ ] 10. Add integration tests for posts API route
  - Create tests for the social media posts API endpoint
  - Test various scenarios (success, not found, errors)
  - Verify client validation and proper response formatting
  - Test with different content idea IDs and client configurations
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 11. Add component tests for PostsViewer
  - Create tests for PostsViewer component rendering
  - Test modal opening/closing behavior
  - Test loading states, error states, and empty states
  - Verify accessibility features and keyboard navigation
  - _Requirements: 2.2, 4.1, 4.2, 4.3, 5.3, 5.4_

- [ ] 12. Update social media page to support posts viewing
  - Modify `src/app/dashboard/[clientId]/social-media/page.tsx`
  - Ensure PostsViewer integration works properly
  - Test the complete flow from content idea creation to posts viewing
  - Verify responsive behavior on different screen sizes
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 5.1, 5.2_