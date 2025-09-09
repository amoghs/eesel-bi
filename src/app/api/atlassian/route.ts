import { NextRequest, NextResponse } from 'next/server';

const ATLASSIAN_API_BASE = 'https://marketplace.atlassian.com/rest/2/vendors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  const email = process.env.REACT_APP_ATLASSIAN_EMAIL || process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.REACT_APP_ATLASSIAN_API_TOKEN || process.env.ATLASSIAN_API_TOKEN;

  if (!email || !apiToken) {
    return NextResponse.json(
      { error: 'Atlassian credentials not configured' },
      { status: 500 }
    );
  }

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    const response = await fetch(`${ATLASSIAN_API_BASE}/${endpoint}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Atlassian API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching from Atlassian API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Atlassian API' },
      { status: 500 }
    );
  }
}