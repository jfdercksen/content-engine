#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Content Engine MCP Server
class ContentEngineMCPServer {
    server;
    baserowUrl;
    baserowToken;
    constructor() {
        this.server = new Server({
            name: 'content-engine-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.baserowUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za';
        this.baserowToken = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || '';
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_content_ideas',
                        description: 'Get all content ideas for a client',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of ideas to retrieve (default: 50)',
                                    default: 50,
                                },
                            },
                            required: ['clientId'],
                        },
                    },
                    {
                        name: 'get_social_media_content',
                        description: 'Get social media content for a client',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                platform: {
                                    type: 'string',
                                    description: 'Filter by platform (Facebook, Instagram, Twitter, etc.)',
                                },
                                status: {
                                    type: 'string',
                                    description: 'Filter by status (Draft, Approved, Published, etc.)',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of posts to retrieve (default: 50)',
                                    default: 50,
                                },
                            },
                            required: ['clientId'],
                        },
                    },
                    {
                        name: 'get_images',
                        description: 'Get images from the images table',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                status: {
                                    type: 'string',
                                    description: 'Filter by image status (Generating, Completed, Failed, etc.)',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of images to retrieve (default: 50)',
                                    default: 50,
                                },
                            },
                            required: ['clientId'],
                        },
                    },
                    {
                        name: 'create_content_idea',
                        description: 'Create a new content idea',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                title: {
                                    type: 'string',
                                    description: 'Content idea title',
                                },
                                description: {
                                    type: 'string',
                                    description: 'Content idea description',
                                },
                                ideaType: {
                                    type: 'string',
                                    description: 'Type of idea (Social Media, Email, Blog, Video)',
                                    enum: ['Social Media', 'Email', 'Blog', 'Video'],
                                },
                                sourceType: {
                                    type: 'string',
                                    description: 'Source type (Manual, AI Generated, Scraped)',
                                    enum: ['Manual', 'AI Generated', 'Scraped'],
                                },
                            },
                            required: ['clientId', 'title', 'description', 'ideaType', 'sourceType'],
                        },
                    },
                    {
                        name: 'create_social_media_post',
                        description: 'Create a new social media post',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                post: {
                                    type: 'string',
                                    description: 'The social media post content',
                                },
                                platform: {
                                    type: 'string',
                                    description: 'Social media platform',
                                    enum: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'],
                                },
                                contentType: {
                                    type: 'string',
                                    description: 'Type of content',
                                    enum: ['Text', 'Image', 'Video', 'Carousel'],
                                },
                                characterCount: {
                                    type: 'number',
                                    description: 'Character count of the post',
                                },
                                status: {
                                    type: 'string',
                                    description: 'Post status',
                                    enum: ['Draft', 'Approved', 'Published', 'Scheduled'],
                                    default: 'Draft',
                                },
                            },
                            required: ['clientId', 'post', 'platform', 'contentType'],
                        },
                    },
                    {
                        name: 'update_content_status',
                        description: 'Update the status of content (idea or post)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                                tableType: {
                                    type: 'string',
                                    description: 'Type of content to update',
                                    enum: ['contentIdeas', 'socialMediaContent', 'images'],
                                },
                                recordId: {
                                    type: 'number',
                                    description: 'ID of the record to update',
                                },
                                status: {
                                    type: 'string',
                                    description: 'New status value',
                                },
                            },
                            required: ['clientId', 'tableType', 'recordId', 'status'],
                        },
                    },
                    {
                        name: 'get_client_stats',
                        description: 'Get statistics for a client',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Client ID (e.g., modern-management)',
                                },
                            },
                            required: ['clientId'],
                        },
                    },
                    {
                        name: 'get_all_clients',
                        description: 'Get list of all configured clients',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'create_new_client',
                        description: 'Create a new client configuration (without Baserow setup)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clientId: {
                                    type: 'string',
                                    description: 'Unique client identifier',
                                },
                                displayName: {
                                    type: 'string',
                                    description: 'Human-readable client name',
                                },
                                baserowToken: {
                                    type: 'string',
                                    description: 'Baserow API token for the client',
                                },
                                databaseId: {
                                    type: 'string',
                                    description: 'Baserow database ID',
                                },
                                tableIds: {
                                    type: 'object',
                                    description: 'Object with table IDs for each table type',
                                    properties: {
                                        contentIdeas: { type: 'string' },
                                        socialMediaContent: { type: 'string' },
                                        images: { type: 'string' },
                                        brandAssets: { type: 'string' },
                                        emailIdeas: { type: 'string' },
                                        templates: { type: 'string' },
                                    },
                                },
                            },
                            required: ['clientId', 'displayName', 'baserowToken', 'databaseId', 'tableIds'],
                        },
                    },
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'get_content_ideas':
                        return await this.getContentIdeas(args);
                    case 'get_social_media_content':
                        return await this.getSocialMediaContent(args);
                    case 'get_images':
                        return await this.getImages(args);
                    case 'create_content_idea':
                        return await this.createContentIdea(args);
                    case 'create_social_media_post':
                        return await this.createSocialMediaPost(args);
                    case 'update_content_status':
                        return await this.updateContentStatus(args);
                    case 'get_client_stats':
                        return await this.getClientStats(args);
                    case 'get_all_clients':
                        return await this.getAllClients();
                    case 'create_new_client':
                        return await this.createNewClient(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async getContentIdeas(args) {
        const { clientId, limit = 50 } = args;
        // Get client configuration
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables.contentIdeas;
        const response = await fetch(`${this.baserowUrl}/api/database/rows/table/${tableId}/?size=${limit}`, {
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch content ideas: ${response.statusText}`);
        }
        const data = await response.json();
        const ideas = data.results.map((idea) => ({
            id: idea.id,
            title: idea.field_6920 || 'Untitled',
            description: idea.field_6921 || '',
            ideaType: idea.field_6922?.value || 'Unknown',
            sourceType: idea.field_6923?.value || 'Unknown',
            status: idea.field_6924?.value || 'Draft',
            createdAt: idea.field_6925 || '',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${ideas.length} content ideas for ${clientId}:\n\n${ideas
                        .map((idea) => `• ${idea.title} (${idea.ideaType}) - ${idea.status}\n  ${idea.description.substring(0, 100)}...`)
                        .join('\n\n')}`,
                },
            ],
        };
    }
    async getSocialMediaContent(args) {
        const { clientId, platform, status, limit = 50 } = args;
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables.socialMediaContent;
        let url = `${this.baserowUrl}/api/database/rows/table/${tableId}/?size=${limit}`;
        // Add filters
        const filters = [];
        if (platform)
            filters.push(`filter__field_6923__equal=${platform}`);
        if (status)
            filters.push(`filter__field_6950__equal=${status}`);
        if (filters.length > 0) {
            url += `&${filters.join('&')}`;
        }
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch social media content: ${response.statusText}`);
        }
        const data = await response.json();
        const posts = data.results.map((post) => ({
            id: post.id,
            post: post.field_7145 || '',
            platform: post.field_6923?.value || 'Unknown',
            contentType: post.field_6921?.value || 'Text',
            characterCount: post.field_7149 || 0,
            status: post.field_6950?.value || 'Draft',
            createdAt: post.field_6930 || '',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${posts.length} social media posts for ${clientId}:\n\n${posts
                        .map((post) => `• ${post.platform} (${post.contentType}) - ${post.status}\n  "${post.post.substring(0, 100)}..."\n  Characters: ${post.characterCount}`)
                        .join('\n\n')}`,
                },
            ],
        };
    }
    async getImages(args) {
        const { clientId, status, limit = 50 } = args;
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables.images;
        let url = `${this.baserowUrl}/api/database/rows/table/${tableId}/?size=${limit}`;
        if (status) {
            url += `&filter__field_7185__equal=${status}`;
        }
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.statusText}`);
        }
        const data = await response.json();
        const images = data.results.map((image) => ({
            id: image.id,
            imagePrompt: image.field_7179 || '',
            imageType: image.field_7180?.value || 'Unknown',
            imageScene: image.field_7181 || '',
            imageStyle: image.field_7182?.value || 'Unknown',
            imageStatus: image.field_7185?.value || 'Unknown',
            imageUrl: image.field_7178?.[0]?.url || '',
            createdAt: image.created_at || '',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${images.length} images for ${clientId}:\n\n${images
                        .map((image) => `• Image #${image.id} (${image.imageType}) - ${image.imageStatus}\n  Prompt: "${image.imagePrompt}"\n  Style: ${image.imageStyle}${image.imageUrl ? `\n  URL: ${image.imageUrl}` : ''}`)
                        .join('\n\n')}`,
                },
            ],
        };
    }
    async createContentIdea(args) {
        const { clientId, title, description, ideaType, sourceType } = args;
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables.contentIdeas;
        const response = await fetch(`${this.baserowUrl}/api/database/rows/table/${tableId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field_6920: title,
                field_6921: description,
                field_6922: ideaType,
                field_6923: sourceType,
                field_6924: 'Draft',
                field_6925: new Date().toISOString(),
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create content idea: ${response.statusText}`);
        }
        const result = await response.json();
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Content idea created successfully!\n\nID: ${result.id}\nTitle: ${title}\nType: ${ideaType}\nSource: ${sourceType}\nStatus: Draft`,
                },
            ],
        };
    }
    async createSocialMediaPost(args) {
        const { clientId, post, platform, contentType, characterCount, status = 'Draft' } = args;
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables.socialMediaContent;
        const response = await fetch(`${this.baserowUrl}/api/database/rows/table/${tableId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field_7145: post,
                field_6923: platform,
                field_6921: contentType,
                field_7149: characterCount || post.length,
                field_6950: status,
                field_6930: new Date().toISOString(),
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create social media post: ${response.statusText}`);
        }
        const result = await response.json();
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Social media post created successfully!\n\nID: ${result.id}\nPlatform: ${platform}\nType: ${contentType}\nStatus: ${status}\nCharacters: ${characterCount || post.length}\n\nContent:\n"${post}"`,
                },
            ],
        };
    }
    async updateContentStatus(args) {
        const { clientId, tableType, recordId, status } = args;
        const clientConfig = this.getClientConfig(clientId);
        const tableId = clientConfig.tables[tableType];
        if (!tableId) {
            throw new Error(`Invalid table type: ${tableType}`);
        }
        // Map status field based on table type
        const statusFieldMap = {
            contentIdeas: 'field_6924',
            socialMediaContent: 'field_6950',
            images: 'field_7185',
        };
        const statusField = statusFieldMap[tableType];
        if (!statusField) {
            throw new Error(`No status field mapping for table type: ${tableType}`);
        }
        const response = await fetch(`${this.baserowUrl}/api/database/rows/table/${tableId}/${recordId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${clientConfig.baserowToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                [statusField]: status,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to update status: ${response.statusText}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Status updated successfully!\n\nTable: ${tableType}\nRecord ID: ${recordId}\nNew Status: ${status}`,
                },
            ],
        };
    }
    async getClientStats(args) {
        const { clientId } = args;
        const clientConfig = this.getClientConfig(clientId);
        // Get counts from different tables
        const [contentIdeas, socialMediaContent, images] = await Promise.all([
            this.getTableCount(clientConfig.tables.contentIdeas),
            this.getTableCount(clientConfig.tables.socialMediaContent),
            this.getTableCount(clientConfig.tables.images),
        ]);
        return {
            content: [
                {
                    type: 'text',
                    text: `📊 Client Statistics for ${clientId}:\n\n• Content Ideas: ${contentIdeas}\n• Social Media Posts: ${socialMediaContent}\n• Images: ${images}\n\nTotal Records: ${contentIdeas + socialMediaContent + images}`,
                },
            ],
        };
    }
    async getTableCount(tableId) {
        try {
            const response = await fetch(`${this.baserowUrl}/api/database/rows/table/${tableId}/?size=1`, {
                headers: {
                    'Authorization': `Token ${this.baserowToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                return 0;
            }
            const data = await response.json();
            return data.count || 0;
        }
        catch {
            return 0;
        }
    }
    async getAllClients() {
        const clients = [
            {
                id: 'modern-management',
                name: 'Modern Management',
                status: 'Active',
                tables: 7,
                lastActivity: '2024-01-15'
            },
            {
                id: 'client1',
                name: 'Modern Management (Legacy)',
                status: 'Active',
                tables: 7,
                lastActivity: '2024-01-10'
            }
        ];
        return {
            content: [
                {
                    type: 'text',
                    text: `📋 Available Clients (${clients.length}):\n\n${clients
                        .map((client) => `• ${client.name} (${client.id})\n  Status: ${client.status}\n  Tables: ${client.tables}\n  Last Activity: ${client.lastActivity}`)
                        .join('\n\n')}`,
                },
            ],
        };
    }
    async createNewClient(args) {
        const { clientId, displayName, baserowToken, databaseId, tableIds } = args;
        // Validate that client doesn't already exist
        try {
            this.getClientConfig(clientId);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error: Client '${clientId}' already exists. Please choose a different client ID.`,
                    },
                ],
                isError: true,
            };
        }
        catch {
            // Client doesn't exist, which is good
        }
        // For now, this is a placeholder implementation
        // In a real implementation, this would:
        // 1. Validate the Baserow token and database/table IDs
        // 2. Store the client configuration in a database
        // 3. Update the runtime client configurations
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Client configuration created successfully!\n\n` +
                        `Client ID: ${clientId}\n` +
                        `Display Name: ${displayName}\n` +
                        `Database ID: ${databaseId}\n` +
                        `Tables Configured: ${Object.keys(tableIds).length}\n\n` +
                        `⚠️ Note: This is a placeholder implementation. In production, this would:\n` +
                        `- Validate Baserow credentials\n` +
                        `- Store configuration in database\n` +
                        `- Update runtime client registry`,
                },
            ],
        };
    }
    getClientConfig(clientId) {
        // Client configurations mapping - this mirrors your existing client configs
        const clientConfigs = {
            'modern-management': {
                tables: {
                    contentIdeas: '721',
                    socialMediaContent: '712',
                    images: '729',
                    brandAssets: '728',
                    emailIdeas: '730',
                    templates: '731',
                    imageIdeas: '732'
                },
                baserowToken: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1',
                databaseId: '176'
            },
            'client1': {
                tables: {
                    contentIdeas: '721',
                    socialMediaContent: '712',
                    images: '729',
                    brandAssets: '728',
                    emailIdeas: '730',
                    templates: '731',
                    imageIdeas: '732'
                },
                baserowToken: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1',
                databaseId: '176'
            }
        };
        const config = clientConfigs[clientId];
        if (!config) {
            throw new Error(`Client configuration not found: ${clientId}. Available clients: ${Object.keys(clientConfigs).join(', ')}`);
        }
        return config;
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Content Engine MCP server running on stdio');
    }
}
const server = new ContentEngineMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map