import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      },
      apiKeys: {
        profitwell: {
          configured: !!(process.env.REACT_APP_PROFITWELL_API_KEY || process.env.NEXT_PUBLIC_PROFITWELL_API_KEY || process.env.PROFITWELL_API_KEY),
          source: process.env.REACT_APP_PROFITWELL_API_KEY ? 'REACT_APP_PROFITWELL_API_KEY' : 
                  process.env.NEXT_PUBLIC_PROFITWELL_API_KEY ? 'NEXT_PUBLIC_PROFITWELL_API_KEY' :
                  process.env.PROFITWELL_API_KEY ? 'PROFITWELL_API_KEY' : 'none'
        },
        atlassian: {
          configured: !!(process.env.REACT_APP_ATLASSIAN_API_TOKEN || process.env.ATLASSIAN_API_TOKEN),
          email: process.env.REACT_APP_ATLASSIAN_EMAIL || process.env.ATLASSIAN_EMAIL || 'not configured',
          vendorId: process.env.REACT_APP_ATLASSIAN_VENDOR_ID || process.env.ATLASSIAN_VENDOR_ID || 'not configured'
        }
      }
    };

    // Test API connectivity
    const apiTests = {
      profitwell: { status: 'unknown', error: null as string | null, timing: 0 },
      atlassian: { status: 'unknown', error: null as string | null, timing: 0 }
    };

    // Test Profitwell
    const profitwellStart = Date.now();
    try {
      const profitwellResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profitwell?endpoint=%2Fmetrics%2Fmonthly%2F`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      apiTests.profitwell.timing = Date.now() - profitwellStart;
      
      if (profitwellResponse.ok) {
        const data = await profitwellResponse.json();
        apiTests.profitwell.status = 'success';
        (apiTests.profitwell as any).dataPoints = data?.data?.recurring_revenue?.length || 0;
      } else {
        apiTests.profitwell.status = 'failed';
        apiTests.profitwell.error = `HTTP ${profitwellResponse.status}`;
      }
    } catch (error) {
      apiTests.profitwell.timing = Date.now() - profitwellStart;
      apiTests.profitwell.status = 'error';
      apiTests.profitwell.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test Atlassian
    const atlassianStart = Date.now();
    try {
      const atlassianResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/atlassian?endpoint=1221976%2Freporting%2Fsales%2Ftransactions%2Fexport`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      apiTests.atlassian.timing = Date.now() - atlassianStart;
      
      if (atlassianResponse.ok) {
        const data = await atlassianResponse.json();
        apiTests.atlassian.status = 'success';
        (apiTests.atlassian as any).transactions = Array.isArray(data) ? data.length : 0;
      } else {
        apiTests.atlassian.status = 'failed';
        apiTests.atlassian.error = `HTTP ${atlassianResponse.status}`;
      }
    } catch (error) {
      apiTests.atlassian.timing = Date.now() - atlassianStart;
      apiTests.atlassian.status = 'error';
      apiTests.atlassian.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const overallStatus = apiTests.profitwell.status === 'success' && apiTests.atlassian.status === 'success' 
      ? 'healthy' 
      : apiTests.profitwell.status === 'success' || apiTests.atlassian.status === 'success'
      ? 'partial'
      : 'unhealthy';

    return NextResponse.json({
      status: overallStatus,
      debugInfo,
      apiTests,
      recommendations: generateRecommendations(debugInfo, apiTests)
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateRecommendations(debugInfo: any, apiTests: any): string[] {
  const recommendations = [];

  if (!debugInfo.apiKeys.profitwell.configured) {
    recommendations.push('Configure Profitwell API key in environment variables');
  }

  if (!debugInfo.apiKeys.atlassian.configured) {
    recommendations.push('Configure Atlassian API token in environment variables');
  }

  if (apiTests.profitwell.status === 'failed' || apiTests.profitwell.status === 'error') {
    recommendations.push(`Fix Profitwell API issue: ${apiTests.profitwell.error}`);
  }

  if (apiTests.atlassian.status === 'failed' || apiTests.atlassian.status === 'error') {
    recommendations.push(`Fix Atlassian API issue: ${apiTests.atlassian.error}`);
  }

  if (apiTests.profitwell.timing > 5000) {
    recommendations.push('Profitwell API response time is slow (>5s)');
  }

  if (apiTests.atlassian.timing > 10000) {
    recommendations.push('Atlassian API response time is very slow (>10s)');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational! 🎉');
  }

  return recommendations;
}