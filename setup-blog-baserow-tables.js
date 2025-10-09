#!/usr/bin/env node

/**
 * Setup Script for Blog Workflow Baserow Tables
 * This script creates all necessary tables and fields for the blog post workflow
 * Client: Modern Management
 */

const BASEROW_BASE_URL = 'https://baserow.aiautomata.co.za';
const BASEROW_TOKEN = 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1';
const DATABASE_ID = 176; // Modern Management database ID

// Table configurations
const TABLE_CONFIGS = {
  blogPosts: {
    name: 'Blog_Posts',
    description: 'Store all blog post data and metadata',
    fields: [
      { name: 'Client ID', type: 'link_row', link_row_table: 'Clients', required: true },
      { name: 'Title', type: 'text', required: true },
      { name: 'Slug', type: 'text', required: true },
      { name: 'Content', type: 'long_text', required: true },
      { name: 'Meta Title', type: 'text', required: false },
      { name: 'Meta Description', type: 'long_text', required: false },
      { name: 'Focus Keyword', type: 'text', required: false },
      { name: 'Secondary Keywords', type: 'multiple_select', required: false },
      { name: 'Status', type: 'single_select', required: true, select_options: [
        { value: 'draft', color: 'orange' },
        { value: 'processing', color: 'blue' },
        { value: 'review', color: 'yellow' },
        { value: 'published', color: 'green' },
        { value: 'archived', color: 'gray' }
      ]},
      { name: 'SEO Score', type: 'number', number_decimal_places: 1, required: false },
      { name: 'Word Count', type: 'number', required: false },
      { name: 'Readability Score', type: 'number', number_decimal_places: 1, required: false },
      { name: 'Created At', type: 'created_on', required: true },
      { name: 'Updated At', type: 'last_modified', required: true },
      { name: 'Scheduled Publish Date', type: 'date', required: false },
      { name: 'Author ID', type: 'text', required: false },
      { name: 'Featured Image Prompt', type: 'long_text', required: false },
      { name: 'Alt Texts', type: 'long_text', required: false },
      { name: 'Internal Links', type: 'long_text', required: false },
      { name: 'External Sources', type: 'long_text', required: false },
      { name: 'Category', type: 'single_select', required: false, select_options: [
        { value: 'Business Strategy', color: 'blue' },
        { value: 'Leadership', color: 'green' },
        { value: 'Management', color: 'purple' },
        { value: 'General', color: 'gray' }
      ]},
      { name: 'Tags', type: 'multiple_select', required: false },
      { name: 'Processing Log', type: 'long_text', required: false }
    ]
  },
  
  blogRequests: {
    name: 'Blog_Requests',
    description: 'Track incoming blog requests and their processing status',
    fields: [
      { name: 'Client ID', type: 'link_row', link_row_table: 'Clients', required: true },
      { name: 'Input Type', type: 'single_select', required: true, select_options: [
        { value: 'text', color: 'blue' },
        { value: 'voice_note', color: 'green' },
        { value: 'url', color: 'purple' }
      ]},
      { name: 'Original Content', type: 'long_text', required: true },
      { name: 'Processed Content', type: 'long_text', required: false },
      { name: 'User Email', type: 'email', required: true },
      { name: 'Submission Timestamp', type: 'created_on', required: true },
      { name: 'Status', type: 'single_select', required: true, select_options: [
        { value: 'submitted', color: 'blue' },
        { value: 'processing', color: 'yellow' },
        { value: 'keyword_research', color: 'orange' },
        { value: 'content_created', color: 'green' },
        { value: 'seo_optimized', color: 'purple' },
        { value: 'completed', color: 'green' },
        { value: 'failed', color: 'red' }
      ]},
      { name: 'Workflow Execution ID', type: 'text', required: false },
      { name: 'Selected Keyword', type: 'text', required: false },
      { name: 'Keyword Data', type: 'long_text', required: false },
      { name: 'Content Length', type: 'number', required: false },
      { name: 'Error Message', type: 'long_text', required: false },
      { name: 'Completion Timestamp', type: 'date', required: false },
      { name: 'Blog Post ID', type: 'link_row', link_row_table: 'Blog_Posts', required: false }
    ]
  },
  
  keywordResearch: {
    name: 'Keyword_Research',
    description: 'Store keyword research data and metrics',
    fields: [
      { name: 'Blog Request ID', type: 'link_row', link_row_table: 'Blog_Requests', required: true },
      { name: 'Keyword', type: 'text', required: true },
      { name: 'Search Volume', type: 'number', required: false },
      { name: 'Keyword Difficulty', type: 'number', number_decimal_places: 1, required: false },
      { name: 'Search Intent', type: 'single_select', required: false, select_options: [
        { value: 'informational', color: 'blue' },
        { value: 'commercial', color: 'green' },
        { value: 'navigational', color: 'purple' },
        { value: 'transactional', color: 'orange' }
      ]},
      { name: 'CPC', type: 'number', number_decimal_places: 2, required: false },
      { name: 'Competition Level', type: 'single_select', required: false, select_options: [
        { value: 'low', color: 'green' },
        { value: 'medium', color: 'yellow' },
        { value: 'high', color: 'red' }
      ]},
      { name: 'Related Keywords', type: 'long_text', required: false },
      { name: 'SERP Features', type: 'multiple_select', required: false },
      { name: 'Opportunity Score', type: 'number', number_decimal_places: 1, required: false },
      { name: 'Research Timestamp', type: 'created_on', required: true },
      { name: 'Is Selected', type: 'boolean', required: false }
    ]
  }
};

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Token ${BASEROW_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Create a table
async function createTable(tableName, config) {
  console.log(`\n📋 Creating table: ${tableName}`);
  
  try {
    // Create the table
    const tableResponse = await makeRequest(`${BASEROW_BASE_URL}/api/database/tables/database/${DATABASE_ID}/`, {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        description: config.description
      })
    });
    
    const tableId = tableResponse.id;
    console.log(`✅ Table created with ID: ${tableId}`);
    
    // Create fields for the table
    console.log(`📝 Creating ${config.fields.length} fields...`);
    
    for (const field of config.fields) {
      try {
        const fieldResponse = await makeRequest(`${BASEROW_BASE_URL}/api/database/fields/table/${tableId}/`, {
          method: 'POST',
          body: JSON.stringify(field)
        });
        
        console.log(`  ✅ Field created: ${field.name} (ID: ${fieldResponse.id})`);
      } catch (error) {
        console.log(`  ❌ Failed to create field ${field.name}: ${error.message}`);
      }
    }
    
    return {
      tableId,
      tableName,
      config
    };
    
  } catch (error) {
    console.log(`❌ Failed to create table ${tableName}: ${error.message}`);
    return null;
  }
}

// Main setup function
async function setupBlogTables() {
  console.log('🚀 Starting Blog Workflow Baserow Setup');
  console.log(`📊 Database ID: ${DATABASE_ID}`);
  console.log(`🔑 Token: ${BASEROW_TOKEN.substring(0, 10)}...`);
  
  const createdTables = [];
  
  // Create tables in order (Blog_Requests first, then Blog_Posts, then Keyword_Research)
  const tableOrder = ['blogRequests', 'blogPosts', 'keywordResearch'];
  
  for (const tableKey of tableOrder) {
    const config = TABLE_CONFIGS[tableKey];
    const result = await createTable(tableKey, config);
    
    if (result) {
      createdTables.push(result);
    }
    
    // Add delay between table creation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Setup Summary:');
  console.log(`✅ Tables created: ${createdTables.length}/${Object.keys(TABLE_CONFIGS).length}`);
  
  createdTables.forEach(table => {
    console.log(`  📋 ${table.config.name} (ID: ${table.tableId})`);
  });
  
  // Generate configuration for n8n workflow
  console.log('\n🔧 n8n Workflow Configuration:');
  console.log('Add these table IDs to your n8n workflow:');
  
  const tableIds = {};
  createdTables.forEach(table => {
    tableIds[table.tableName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = table.tableId;
  });
  
  console.log(JSON.stringify(tableIds, null, 2));
  
  console.log('\n🎉 Blog workflow tables setup complete!');
  console.log('Next steps:');
  console.log('1. Update your n8n workflow with the table IDs above');
  console.log('2. Test the workflow with sample data');
  console.log('3. Configure the frontend integration');
}

// Run the setup
if (require.main === module) {
  setupBlogTables().catch(console.error);
}

module.exports = { setupBlogTables, TABLE_CONFIGS };
