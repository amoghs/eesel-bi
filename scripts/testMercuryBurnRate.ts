/**
 * Test Mercury burn rate calculation with current data
 */

import { createMercuryClient } from '../src/lib/mercury/client';

async function testMercuryBurnRate() {
  console.log('🔥 TESTING MERCURY BURN RATE CALCULATION');
  console.log('=======================================\n');
  
  const apiKey = process.env.REACT_APP_MERCURY_API_KEY || process.env.MERCURY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Mercury API key not found');
    return;
  }
  
  try {
    const client = createMercuryClient({ apiKey });
    
    // Get accounts first
    const accountsResponse = await client.getAccounts();
    if (!accountsResponse.success || !accountsResponse.data) {
      console.log('❌ Failed to get accounts');
      return;
    }
    
    const accounts = accountsResponse.data;
    const activeAccount = accounts.find(acc => acc.availableBalance > 1000); // Main account
    
    if (!activeAccount) {
      console.log('❌ No active account found');
      return;
    }
    
    console.log(`📊 Testing transactions for: ${activeAccount.name}`);
    console.log(`💰 Account Balance: $${activeAccount.availableBalance.toFixed(2)}\n`);
    
    // Test recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    
    const transactionsResponse = await client.getTransactions(activeAccount.id, {
      startDate,
      endDate,
      limit: 100
    });
    
    if (!transactionsResponse.success || !transactionsResponse.data) {
      console.log('❌ Failed to get transactions:', transactionsResponse.error?.message);
      return;
    }
    
    const transactions = transactionsResponse.data;
    console.log(`✅ Retrieved ${transactions.length} transactions\n`);
    
    // Calculate burn rate
    let totalBurn = 0;
    let totalCredits = 0;
    const vendorBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    const debitTransactions: any[] = [];
    const creditTransactions: any[] = [];
    
    transactions.forEach(tx => {
      const vendor = tx.counterpartyName || 'Unknown';
      const category = tx.mercuryCategory || 'Other';
      
      if (tx.amount < 0) {
        // Debit (outgoing) - this is burn
        const amount = Math.abs(tx.amount);
        totalBurn += amount;
        debitTransactions.push(tx);
        
        vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + amount;
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
      } else {
        // Credit (incoming)
        totalCredits += tx.amount;
        creditTransactions.push(tx);
      }
    });
    
    console.log('🔥 BURN RATE ANALYSIS:');
    console.log('=' .repeat(25));
    console.log(`📈 Total Outgoing (Burn): $${totalBurn.toFixed(2)}`);
    console.log(`📉 Total Incoming (Credits): $${totalCredits.toFixed(2)}`);
    console.log(`📊 Net Burn: $${(totalBurn - totalCredits).toFixed(2)}`);
    console.log(`🔢 Debit Transactions: ${debitTransactions.length}`);
    console.log(`🔢 Credit Transactions: ${creditTransactions.length}`);
    console.log(`💰 Daily Average Burn: $${(totalBurn / 30).toFixed(2)}\n`);
    
    // Show top vendors
    console.log('🏢 TOP VENDORS BY SPEND:');
    console.log('=' .repeat(25));
    Object.entries(vendorBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([vendor, amount], index) => {
        console.log(`${index + 1}. ${vendor}: $${amount.toFixed(2)}`);
      });
    
    // Show categories
    console.log('\n📂 SPENDING BY CATEGORY:');
    console.log('=' .repeat(25));
    Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, amount], index) => {
        console.log(`${index + 1}. ${category}: $${amount.toFixed(2)}`);
      });
    
    // Show recent large transactions
    console.log('\n💸 RECENT LARGE TRANSACTIONS (>$100):');
    console.log('=' .repeat(40));
    debitTransactions
      .filter(tx => Math.abs(tx.amount) > 100)
      .slice(0, 10)
      .forEach(tx => {
        const date = new Date(tx.postedAt || tx.createdAt).toLocaleDateString();
        console.log(`${date}: ${tx.counterpartyName} - $${Math.abs(tx.amount).toFixed(2)}`);
      });
    
    // Show credits/refunds
    if (creditTransactions.length > 0) {
      console.log('\n💰 RECENT CREDITS/REFUNDS:');
      console.log('=' .repeat(25));
      creditTransactions.slice(0, 5).forEach(tx => {
        const date = new Date(tx.postedAt || tx.createdAt).toLocaleDateString();
        console.log(`${date}: ${tx.counterpartyName} + $${tx.amount.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ Mercury burn rate analysis complete!');
    console.log('🎯 This data will power your dashboard burn rate charts');
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testMercuryBurnRate();
}