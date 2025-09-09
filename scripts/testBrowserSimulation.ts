/**
 * Browser simulation test script - tests all dashboard endpoints
 * exactly as they would be called by the React components
 */

interface APITestResult {
  endpoint: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  timing: number;
}

async function testAPIEndpoint(endpoint: string, description: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  console.log(`🧪 Testing: ${description}`);
  console.log(`   URL: http://localhost:3000${endpoint}`);
  
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const timing = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        endpoint,
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timing
      };
    }
    
    const data = await response.json();
    
    return {
      endpoint,
      success: true,
      status: response.status,
      data,
      timing
    };
    
  } catch (error) {
    const timing = Date.now() - startTime;
    return {
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timing
    };
  }
}

async function simulateBrowserDashboard() {
  console.log('🌐 BROWSER SIMULATION TEST');
  console.log('=========================\n');
  
  // Test all the exact endpoints that the React components call
  const tests = [
    {
      endpoint: '/api/profitwell?endpoint=%2Fmetrics%2Fmonthly%2F',
      description: 'Profitwell MRR Data (as called by useMRRData hook)'
    },
    {
      endpoint: '/api/atlassian?endpoint=1221976%2Freporting%2Fsales%2Ftransactions%2Fexport',
      description: 'Atlassian Transactions (as called by useAtlassianMRRData hook)'
    },
    {
      endpoint: '/',
      description: 'Main Dashboard Page (SSR)'
    }
  ];
  
  const results: APITestResult[] = [];
  
  for (const test of tests) {
    const result = await testAPIEndpoint(test.endpoint, test.description);
    results.push(result);
    
    if (result.success) {
      console.log(`   ✅ Success (${result.timing}ms)`);
      
      // Log specific data insights
      if (test.endpoint.includes('profitwell')) {
        const mrrData = result.data?.data?.recurring_revenue;
        if (mrrData && Array.isArray(mrrData)) {
          const latestMRR = mrrData[mrrData.length - 1];
          console.log(`   📊 Latest MRR: $${latestMRR.value} (${latestMRR.date})`);
        }
      } else if (test.endpoint.includes('atlassian')) {
        if (Array.isArray(result.data)) {
          console.log(`   📊 Retrieved ${result.data.length} transactions`);
          if (result.data.length > 0) {
            console.log(`   📊 Sample transaction: ${result.data[0].customerDetails.company} - $${result.data[0].purchaseDetails.purchasePrice}`);
          }
        }
      } else if (test.endpoint === '/') {
        console.log(`   📊 Dashboard page loaded successfully`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error} (${result.timing}ms)`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📋 SIMULATION SUMMARY');
  console.log('====================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Average timing: ${Math.round(results.reduce((sum, r) => sum + r.timing, 0) / results.length)}ms`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Dashboard should be fully functional in browser.');
  } else {
    console.log('\n⚠️  Some tests failed. Dashboard may have issues.');
    
    // Show failed endpoints
    const failedTests = results.filter(r => !r.success);
    failedTests.forEach(test => {
      console.log(`   - ${test.endpoint}: ${test.error}`);
    });
  }
  
  return results;
}

// Test specific component data flow
async function testComponentDataFlow() {
  console.log('\n🔄 COMPONENT DATA FLOW TEST');
  console.log('===========================\n');
  
  try {
    // Simulate the exact flow that useCombinedMRRData hook uses
    console.log('1. Fetching Profitwell data...');
    const profitwellResult = await testAPIEndpoint('/api/profitwell?endpoint=%2Fmetrics%2Fmonthly%2F', 'Profitwell API');
    
    console.log('2. Fetching Atlassian data...');
    const atlassianResult = await testAPIEndpoint('/api/atlassian?endpoint=1221976%2Freporting%2Fsales%2Ftransactions%2Fexport', 'Atlassian API');
    
    if (profitwellResult.success && atlassianResult.success) {
      console.log('3. ✅ Both data sources available - combined metrics will work');
      
      // Quick validation of data structure
      const profitwellMRR = profitwellResult.data?.data?.recurring_revenue;
      const atlassianTransactions = atlassianResult.data;
      
      if (Array.isArray(profitwellMRR) && profitwellMRR.length > 0) {
        console.log(`   📊 Profitwell has ${profitwellMRR.length} months of MRR data`);
      } else {
        console.log('   ⚠️  Profitwell MRR data structure unexpected');
      }
      
      if (Array.isArray(atlassianTransactions) && atlassianTransactions.length > 0) {
        console.log(`   📊 Atlassian has ${atlassianTransactions.length} transactions`);
      } else {
        console.log('   ⚠️  Atlassian transaction data structure unexpected');
      }
      
    } else {
      console.log('3. ❌ One or both data sources failed');
      
      if (!profitwellResult.success) {
        console.log(`   - Profitwell: ${profitwellResult.error}`);
      }
      if (!atlassianResult.success) {
        console.log(`   - Atlassian: ${atlassianResult.error}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Component data flow test failed: ${error}`);
  }
}

async function main() {
  // Wait a moment for server to be fully ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const results = await simulateBrowserDashboard();
  await testComponentDataFlow();
  
  // Return results for potential use by other scripts
  return results;
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;