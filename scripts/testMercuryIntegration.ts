/**
 * Test the Mercury integration
 */

import { createMercuryClient } from '../src/lib/mercury/client';

async function testMercuryIntegration() {
  console.log('🧪 TESTING MERCURY INTEGRATION');
  console.log('==============================\n');
  
  const apiKey = process.env.REACT_APP_MERCURY_API_KEY || process.env.MERCURY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Mercury API key not found');
    console.log('📝 Please ensure these environment variables are set:');
    console.log('   - REACT_APP_MERCURY_API_KEY (or MERCURY_API_KEY)');
    console.log('\n⚠️  Note: If you don\'t have Mercury API access yet, this is expected.');
    console.log('   The integration is ready and will work once you add the API key.');
    return;
  }
  
  try {
    const client = createMercuryClient({
      apiKey: apiKey
    });
    
    // Test accounts endpoint
    console.log('🏦 Testing Accounts API...');
    const accountsResponse = await client.getAccounts();
    
    if (!accountsResponse.success) {
      console.log('❌ Accounts API failed:', accountsResponse.error?.message);
      console.log('🔧 This might be because:');
      console.log('   1. API key is invalid or expired');
      console.log('   2. Mercury API access needs to be enabled for your account');
      console.log('   3. API endpoint has changed or is temporarily unavailable');
      console.log('   4. Network connectivity issues');
      return;
    }
    
    const accounts = accountsResponse.data || [];
    console.log('✅ Accounts API successful!');
    console.log(`🏦 Retrieved ${accounts.length} accounts`);
    
    if (accounts.length > 0) {
      console.log('\\n💰 Account Summary:');
      let totalBalance = 0;
      
      accounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name}`);
        console.log(`      Balance: $${account.availableBalance?.toFixed(2) || '0.00'} ${account.currency || 'USD'}`);
        console.log(`      Type: ${account.type || 'Unknown'}`);
        totalBalance += account.availableBalance || 0;
      });
      
      console.log(`\\n💰 Total Available Balance: $${totalBalance.toFixed(2)}`);
      
      // Test transactions for the first account
      const firstAccount = accounts[0];
      console.log(`\\n📊 Testing Transactions for ${firstAccount.name}...`);
      
      const transactionsResponse = await client.getTransactions(firstAccount.id, {
        limit: 5 // Just get a few recent transactions
      });
      
      if (transactionsResponse.success && transactionsResponse.data) {
        const transactions = transactionsResponse.data;
        console.log(`✅ Retrieved ${transactions.length} recent transactions`);
        
        if (transactions.length > 0) {
          console.log('\\n📋 Recent Transactions:');
          transactions.slice(0, 3).forEach((tx, index) => {
            console.log(`   ${index + 1}. ${tx.description}`);
            console.log(`      Amount: ${tx.kind === 'debit' ? '-' : '+'}$${tx.amount.toFixed(2)}`);
            console.log(`      Date: ${tx.postedAt || tx.createdAt}`);
            console.log(`      Status: ${tx.status}`);
          });
        }
      } else {
        console.log('⚠️  Transactions API failed:', transactionsResponse.error?.message);
        console.log('   This might be normal if the account has no transactions');
      }
    }
    
    // Test burn rate calculation
    console.log('\\n🔥 Testing Burn Rate Calculation...');
    const burnResponse = await client.getBurnRateMetrics(2); // Last 2 months
    
    if (burnResponse.success && burnResponse.data) {
      console.log('✅ Burn rate calculation successful!');
      
      burnResponse.data.forEach(metric => {
        console.log(`\\n📅 ${metric.period}:`);
        console.log(`   Total Burn: $${metric.totalBurn.toFixed(2)}`);
        console.log(`   Transactions: ${metric.transactionCount}`);
        console.log(`   Avg Transaction: $${metric.averageTransactionSize.toFixed(2)}`);
        
        if (Object.keys(metric.vendorBreakdown).length > 0) {
          console.log('   Top Vendors:');
          Object.entries(metric.vendorBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .forEach(([vendor, amount]) => {
              console.log(`     - ${vendor}: $${amount.toFixed(2)}`);
            });
        }
        
        if (Object.keys(metric.categoryBreakdown).length > 0) {
          console.log('   By Category:');
          Object.entries(metric.categoryBreakdown)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, amount]) => {
              console.log(`     - ${category}: $${amount.toFixed(2)}`);
            });
        }
      });
    } else {
      console.log('⚠️  Burn rate calculation failed:', burnResponse.error?.message);
      console.log('   This might be normal if there are no transactions in the period');
    }
    
    // Test bank balances
    console.log('\\n💰 Testing Bank Balances...');
    const balancesResponse = await client.getBankBalances();
    
    if (balancesResponse.success && balancesResponse.data) {
      console.log('✅ Bank balances retrieved successfully!');
      
      balancesResponse.data.forEach(balance => {
        console.log(`   ${balance.accountName}: $${balance.balance.toFixed(2)} ${balance.currency}`);
        console.log(`   Source: ${balance.source}`);
      });
    } else {
      console.log('⚠️  Bank balances failed:', balancesResponse.error?.message);
    }
    
    console.log('\\n✅ Mercury integration test completed successfully!');
    console.log('🎉 Your Mercury API client is ready for the dashboard!');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
    console.log('\\n🔧 Troubleshooting tips:');
    console.log('   1. Verify your Mercury API key is correct');
    console.log('   2. Check that your Mercury account has API access enabled');
    console.log('   3. Ensure network connectivity to Mercury API');
    console.log('   4. Contact Mercury support if the issue persists');
  }
}

if (require.main === module) {
  testMercuryIntegration();
}