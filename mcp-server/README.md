# Content Engine MCP Server

A Model Context Protocol (MCP) server that provides direct AI access to your Content Engine's Baserow data.

## Features

🤖 **AI-Powered Content Management**
- Get content ideas, social media posts, and images
- Create new content ideas and social media posts
- Update content status and metadata
- Get client statistics and analytics

🔗 **Direct Baserow Integration**
- Real-time access to your Baserow database
- Uses your existing table structure
- Supports all your configured clients

🛠️ **Available Tools**

### Content Ideas
- `get_content_ideas` - Retrieve all content ideas for a client
- `create_content_idea` - Create a new content idea

### Social Media Content
- `get_social_media_content` - Get social media posts with filtering
- `create_social_media_post` - Create a new social media post

### Images
- `get_images` - Retrieve images with status filtering

### Management
- `update_content_status` - Update status of any content
- `get_client_stats` - Get comprehensive client statistics

## Setup

### 1. Install Dependencies
```bash
cd mcp-server
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
```

Edit `.env` with your Baserow credentials:
```env
BASEROW_API_URL=https://baserow.aiautomata.co.za
BASEROW_MODERN_MANAGEMENT_TOKEN=your_actual_token_here
```

### 3. Build and Run
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Usage with AI Assistants

### Cursor Integration

1. Open Cursor settings (⇧+⌘+J)
2. Navigate to the "MCP" tab
3. Click "Add MCP Server"
4. Add this configuration:

```json
{
  "mcpServers": {
    "Content Engine": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "BASEROW_API_URL": "https://baserow.aiautomata.co.za",
        "BASEROW_MODERN_MANAGEMENT_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Example AI Interactions

Once connected, you can ask the AI things like:

- "Show me all content ideas for modern-management"
- "Create a new social media post for Facebook about our new product"
- "Get all completed images for the client"
- "Update the status of content idea #123 to 'Approved'"
- "What are the statistics for modern-management client?"

## API Reference

### get_content_ideas
Retrieve content ideas with optional filtering.

**Parameters:**
- `clientId` (required): Client identifier
- `limit` (optional): Number of ideas to retrieve (default: 50)

### get_social_media_content
Get social media posts with platform and status filtering.

**Parameters:**
- `clientId` (required): Client identifier
- `platform` (optional): Filter by platform (Facebook, Instagram, Twitter, etc.)
- `status` (optional): Filter by status (Draft, Approved, Published, etc.)
- `limit` (optional): Number of posts to retrieve (default: 50)

### create_content_idea
Create a new content idea.

**Parameters:**
- `clientId` (required): Client identifier
- `title` (required): Content idea title
- `description` (required): Content idea description
- `ideaType` (required): Type of idea (Social Media, Email, Blog, Video)
- `sourceType` (required): Source type (Manual, AI Generated, Scraped)

### create_social_media_post
Create a new social media post.

**Parameters:**
- `clientId` (required): Client identifier
- `post` (required): The social media post content
- `platform` (required): Social media platform
- `contentType` (required): Type of content (Text, Image, Video, Carousel)
- `characterCount` (optional): Character count (auto-calculated if not provided)
- `status` (optional): Post status (default: Draft)

### update_content_status
Update the status of any content record.

**Parameters:**
- `clientId` (required): Client identifier
- `tableType` (required): Type of content (contentIdeas, socialMediaContent, images)
- `recordId` (required): ID of the record to update
- `status` (required): New status value

### get_client_stats
Get comprehensive statistics for a client.

**Parameters:**
- `clientId` (required): Client identifier

## Security

⚠️ **Important Security Notes:**

- Keep your MCP server configuration secure
- The server has full access to your Baserow data
- Use environment variables for sensitive information
- Consider running the server in a secure environment for production

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your Baserow token and URL
2. **Permission Denied**: Ensure your token has the necessary permissions
3. **Table Not Found**: Verify your table IDs are correct

### Debug Mode

Run with debug logging:
```bash
DEBUG=mcp* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

