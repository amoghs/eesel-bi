/**
 * Test the adjusted MRR calculation logic
 */

import { combineMRRData, calculateSummaryMetrics } from '../src/lib/combined-metrics';
import { createProfitwellClient } from '../src/lib/profitwell/client';
import { createAtlassianClient } from '../src/lib/atlassian/client';

async function testAdjustedMRR() {
  console.log('🧪 TESTING ADJUSTED MRR CALCULATION');
  console.log('===================================\n');
  
  try {
    // Get Profitwell data
    console.log('📊 Fetching Profitwell data...');
    const profitwellClient = createProfitwellClient();
    const profitwellResponse = await profitwellClient.getMRRBreakdown(6);
    
    if (!profitwellResponse.success || !profitwellResponse.data) {
      console.log('❌ Failed to get Profitwell data');
      return;
    }
    
    // Get Atlassian data
    console.log('📊 Fetching Atlassian data...');
    const atlassianClient = createAtlassianClient();
    const atlassianResponse = await atlassianClient.getMRRBreakdown(6);
    
    if (!atlassianResponse.success || !atlassianResponse.data) {
      console.log('❌ Failed to get Atlassian data');
      return;
    }
    
    console.log('✅ Both data sources fetched successfully');
    console.log(`📈 Profitwell: ${profitwellResponse.data.length} months`);
    console.log(`📈 Atlassian: ${atlassianResponse.data.length} months`);
    
    // Combine the data
    const combinedData = combineMRRData(profitwellResponse.data, atlassianResponse.data);
    const summaryMetrics = calculateSummaryMetrics(combinedData);
    
    console.log('\n📋 CURRENT MRR COMPARISON:');
    console.log('=' .repeat(50));
    
    const latestMonth = combinedData[combinedData.length - 1];
    const previousMonth = combinedData[combinedData.length - 2];
    
    console.log(`\n📅 Latest Month: ${latestMonth.date}`);
    console.log(`💰 Raw Combined MRR: $${latestMonth.combined.total_mrr.toFixed(2)}`);
    
    if (latestMonth.adjustedMRR) {
      console.log(`\n🔄 ADJUSTMENT APPLIED:`);
      console.log(`📝 ${latestMonth.adjustedMRR.note}`);
      console.log(`💰 Adjusted Combined MRR: $${latestMonth.adjustedMRR.total.toFixed(2)}`);
      console.log(`   - Profitwell (current): $${latestMonth.adjustedMRR.profitwell.toFixed(2)}`);
      console.log(`   - Atlassian (previous): $${latestMonth.adjustedMRR.atlassian.toFixed(2)}`);
    } else {
      console.log(`\n✨ No adjustment needed - using raw MRR`);
    }
    
    console.log(`\n📅 Previous Month: ${previousMonth?.date || 'N/A'}`);
    if (previousMonth) {
      console.log(`💰 Previous MRR: $${previousMonth.combined.total_mrr.toFixed(2)}`);
    }
    
    if (summaryMetrics) {
      console.log('\n📊 SUMMARY METRICS:');
      console.log('=' .repeat(30));
      console.log(`Current MRR: $${summaryMetrics.currentMRR.toFixed(2)} ${summaryMetrics.isAdjusted ? '(adjusted)' : '(raw)'}`);
      console.log(`Current ARR: $${summaryMetrics.currentARR.toFixed(2)}`);
      console.log(`Monthly Growth: ${summaryMetrics.monthlyGrowth.toFixed(2)}%`);
      console.log(`Profitwell: $${summaryMetrics.profitwellMRR.toFixed(2)} (${summaryMetrics.profitwellPercentage.toFixed(1)}%)`);
      console.log(`Atlassian: $${summaryMetrics.atlassianMRR.toFixed(2)} (${summaryMetrics.atlassianPercentage.toFixed(1)}%)`);
      
      if (summaryMetrics.adjustmentNote) {
        console.log(`\n📝 Adjustment Note: ${summaryMetrics.adjustmentNote}`);
      }
    }
    
    console.log('\n✅ Adjusted MRR calculation test completed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testAdjustedMRR();
}