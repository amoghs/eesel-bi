/**
 * Analyze the /metrics/monthly/ endpoint to see if it contains MRR breakdown data
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

async function analyzeMonthlyMetrics() {
  log('📊 ANALYZING MONTHLY METRICS ENDPOINT', 'cyan');
  log('====================================\n', 'cyan');
  
  const apiKey = process.env.PROFITWELL_API_KEY || process.env.REACT_APP_PROFITWELL_API_KEY;
  if (!apiKey) {
    log('❌ PROFITWELL_API_KEY is required', 'red');
    return;
  }
  
  try {
    // Make request to monthly metrics endpoint
    const url = 'https://api.profitwell.com/v2/metrics/monthly/';
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'eesel-bi-dashboard/1.0'
      }
    });
    
    if (!response.ok) {
      log(`❌ Request failed: ${response.status} ${response.statusText}`, 'red');
      return;
    }
    
    const data = await response.json();
    
    log('✅ Successfully retrieved monthly metrics data', 'green');
    log('\n📋 DATA STRUCTURE ANALYSIS:', 'magenta');
    
    // Analyze the structure
    if (data.data) {
      const metrics = data.data;
      log(`Root data keys: ${Object.keys(metrics).join(', ')}`, 'blue');
      
      // Look for different metric types
      Object.keys(metrics).forEach(key => {
        const metric = metrics[key];
        if (Array.isArray(metric) && metric.length > 0) {
          log(`\n📈 ${key.toUpperCase()} (${metric.length} data points):`, 'yellow');
          
          // Show recent data points
          const recent = metric.slice(-3);
          recent.forEach(point => {
            log(`  ${point.date}: $${point.value}`, 'blue');
          });
          
          // Show structure of first item
          const firstItem = metric[0];
          log(`  Structure: ${Object.keys(firstItem).join(', ')}`, 'magenta');
        }
      });
      
      // Check if we have breakdown categories that match Profitwell UI
      const expectedCategories = [
        'new_revenue',
        'expansion_revenue', 
        'contraction_revenue',
        'churn_revenue',
        'existing_revenue',
        'reactivated_revenue',
        'recurring_revenue'
      ];
      
      log('\n🔍 CHECKING FOR BREAKDOWN CATEGORIES:', 'cyan');
      expectedCategories.forEach(category => {
        if (metrics[category]) {
          log(`✅ Found: ${category}`, 'green');
        } else {
          log(`❌ Missing: ${category}`, 'red');
        }
      });
      
      // Show sample of latest month data for each available metric
      log('\n📅 LATEST MONTH DATA SAMPLE:', 'cyan');
      Object.keys(metrics).forEach(key => {
        const metric = metrics[key];
        if (Array.isArray(metric) && metric.length > 0) {
          const latest = metric[metric.length - 1];
          log(`${key}: ${latest.date} = $${latest.value}`, 'blue');
        }
      });
      
    } else {
      log('❌ Unexpected data structure - no "data" property found', 'red');
      log(`Available keys: ${Object.keys(data).join(', ')}`, 'yellow');
    }
    
    log('\n💾 FULL RESPONSE (last 1000 chars):', 'magenta');
    const fullResponse = JSON.stringify(data, null, 2);
    log(fullResponse.slice(-1000), 'blue');
    
  } catch (error) {
    log(`💥 Error: ${error}`, 'red');
  }
}

if (require.main === module) {
  analyzeMonthlyMetrics();
}