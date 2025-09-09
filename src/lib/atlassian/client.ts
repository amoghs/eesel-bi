import {
  AtlassianConfig,
  AtlassianTransaction,
  AtlassianChurnEvent,
  AtlassianMRRBreakdown,
  AtlassianMonthlyData,
  MonthlyCustomerMetrics,
  APIResponse
} from './types';

export class AtlassianAPIClient {
  private readonly baseUrl = 'https://marketplace.atlassian.com/rest/2/vendors';
  private readonly config: AtlassianConfig;
  private readonly isClient: boolean;

  constructor(config: AtlassianConfig) {
    this.config = config;
    this.isClient = typeof window !== 'undefined';
  }

  private async makeRequest<T>(endpoint: string): Promise<APIResponse<T>> {
    let url: string;
    let requestOptions: RequestInit;

    if (this.isClient) {
      // Client-side: use Next.js API route to avoid CORS
      url = `/api/atlassian?endpoint=${encodeURIComponent(endpoint)}`;
      requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
    } else {
      // Server-side: call Atlassian API directly
      url = `${this.baseUrl}/${endpoint}`;
      const auth = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
      requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      };
    }

    try {
      console.log(`Making ${this.isClient ? 'client-side' : 'server-side'} Atlassian request to: ${url}`);
      const response = await fetch(url, requestOptions);

      const responseText = await response.text();
      console.log(`Atlassian API response status: ${response.status}`);

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: {
            message: 'Invalid JSON response from Atlassian API',
            details: responseText
          }
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
            code: response.status.toString(),
            details: JSON.stringify(data)
          }
        };
      }

      return {
        success: true,
        data: data as T
      };

    } catch (error) {
      console.error('Atlassian API request failed:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : String(error)
        }
      };
    }
  }

  // Fetch transactions from Atlassian API
  async getTransactions(): Promise<APIResponse<AtlassianTransaction[]>> {
    const endpoint = `${this.config.vendorId}/reporting/sales/transactions/export`;
    return this.makeRequest<AtlassianTransaction[]>(endpoint);
  }

  // Fetch churn events from Atlassian API
  async getChurnEvents(): Promise<APIResponse<AtlassianChurnEvent[]>> {
    const endpoint = `${this.config.vendorId}/reporting/sales/metrics/churn/details/export`;
    return this.makeRequest<AtlassianChurnEvent[]>(endpoint);
  }

  // Parse date helper
  private parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  // Build monthly revenue from transactions (converted from your Python script)
  private buildMonthlyRevenue(transactions: AtlassianTransaction[]): Record<string, Record<string, number>> {
    const monthlyRevenue: Record<string, Record<string, number>> = {};

    for (const transaction of transactions) {
      const saleDate = this.parseDate(transaction.purchaseDetails.saleDate);
      const saleType = transaction.purchaseDetails.saleType;
      const billingPeriod = transaction.purchaseDetails.billingPeriod;
      const customer = transaction.cloudId;
      const purchasePrice = transaction.purchaseDetails.purchasePrice;
      const oldPurchasePrice = transaction.purchaseDetails.oldPurchasePrice || 0;

      if (billingPeriod === 'Annual') {
        // Spread annual payment across 12 months
        const monthlyAmount = purchasePrice / 12;
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(saleDate);
          monthDate.setMonth(monthDate.getMonth() + i);
          const yearMonth = this.formatYearMonth(monthDate);

          if (!monthlyRevenue[yearMonth]) {
            monthlyRevenue[yearMonth] = {};
          }
          if (!monthlyRevenue[yearMonth][customer]) {
            monthlyRevenue[yearMonth][customer] = 0;
          }
          monthlyRevenue[yearMonth][customer] += monthlyAmount;
        }
      } else {
        // Monthly billing
        const yearMonth = this.formatYearMonth(saleDate);
        let amount: number;

        if (saleType === 'New') {
          amount = purchasePrice;
        } else if (saleType === 'Upgrade') {
          amount = purchasePrice - oldPurchasePrice;
        } else { // Renewal
          amount = purchasePrice;
        }

        if (!monthlyRevenue[yearMonth]) {
          monthlyRevenue[yearMonth] = {};
        }
        if (!monthlyRevenue[yearMonth][customer]) {
          monthlyRevenue[yearMonth][customer] = 0;
        }
        monthlyRevenue[yearMonth][customer] += amount;
      }
    }

    return monthlyRevenue;
  }

  // Format date as YYYY-MM
  private formatYearMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Calculate metrics for a given month (converted from your Python script)
  private calculateMetrics(
    currentMonth: Record<string, number>,
    previousMonth: Record<string, number>
  ): {
    new_revenue: number;
    expansion_revenue: number;
    retained_revenue: number;
    churned_revenue: number;
    new_customers: Record<string, number>;
    expanded_customers: Record<string, number>;
    retained_customers: Record<string, number>;
    churned_customers: Record<string, number>;
  } {
    let new_revenue = 0;
    let expansion_revenue = 0;
    let retained_revenue = 0;
    let churned_revenue = 0;

    const new_customers: Record<string, number> = {};
    const expanded_customers: Record<string, number> = {};
    const retained_customers: Record<string, number> = {};
    const churned_customers: Record<string, number> = {};

    // Calculate new, expansion, and retained revenue
    for (const [customer, amount] of Object.entries(currentMonth)) {
      if (!(customer in previousMonth)) {
        // New customer
        new_revenue += amount;
        new_customers[customer] = amount;
      } else {
        // Existing customer
        if (amount > previousMonth[customer]) {
          // Customer upgraded
          expansion_revenue += amount - previousMonth[customer];
          expanded_customers[customer] = amount - previousMonth[customer];
        }
        retained_revenue += Math.min(amount, previousMonth[customer]);
        retained_customers[customer] = Math.min(amount, previousMonth[customer]);
      }
    }

    // Calculate churned revenue
    for (const [customer, amount] of Object.entries(previousMonth)) {
      if (!(customer in currentMonth)) {
        churned_revenue += amount;
        churned_customers[customer] = amount;
      }
    }

    return {
      new_revenue,
      expansion_revenue,
      retained_revenue,
      churned_revenue,
      new_customers,
      expanded_customers,
      retained_customers,
      churned_customers
    };
  }

  // Get MRR breakdown for the last N months (matching Profitwell structure)
  async getMRRBreakdown(months: number = 6): Promise<APIResponse<AtlassianMRRBreakdown[]>> {
    try {
      // Get transactions
      const transactionsResponse = await this.getTransactions();
      if (!transactionsResponse.success || !transactionsResponse.data) {
        return {
          success: false,
          error: transactionsResponse.error || { message: 'Failed to fetch transactions' }
        };
      }

      const transactions = transactionsResponse.data;
      const monthlyRevenue = this.buildMonthlyRevenue(transactions);

      // Generate breakdown for the last N months
      const breakdowns: AtlassianMRRBreakdown[] = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(currentDate.getMonth() - i);
        const yearMonth = this.formatYearMonth(targetDate);

        // Get previous month for comparison
        const prevDate = new Date(targetDate);
        prevDate.setMonth(targetDate.getMonth() - 1);
        const prevYearMonth = this.formatYearMonth(prevDate);

        const currentRevenue = monthlyRevenue[yearMonth] || {};
        const previousRevenue = monthlyRevenue[prevYearMonth] || {};

        const metrics = this.calculateMetrics(currentRevenue, previousRevenue);
        const totalMRR = metrics.new_revenue + metrics.expansion_revenue + metrics.retained_revenue;

        const breakdown: AtlassianMRRBreakdown = {
          date: yearMonth,
          new_revenue: metrics.new_revenue,
          reactivations: 0, // TODO: Implement reactivations logic if needed
          upgrades: metrics.expansion_revenue,
          downgrades: 0, // TODO: Handle downgrades separately from churn
          voluntary_churn: -metrics.churned_revenue, // Make it negative to match Profitwell
          delinquent_churn: 0, // Atlassian doesn't have delinquent churn concept
          existing: metrics.retained_revenue,
          total_mrr: totalMRR,
          arr: totalMRR * 12
        };

        breakdowns.push(breakdown);
      }

      return {
        success: true,
        data: breakdowns
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to generate Atlassian MRR breakdown',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  // Get detailed monthly data including customer breakdowns
  async getMonthlyData(months: number = 6): Promise<APIResponse<AtlassianMonthlyData[]>> {
    try {
      const transactionsResponse = await this.getTransactions();
      if (!transactionsResponse.success || !transactionsResponse.data) {
        return {
          success: false,
          error: transactionsResponse.error || { message: 'Failed to fetch transactions' }
        };
      }

      const transactions = transactionsResponse.data;
      const monthlyRevenue = this.buildMonthlyRevenue(transactions);
      const monthlyData: AtlassianMonthlyData[] = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(currentDate.getMonth() - i);
        const yearMonth = this.formatYearMonth(targetDate);

        const prevDate = new Date(targetDate);
        prevDate.setMonth(targetDate.getMonth() - 1);
        const prevYearMonth = this.formatYearMonth(prevDate);

        const currentRevenue = monthlyRevenue[yearMonth] || {};
        const previousRevenue = monthlyRevenue[prevYearMonth] || {};

        const metrics = this.calculateMetrics(currentRevenue, previousRevenue);
        const totalMRR = metrics.new_revenue + metrics.expansion_revenue + metrics.retained_revenue;

        const data: AtlassianMonthlyData = {
          date: yearMonth,
          new_revenue: metrics.new_revenue,
          reactivations: 0,
          upgrades: metrics.expansion_revenue,
          downgrades: 0,
          voluntary_churn: -metrics.churned_revenue,
          delinquent_churn: 0,
          existing: metrics.retained_revenue,
          total_mrr: totalMRR,
          arr: totalMRR * 12,
          new_customers: metrics.new_customers,
          reactivated_customers: {},
          upgraded_customers: metrics.expanded_customers,
          downgraded_customers: {},
          churned_customers: metrics.churned_customers,
          retained_customers: metrics.retained_customers
        };

        monthlyData.push(data);
      }

      return {
        success: true,
        data: monthlyData
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to generate Atlassian monthly data',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}

// Factory function to create client instance
export function createAtlassianClient(config?: AtlassianConfig): AtlassianAPIClient {
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    // For client-side, we still need vendorId to construct endpoints correctly
    return new AtlassianAPIClient({
      email: '',
      apiToken: '',
      vendorId: process.env.NEXT_PUBLIC_ATLASSIAN_VENDOR_ID || 
                process.env.REACT_APP_ATLASSIAN_VENDOR_ID || 
                '1221976' // fallback to your vendor ID
    });
  }
  
  // For server-side usage, use provided config or environment variables
  const finalConfig = config || {
    email: process.env.REACT_APP_ATLASSIAN_EMAIL || process.env.ATLASSIAN_EMAIL || '',
    apiToken: process.env.REACT_APP_ATLASSIAN_API_TOKEN || process.env.ATLASSIAN_API_TOKEN || '',
    vendorId: process.env.REACT_APP_ATLASSIAN_VENDOR_ID || process.env.ATLASSIAN_VENDOR_ID || ''
  };
  
  return new AtlassianAPIClient(finalConfig);
}