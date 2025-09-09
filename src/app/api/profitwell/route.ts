import { NextRequest, NextResponse } from 'next/server';

const PROFITWELL_API_BASE = 'https://api.profitwell.com/v2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.PROFITWELL_API_KEY || 
                 process.env.NEXT_PUBLIC_PROFITWELL_API_KEY || 
                 process.env.REACT_APP_PROFITWELL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Profitwell API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${PROFITWELL_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Profitwell API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching from Profitwell API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Profitwell API' },
      { status: 500 }
    );
  }
}