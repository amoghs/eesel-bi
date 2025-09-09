// Atlassian Marketplace API types based on your script

export interface AtlassianTransaction {
  cloudId: string;
  purchaseDetails: {
    saleDate: string; // YYYY-MM-DD format
    saleType: 'New' | 'Renewal' | 'Upgrade' | 'Downgrade';
    billingPeriod: 'Monthly' | 'Annual';
    purchasePrice: number;
    oldPurchasePrice?: number;
  };
  // Add other fields as needed based on actual API response
}

export interface AtlassianChurnEvent {
  cloudId: string;
  churnDate: string;
  churnReason?: string;
  lastPurchasePrice: number;
  // Add other fields as needed
}

// Raw API response types
export interface AtlassianTransactionsResponse {
  transactions: AtlassianTransaction[];
  // Add pagination fields if needed
}

export interface AtlassianChurnResponse {
  churnEvents: AtlassianChurnEvent[];
  // Add other fields as needed
}

// Monthly breakdown types (matching Profitwell structure)
export interface AtlassianMRRBreakdown {
  date: string; // YYYY-MM format
  new_revenue: number;
  reactivations: number; // Customers coming back after churning
  upgrades: number; // Expansion revenue
  downgrades: number; // Negative expansion
  voluntary_churn: number; // Revenue lost from voluntary churn (negative)
  delinquent_churn: number; // Revenue lost from failed payments (negative)
  existing: number; // Revenue from retained customers
  total_mrr: number;
  arr: number; // Annual recurring revenue
}

// Detailed customer tracking for a given month
export interface MonthlyCustomerMetrics {
  new_customers: Record<string, number>; // cloudId -> amount
  reactivated_customers: Record<string, number>;
  upgraded_customers: Record<string, number>; // expansion amount
  downgraded_customers: Record<string, number>; // contraction amount (positive)
  churned_customers: Record<string, number>;
  retained_customers: Record<string, number>;
}

// Combined monthly data
export interface AtlassianMonthlyData extends AtlassianMRRBreakdown, MonthlyCustomerMetrics {}

// API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: string;
  };
}

// Configuration
export interface AtlassianConfig {
  email: string;
  apiToken: string;
  vendorId: string;
}

// Error types
export interface AtlassianError {
  message: string;
  code?: string;
  details?: string;
}