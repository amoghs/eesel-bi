// Profitwell API Response Types

export interface ProfitwellError {
  message: string;
  code?: string;
  details?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ProfitwellError;
}

// Monthly Metrics Types (Based on actual Profitwell API response)
export interface MonthlyDataPoint {
  date: string; // Format: YYYY-MM
  value: number;
}

export interface MonthlyMetricsResponse {
  data: {
    recurring_revenue: MonthlyDataPoint[];
    new_recurring_revenue: MonthlyDataPoint[];
    existing_recurring_revenue: MonthlyDataPoint[];
    churned_recurring_revenue: MonthlyDataPoint[];
    churned_recurring_revenue_cancellations: MonthlyDataPoint[];
    churned_recurring_revenue_delinquent: MonthlyDataPoint[];
    upgraded_recurring_revenue: MonthlyDataPoint[];
    downgraded_recurring_revenue: MonthlyDataPoint[];
    reactivated_recurring_revenue: MonthlyDataPoint[];
    active_customers: MonthlyDataPoint[];
    new_customers: MonthlyDataPoint[];
    existing_customers: MonthlyDataPoint[];
    churned_customers: MonthlyDataPoint[];
    churned_customers_cancellations: MonthlyDataPoint[];
    churned_customers_delinquent: MonthlyDataPoint[];
    upgraded_customers: MonthlyDataPoint[];
    downgraded_customers: MonthlyDataPoint[];
    reactivated_customers: MonthlyDataPoint[];
    average_revenue_per_user: MonthlyDataPoint[];
    lifetime_value: MonthlyDataPoint[];
    customers_churn_rate: MonthlyDataPoint[];
    customers_churn_cancellations_rate: MonthlyDataPoint[];
    customers_churn_delinquent_rate: MonthlyDataPoint[];
    revenue_churn_rate: MonthlyDataPoint[];
    revenue_churn_cancellations_rate: MonthlyDataPoint[];
    revenue_churn_delinquent_rate: MonthlyDataPoint[];
    revenue_retention_rate: MonthlyDataPoint[];
    customers_retention_rate: MonthlyDataPoint[];
    downgrade_rate: MonthlyDataPoint[];
    upgrade_rate: MonthlyDataPoint[];
    growth_rate: MonthlyDataPoint[];
    saas_quick_ratio: MonthlyDataPoint[];
    converted_recurring_revenue: MonthlyDataPoint[];
    new_trialing_customers: MonthlyDataPoint[];
    existing_trialing_customers: MonthlyDataPoint[];
    churned_trialing_customers: MonthlyDataPoint[];
    converted_customers: MonthlyDataPoint[];
    active_trialing_customers: MonthlyDataPoint[];
    customer_conversion_rate: MonthlyDataPoint[];
    trial_conversion_time: MonthlyDataPoint[];
  };
}

// MRR Breakdown for UI Display (matching Profitwell dashboard)
export interface MRRBreakdown {
  date: string;
  new_revenue: number;
  reactivations: number;
  upgrades: number;
  downgrades: number;
  voluntary_churn: number;
  delinquent_churn: number;
  existing: number;
  total_mrr: number;
  arr: number;
}

// Churn Metrics Types
export interface ChurnMetric {
  date: string;
  churn_rate: number;
  churned_customers: number;
  churned_revenue: number;
  currency: string;
}

export interface ChurnResponse {
  monthly_metrics: ChurnMetric[];
  summary: {
    current_churn_rate: number;
    total_churned_revenue: number;
    currency: string;
  };
}

// Customer Types (Based on actual API response)
export interface Customer {
  customer_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  mrr_cents: number;
  plans: string[];
  status: 'churned_voluntary' | 'churned_trial' | 'churned_delinquent' | 'no_history' | 'active';
  created_on: string;
  activated_on: string | null;
  churned_on: string | null;
  updated_on: string;
  total_spend_cents: number;
}

// Customers API returns direct array, not wrapped object
export type CustomersResponse = Customer[];

// Company Settings Types  
export interface CompanySettings {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  created_at: string;
}

// Revenue Breakdown Types
export interface RevenueBreakdown {
  new_revenue: number;
  expansion_revenue: number;
  retained_revenue: number;
  churned_revenue: number;
  resurrected_revenue: number;
  currency: string;
  date: string;
}

export interface RevenueBreakdownResponse {
  monthly_breakdown: RevenueBreakdown[];
  summary: {
    current_month: RevenueBreakdown;
    previous_month: RevenueBreakdown;
    growth: {
      new_revenue_growth: number;
      expansion_revenue_growth: number;
      retained_revenue_growth: number;
      churned_revenue_growth: number;
    };
  };
}

// Calculated Metrics (derived from customer data)
export interface CalculatedMRR {
  current_mrr_cents: number;
  active_customers: number;
  churned_customers: number;
  total_customers: number;
  average_mrr_per_customer: number;
}

export interface CalculatedChurn {
  churn_rate: number;
  churned_this_month: number;
  voluntary_churn: number;
  delinquent_churn: number;
  trial_churn: number;
}

export interface CalculatedRevenue {
  total_revenue_cents: number;
  average_customer_value: number;
  total_active_mrr: number;
  total_churned_revenue: number;
}

export interface ProductMetrics {
  [plan: string]: {
    customer_count: number;
    total_mrr_cents: number;
    churn_rate: number;
  };
}

// Dashboard Metrics Combined Type (Updated for actual working data)
export interface DashboardMetrics {
  customers: CustomersResponse;
  calculated_mrr: CalculatedMRR;
  calculated_churn: CalculatedChurn;
  calculated_revenue: CalculatedRevenue;
  product_metrics: ProductMetrics;
  last_updated: string;
}