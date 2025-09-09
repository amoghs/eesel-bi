/**
 * Test script to validate dashboard metrics calculation from customer data
 */

import { createProfitwellClient } from '../src/lib/profitwell/client';

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function testDashboardCalculation() {
  log('🧪 TESTING DASHBOARD METRICS CALCULATION', 'cyan');
  log('=========================================\n', 'cyan');
  
  const apiKey = process.env.PROFITWELL_API_KEY || process.env.REACT_APP_PROFITWELL_API_KEY;
  if (!apiKey) {
    log('❌ PROFITWELL_API_KEY is required', 'yellow');
    return;
  }
  
  try {
    const client = createProfitwellClient(apiKey);
    
    log('📊 Fetching and calculating dashboard metrics...', 'blue');
    const response = await client.getDashboardMetrics();
    
    if (!response.success || !response.data) {
      log(`❌ Failed: ${response.error?.message}`, 'yellow');
      return;
    }
    
    const metrics = response.data;
    
    log('\n✅ SUCCESS! Dashboard metrics calculated successfully\n', 'green');
    
    // Display calculated metrics
    log('💰 MRR METRICS', 'magenta');
    log('═══════════════', 'magenta');
    log(`Current MRR: ${formatCurrency(metrics.calculated_mrr.current_mrr_cents)}`);
    log(`Active Customers: ${metrics.calculated_mrr.active_customers}`);
    log(`Churned Customers: ${metrics.calculated_mrr.churned_customers}`);
    log(`Total Customers: ${metrics.calculated_mrr.total_customers}`);
    log(`Average MRR per Customer: ${formatCurrency(metrics.calculated_mrr.average_mrr_per_customer)}\n`);
    
    log('📉 CHURN METRICS', 'magenta');
    log('═══════════════', 'magenta');
    log(`Overall Churn Rate: ${metrics.calculated_churn.churn_rate.toFixed(1)}%`);
    log(`Churned This Month: ${metrics.calculated_churn.churned_this_month}`);
    log(`Voluntary Churn: ${metrics.calculated_churn.voluntary_churn}`);
    log(`Delinquent Churn: ${metrics.calculated_churn.delinquent_churn}`);
    log(`Trial Churn: ${metrics.calculated_churn.trial_churn}\n`);
    
    log('💵 REVENUE METRICS', 'magenta');
    log('═══════════════════', 'magenta');
    log(`Total Revenue: ${formatCurrency(metrics.calculated_revenue.total_revenue_cents)}`);
    log(`Average Customer Value: ${formatCurrency(metrics.calculated_revenue.average_customer_value)}`);
    log(`Total Active MRR: ${formatCurrency(metrics.calculated_revenue.total_active_mrr)}`);
    log(`Total Churned Revenue: ${formatCurrency(metrics.calculated_revenue.total_churned_revenue)}\n`);
    
    log('🛍️ PRODUCT METRICS', 'magenta');
    log('═══════════════════', 'magenta');
    Object.entries(metrics.product_metrics).forEach(([plan, data]) => {
      log(`\n📦 ${plan}:`);
      log(`  Customers: ${data.customer_count}`);
      log(`  Total MRR: ${formatCurrency(data.total_mrr_cents)}`);
      log(`  Churn Rate: ${data.churn_rate.toFixed(1)}%`);
    });
    
    log(`\n📅 Last Updated: ${metrics.last_updated}`, 'blue');
    
    // Sample recent customers
    log('\n👥 SAMPLE RECENT CUSTOMERS (First 5)', 'magenta');
    log('═══════════════════════════════════', 'magenta');
    metrics.customers.slice(0, 5).forEach((customer, i) => {
      log(`\n${i + 1}. ${customer.email || 'No Email'} (${customer.customer_id})`);
      log(`   Status: ${customer.status}`);
      log(`   MRR: ${formatCurrency(customer.mrr_cents)}`);
      log(`   Total Spend: ${formatCurrency(customer.total_spend_cents)}`);
      log(`   Plans: ${customer.plans.join(', ') || 'None'}`);
      log(`   Created: ${customer.created_on}`);
    });
    
    log('\n🎉 Dashboard metrics calculation test completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Test failed: ${error}`, 'yellow');
  }
}

if (require.main === module) {
  testDashboardCalculation();
}