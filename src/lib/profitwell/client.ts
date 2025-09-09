import {
  APIResponse,
  Customer,
  CustomersResponse,
  DashboardMetrics,
  MonthlyMetricsResponse,
  MRRBreakdown,
  CalculatedMRR,
  CalculatedChurn,
  CalculatedRevenue,
  ProductMetrics,
  ProfitwellError
} from './types';

export class ProfitwellAPIClient {
  private readonly isClient: boolean;
  private readonly apiKey?: string;
  private rateLimitDelay = 0;
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    this.isClient = typeof window !== 'undefined';
    this.apiKey = apiKey;
    
    // For server-side usage, require API key
    if (!this.isClient && !apiKey) {
      throw new Error('Profitwell API key is required for server-side usage');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }

    let url: string;
    let requestOptions: RequestInit;

    if (this.isClient) {
      // Client-side: use Next.js API route to avoid CORS
      url = `/api/profitwell?endpoint=${encodeURIComponent(endpoint)}`;
      requestOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };
    } else {
      // Server-side: call Profitwell API directly
      url = `https://api.profitwell.com/v2${endpoint}`;
      requestOptions = {
        ...options,
        headers: {
          'Authorization': this.apiKey!,
          'Content-Type': 'application/json',
          'User-Agent': 'eesel-bi-dashboard/1.0',
          ...options.headers,
        },
      };
    }

    try {
      console.log(`Making ${this.isClient ? 'client-side' : 'server-side'} request to: ${url}`);
      const response = await fetch(url, requestOptions);
      this.lastRequestTime = Date.now();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        this.rateLimitDelay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        console.warn(`Rate limited, retrying after ${this.rateLimitDelay}ms`);
        await this.delay(this.rateLimitDelay);
        return this.makeRequest<T>(endpoint, options);
      }

      const responseText = await response.text();
      console.log(`Response status: ${response.status}`);

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: {
            message: 'Invalid JSON response from API',
            details: responseText
          }
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
            code: data.code || response.status.toString(),
            details: JSON.stringify(data)
          }
        };
      }

      return {
        success: true,
        data: data as T
      };

    } catch (error) {
      console.error('Request failed:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : String(error)
        }
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Monthly Metrics - The main endpoint that works and provides full breakdown
  async getMonthlyMetrics(): Promise<APIResponse<MonthlyMetricsResponse>> {
    return this.makeRequest<MonthlyMetricsResponse>('/metrics/monthly/');
  }

  // Transform monthly metrics into MRR breakdown for dashboard display
  private transformToMRRBreakdown(monthlyMetrics: MonthlyMetricsResponse, months: number = 6): MRRBreakdown[] {
    const data = monthlyMetrics.data;
    const breakdowns: MRRBreakdown[] = [];
    
    // Get the last N months of data
    const totalMonths = data.recurring_revenue.length;
    const startIndex = Math.max(0, totalMonths - months);
    
    for (let i = startIndex; i < totalMonths; i++) {
      const date = data.recurring_revenue[i]?.date;
      if (!date) continue;
      
      const breakdown: MRRBreakdown = {
        date,
        new_revenue: data.new_recurring_revenue[i]?.value || 0,
        reactivations: data.reactivated_recurring_revenue[i]?.value || 0,
        upgrades: data.upgraded_recurring_revenue[i]?.value || 0,
        downgrades: data.downgraded_recurring_revenue[i]?.value || 0,
        voluntary_churn: data.churned_recurring_revenue_cancellations[i]?.value || 0,
        delinquent_churn: data.churned_recurring_revenue_delinquent[i]?.value || 0,
        existing: data.existing_recurring_revenue[i]?.value || 0,
        total_mrr: data.recurring_revenue[i]?.value || 0,
        arr: (data.recurring_revenue[i]?.value || 0) * 12
      };
      
      breakdowns.push(breakdown);
    }
    
    return breakdowns;
  }

  // Get MRR breakdown for dashboard (last 6 months by default)
  async getMRRBreakdown(months: number = 6): Promise<APIResponse<MRRBreakdown[]>> {
    try {
      const response = await this.getMonthlyMetrics();
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { message: 'Failed to fetch monthly metrics' }
        };
      }

      const breakdown = this.transformToMRRBreakdown(response.data, months);
      
      return {
        success: true,
        data: breakdown
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to generate MRR breakdown',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  // Utility functions to calculate metrics from customer data
  private calculateMRRMetrics(customers: Customer[]): CalculatedMRR {
    const activeCustomers = customers.filter(c => !c.status.includes('churned') && c.status !== 'no_history');
    const churned = customers.filter(c => c.status.includes('churned'));
    
    const currentMRR = activeCustomers.reduce((sum, c) => sum + c.mrr_cents, 0);
    
    return {
      current_mrr_cents: currentMRR,
      active_customers: activeCustomers.length,
      churned_customers: churned.length,
      total_customers: customers.length,
      average_mrr_per_customer: activeCustomers.length > 0 ? currentMRR / activeCustomers.length : 0
    };
  }

  private calculateChurnMetrics(customers: Customer[]): CalculatedChurn {
    const churned = customers.filter(c => c.status.includes('churned'));
    const total = customers.length;
    
    const voluntary = churned.filter(c => c.status === 'churned_voluntary').length;
    const delinquent = churned.filter(c => c.status === 'churned_delinquent').length;
    const trial = churned.filter(c => c.status === 'churned_trial').length;
    
    // Calculate churned this month
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const churnedThisMonth = churned.filter(c => 
      c.churned_on && c.churned_on.startsWith(thisMonth)
    ).length;
    
    return {
      churn_rate: total > 0 ? (churned.length / total) * 100 : 0,
      churned_this_month: churnedThisMonth,
      voluntary_churn: voluntary,
      delinquent_churn: delinquent,
      trial_churn: trial
    };
  }

  private calculateRevenueMetrics(customers: Customer[]): CalculatedRevenue {
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spend_cents, 0);
    const activeMRR = customers
      .filter(c => !c.status.includes('churned') && c.status !== 'no_history')
      .reduce((sum, c) => sum + c.mrr_cents, 0);
    const churned = customers.filter(c => c.status.includes('churned'));
    const churnedRevenue = churned.reduce((sum, c) => sum + c.total_spend_cents, 0);
    
    return {
      total_revenue_cents: totalRevenue,
      average_customer_value: customers.length > 0 ? totalRevenue / customers.length : 0,
      total_active_mrr: activeMRR,
      total_churned_revenue: churnedRevenue
    };
  }

  private calculateProductMetrics(customers: Customer[]): ProductMetrics {
    const metrics: ProductMetrics = {};
    
    customers.forEach(customer => {
      customer.plans.forEach(plan => {
        if (!metrics[plan]) {
          metrics[plan] = {
            customer_count: 0,
            total_mrr_cents: 0,
            churn_rate: 0
          };
        }
        
        metrics[plan].customer_count++;
        metrics[plan].total_mrr_cents += customer.mrr_cents;
      });
    });
    
    // Calculate churn rates for each product
    Object.keys(metrics).forEach(plan => {
      const planCustomers = customers.filter(c => c.plans.includes(plan));
      const planChurned = planCustomers.filter(c => c.status.includes('churned'));
      metrics[plan].churn_rate = planCustomers.length > 0 ? 
        (planChurned.length / planCustomers.length) * 100 : 0;
    });
    
    return metrics;
  }

  // Customers
  async getCustomers(options: {
    page?: number;
    per_page?: number;
    status?: 'active' | 'churned' | 'paused' | 'trialing';
    created_after?: string;
    created_before?: string;
  } = {}): Promise<APIResponse<CustomersResponse>> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.status) params.append('status', options.status);
    if (options.created_after) params.append('created_after', options.created_after);
    if (options.created_before) params.append('created_before', options.created_before);
    
    const endpoint = `/customers/${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<CustomersResponse>(endpoint);
  }

  // Get recent customers (last 30 days)
  async getRecentCustomers(limit: number = 10): Promise<APIResponse<CustomersResponse>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.getCustomers({
      created_after: thirtyDaysAgo.toISOString().split('T')[0],
      per_page: limit,
      status: 'active'
    });
  }

  // Get recently churned customers (last 30 days)
  async getRecentChurn(limit: number = 10): Promise<APIResponse<CustomersResponse>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.getCustomers({
      created_after: thirtyDaysAgo.toISOString().split('T')[0],
      per_page: limit,
      status: 'churned'
    });
  }

  // Get all dashboard metrics using the working customers API and calculations
  async getDashboardMetrics(): Promise<APIResponse<DashboardMetrics>> {
    try {
      console.log('Fetching dashboard metrics from customer data...');
      
      // Get all customers (maximum allowed per_page is 250)
      const customersResponse = await this.getCustomers({ per_page: 250 });
      
      if (!customersResponse.success || !customersResponse.data) {
        return {
          success: false,
          error: {
            message: 'Failed to fetch customer data',
            details: customersResponse.error?.message || 'No customer data received'
          }
        };
      }

      const customers = customersResponse.data;
      console.log(`Processing ${customers.length} customers for metrics calculation...`);

      // Calculate all metrics from customer data
      const calculatedMRR = this.calculateMRRMetrics(customers);
      const calculatedChurn = this.calculateChurnMetrics(customers);
      const calculatedRevenue = this.calculateRevenueMetrics(customers);
      const productMetrics = this.calculateProductMetrics(customers);

      return {
        success: true,
        data: {
          customers: customers,
          calculated_mrr: calculatedMRR,
          calculated_churn: calculatedChurn,
          calculated_revenue: calculatedRevenue,
          product_metrics: productMetrics,
          last_updated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Failed to calculate dashboard metrics:', error);
      return {
        success: false,
        error: {
          message: 'Failed to calculate dashboard metrics from customer data',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}

// Factory function to create client instance
export function createProfitwellClient(apiKey?: string): ProfitwellAPIClient {
  // For client-side usage, we don't need an API key as requests go through our API route
  const isClient = typeof window !== 'undefined';
  if (isClient) {
    return new ProfitwellAPIClient();
  }
  
  // For server-side usage, we need an API key
  const key = apiKey || process.env.REACT_APP_PROFITWELL_API_KEY || process.env.PROFITWELL_API_KEY || process.env.NEXT_PUBLIC_PROFITWELL_API_KEY || '';
  return new ProfitwellAPIClient(key);
}