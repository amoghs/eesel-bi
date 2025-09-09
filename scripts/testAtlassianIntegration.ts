/**
 * Test the Atlassian integration
 */

import { createAtlassianClient } from '../src/lib/atlassian/client';

async function testAtlassianIntegration() {
  console.log('🧪 TESTING ATLASSIAN INTEGRATION');
  console.log('==================================\n');
  
  const email = process.env.REACT_APP_ATLASSIAN_EMAIL || process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.REACT_APP_ATLASSIAN_API_TOKEN || process.env.ATLASSIAN_API_TOKEN;
  const vendorId = process.env.REACT_APP_ATLASSIAN_VENDOR_ID || process.env.ATLASSIAN_VENDOR_ID;
  
  if (!email || !apiToken || !vendorId) {
    console.log('❌ Atlassian credentials not found');
    console.log('📝 Please ensure these environment variables are set:');
    console.log('   - REACT_APP_ATLASSIAN_EMAIL (or ATLASSIAN_EMAIL)');
    console.log('   - REACT_APP_ATLASSIAN_API_TOKEN (or ATLASSIAN_API_TOKEN)');
    console.log('   - REACT_APP_ATLASSIAN_VENDOR_ID (or ATLASSIAN_VENDOR_ID)');
    return;
  }
  
  try {
    const client = createAtlassianClient({
      email,
      apiToken,
      vendorId
    });
    
    // Test transactions endpoint
    console.log('📊 Testing Transactions API...');
    const transactionsResponse = await client.getTransactions();
    
    if (!transactionsResponse.success || !transactionsResponse.data) {
      console.log('❌ Transactions API failed:', transactionsResponse.error?.message);
      console.log('🔧 This might be because:');
      console.log('   1. API token is invalid');
      console.log('   2. Vendor ID is incorrect');
      console.log('   3. No transactions exist for this vendor');
      console.log('   4. API endpoint has changed');
      return;
    }
    
    const transactions = transactionsResponse.data;
    console.log('✅ Transactions API successful!');
    console.log(`📈 Retrieved ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      const sample = transactions[0];
      console.log(`\n📋 Sample Transaction:${JSON.stringify(sample, null, 2)}`);
    }
    
    // Test MRR breakdown
    console.log('\n📊 Testing MRR Breakdown...');
    const mrrResponse = await client.getMRRBreakdown(6);
    
    if (!mrrResponse.success || !mrrResponse.data) {
      console.log('❌ MRR Breakdown failed:', mrrResponse.error?.message);
      return;
    }
    
    console.log('✅ MRR Breakdown successful!');
    console.log(`📈 Generated ${mrrResponse.data.length} months of breakdown data`);
    
    // Show breakdown for each month
    console.log('\n📅 Monthly MRR Breakdown:');
    mrrResponse.data.forEach(breakdown => {
      console.log(`\n${breakdown.date}:`);
      console.log(`   NEW: $${breakdown.new_revenue.toFixed(2)}`);
      console.log(`   REACTIVATIONS: $${breakdown.reactivations.toFixed(2)}`);
      console.log(`   UPGRADES: $${breakdown.upgrades.toFixed(2)}`);
      console.log(`   DOWNGRADES: $${breakdown.downgrades.toFixed(2)}`);
      console.log(`   VOLUNTARY CHURN: $${breakdown.voluntary_churn.toFixed(2)}`);
      console.log(`   DELINQUENT CHURN: $${breakdown.delinquent_churn.toFixed(2)}`);
      console.log(`   EXISTING: $${breakdown.existing.toFixed(2)}`);
      console.log(`   TOTAL MRR: $${breakdown.total_mrr.toFixed(2)}`);
      console.log(`   ARR: $${breakdown.arr.toFixed(2)}`);
    });
    
    // Test detailed monthly data
    console.log('\n📊 Testing Detailed Monthly Data...');
    const monthlyDataResponse = await client.getMonthlyData(3);
    
    if (monthlyDataResponse.success && monthlyDataResponse.data) {
      console.log('✅ Monthly Data successful!');
      
      // Show customer details for latest month
      const latestMonth = monthlyDataResponse.data[monthlyDataResponse.data.length - 1];
      if (latestMonth) {
        console.log(`\n👥 Customer Details for ${latestMonth.date}:`);
        
        const newCustomerCount = Object.keys(latestMonth.new_customers).length;
        const churnedCustomerCount = Object.keys(latestMonth.churned_customers).length;
        const upgradedCustomerCount = Object.keys(latestMonth.upgraded_customers).length;
        
        console.log(`   New Customers: ${newCustomerCount}`);
        console.log(`   Churned Customers: ${churnedCustomerCount}`);
        console.log(`   Upgraded Customers: ${upgradedCustomerCount}`);
        
        if (newCustomerCount > 0) {
          console.log('   New Customer Details:', latestMonth.new_customers);
        }
        if (churnedCustomerCount > 0) {
          console.log('   Churned Customer Details:', latestMonth.churned_customers);
        }
        if (upgradedCustomerCount > 0) {
          console.log('   Upgraded Customer Details:', latestMonth.upgraded_customers);
        }
      }
    }
    
    console.log('\n✅ Atlassian integration test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testAtlassianIntegration();
}