import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    // Get Mercury API key from environment
    const apiKey = process.env.REACT_APP_MERCURY_API_KEY || process.env.MERCURY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Mercury API key not configured' },
        { status: 500 }
      );
    }

    // Construct the full Mercury API URL
    const mercuryUrl = `https://api.mercury.com/api/v1${endpoint}`;
    
    console.log(`[Mercury API Route] Making request to: ${mercuryUrl}`);

    // Mercury requires the full secret-token: prefix if not already included
    const fullApiKey = apiKey.startsWith('secret-token:') 
      ? apiKey 
      : `secret-token:${apiKey}`;

    // Make the request to Mercury API
    const response = await fetch(mercuryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${fullApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`[Mercury API Route] Response status: ${response.status}`);

    // Get response text first
    const responseText = await response.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[Mercury API Route] Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from Mercury API', details: responseText },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error('[Mercury API Route] Mercury API error:', responseData);
      return NextResponse.json(
        { 
          error: responseData.error?.message || responseData.message || 'Mercury API request failed',
          details: responseData 
        },
        { status: response.status }
      );
    }

    // Return the successful response
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[Mercury API Route] Request failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}