import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { input_type, content, submission_timestamp } = body;
    
    if (!input_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: input_type and content are required' },
        { status: 400 }
      );
    }

    // Validate input_type
    const validInputTypes = ['text', 'voice_note', 'url'];
    if (!validInputTypes.includes(input_type)) {
      return NextResponse.json(
        { error: 'Invalid input_type. Must be one of: text, voice_note, url' },
        { status: 400 }
      );
    }

    console.log('📝 Blog request received:', {
      input_type,
      content_length: content.length,
      submission_timestamp
    });

    // Prepare data for n8n workflow
    const n8nPayload = {
      input_type,
      content,
      submission_timestamp: submission_timestamp || new Date().toISOString(),
      webhook_timestamp: new Date().toISOString()
    };

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_BLOG_WORKFLOW_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      console.error('❌ N8N_BLOG_WORKFLOW_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: 'Blog workflow not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Triggering n8n workflow:', n8nWebhookUrl);

    // Trigger n8n workflow
    let n8nResponse;
    try {
      const n8nRequest = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload)
      });

      if (n8nRequest.ok) {
        n8nResponse = await n8nRequest.json();
        console.log('✅ n8n workflow triggered successfully');
      } else {
        const errorText = await n8nRequest.text();
        console.error('❌ n8n workflow failed:', n8nRequest.status, errorText);
        throw new Error(`n8n workflow failed: ${n8nRequest.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Failed to trigger n8n workflow:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process blog request',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Blog request submitted successfully',
      data: {
        input_type,
        content_length: content.length,
        submission_timestamp,
        n8n_response: n8nResponse
      }
    });

  } catch (error) {
    console.error('❌ Blog request API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

