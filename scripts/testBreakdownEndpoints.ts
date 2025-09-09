/**
 * Test script to find working Profitwell MRR breakdown endpoints
 * Testing various endpoint patterns to match the UI breakdown data
 */

import { createProfitwellClient } from '../src/lib/profitwell/client';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMRRBreakdownEndpoints() {
  log('🔍 TESTING MRR BREAKDOWN ENDPOINTS', 'cyan');
  log('=====================================\n', 'cyan');
  
  const apiKey = process.env.PROFITWELL_API_KEY || process.env.REACT_APP_PROFITWELL_API_KEY;
  if (!apiKey) {
    log('❌ PROFITWELL_API_KEY is required', 'red');
    return;
  }
  
  const client = createProfitwellClient(apiKey);
  
  // Test various possible endpoints for MRR breakdown
  const endpointsToTest = [
    '/metrics/',
    '/metrics/monthly/',
    '/metrics/mrr/',
    '/metrics/breakdown/',
    '/metrics/revenue/',
    '/metrics/cohorts/',
    '/metrics/financial/',
    '/monthly_metrics/',
    '/financial_metrics/',
    '/mrr_breakdown/',
    '/revenue_breakdown/',
    '/metrics/trends/',
    '/metrics/summary/',
    '/monthly_financial_metrics/',
    '/plans/',
    '/plans/metrics/',
    '/company/metrics/',
    '/monthly/',
    '/financial/',
    '/monthly_cohorts/',
    '/subscription_metrics/'
  ];
  
  log(`Testing ${endpointsToTest.length} potential endpoints...\n`, 'blue');
  
  for (const endpoint of endpointsToTest) {
    try {
      log(`Testing: ${endpoint}`, 'yellow');
      
      // Make request to test endpoint
      const url = `https://api.profitwell.com/v2${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'eesel-bi-dashboard/1.0'
        }
      });
      
      const status = response.status;
      let responseText = '';
      
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Could not read response';
      }
      
      if (status === 200) {
        log(`✅ SUCCESS: ${endpoint}`, 'green');
        log(`Response preview: ${responseText.substring(0, 200)}...`, 'green');
        
        // Try to parse as JSON and show structure
        try {
          const data = JSON.parse(responseText);
          log(`Data structure keys: ${Object.keys(data).join(', ')}`, 'magenta');
        } catch (e) {
          log('Non-JSON response', 'yellow');
        }
        log('', 'reset');
        
      } else if (status === 404) {
        log(`❌ Not Found: ${endpoint}`, 'reset');
      } else if (status === 403) {
        log(`🔒 Forbidden: ${endpoint}`, 'yellow');
      } else {
        log(`❓ Status ${status}: ${endpoint}`, 'yellow');
        if (responseText.length < 500) {
          log(`Response: ${responseText}`, 'yellow');
        }
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      log(`💥 Error testing ${endpoint}: ${error}`, 'red');
    }
  }
  
  log('\n🎯 ENDPOINT DISCOVERY COMPLETE', 'cyan');
  log('Look for endpoints that returned 200 status codes', 'blue');
}

if (require.main === module) {
  testMRRBreakdownEndpoints();
}