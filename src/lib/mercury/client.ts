import {
  MercuryConfig,
  MercuryAccount,
  MercuryTransaction,
  MercuryStatement,
  BurnRateMetrics,
  BankBalance,
  APIResponse
} from './types';

export class MercuryAPIClient {
  private readonly baseUrl = 'https://api.mercury.com/api/v1';
  private readonly config: MercuryConfig;
  private readonly isClient: boolean;

  constructor(config: MercuryConfig) {
    this.config = config;
    this.isClient = typeof window !== 'undefined';
  }

  private async makeRequest<T>(endpoint: string): Promise<APIResponse<T>> {
    let url: string;
    let requestOptions: RequestInit;

    if (this.isClient) {
      // Client-side: use Next.js API route to avoid CORS and keep API key secure
      url = `/api/mercury?endpoint=${encodeURIComponent(endpoint)}`;
      requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
    } else {
      // Server-side: call Mercury API directly
      url = `${this.baseUrl}${endpoint}`;
      
      // Mercury requires the full secret-token: prefix if not already included
      const fullApiKey = this.config.apiKey.startsWith('secret-token:') 
        ? this.config.apiKey 
        : `secret-token:${this.config.apiKey}`;
      
      requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${fullApiKey}`,
          'Content-Type': 'application/json',
        },
      };
    }

    try {
      console.log(`Making ${this.isClient ? 'client-side' : 'server-side'} Mercury request to: ${url}`);
      const response = await fetch(url, requestOptions);

      const responseText = await response.text();
      console.log(`Mercury API response status: ${response.status}`);

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: {
            message: 'Invalid JSON response from Mercury API',
            details: responseText
          }
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error?.message || data.message || `HTTP ${response.status}: ${response.statusText}`,
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
      console.error('Mercury API request failed:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : String(error)
        }
      };
    }
  }

  // Fetch all accounts
  async getAccounts(): Promise<APIResponse<MercuryAccount[]>> {
    const response = await this.makeRequest<{ accounts: MercuryAccount[] }>('/accounts');
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.accounts
      };
    }
    
    return {
      success: false,
      error: response.error || { message: 'Failed to fetch accounts' }
    };
  }

  // Fetch transactions for a specific account
  async getTransactions(
    accountId: string, 
    params?: {
      startDate?: string; // YYYY-MM-DD
      endDate?: string;   // YYYY-MM-DD
      limit?: number;
      offset?: number;
    }
  ): Promise<APIResponse<MercuryTransaction[]>> {
    let endpoint = `/account/${accountId}/transactions`;
    
    const queryParams = new URLSearchParams();
    
    // Always add order=desc for most recent first
    queryParams.append('order', 'desc');
    
    if (params) {
      if (params.startDate) queryParams.append('start', params.startDate);
      if (params.endDate) queryParams.append('end', params.endDate);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
    }
    
    endpoint += `?${queryParams.toString()}`;

    const response = await this.makeRequest<{ transactions: MercuryTransaction[] }>(endpoint);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.transactions
      };
    }
    
    return {
      success: false,
      error: response.error || { message: 'Failed to fetch transactions' }
    };
  }

  // Get account statement for a specific period
  async getAccountStatement(accountId: string, statementDate: string): Promise<APIResponse<MercuryStatement>> {
    const endpoint = `/accounts/${accountId}/statements/${statementDate}`;
    return this.makeRequest<MercuryStatement>(endpoint);
  }

  // Helper method to categorize transactions for burn rate calculation
  private categorizeTransaction(transaction: MercuryTransaction): {
    vendor: string;
    category: string;
    expenseType: string;
  } {
    const description = transaction.description.toLowerCase();
    const counterparty = (transaction.counterpartyName || '').toLowerCase();
    
    // Define categorization rules
    let vendor = transaction.counterpartyName || 'Unknown';
    let category = 'Other';
    let expenseType = 'other';

    // Software/SaaS vendors
    if (description.includes('stripe') || description.includes('github') || 
        description.includes('vercel') || description.includes('openai') ||
        description.includes('anthropic') || description.includes('aws') ||
        description.includes('google cloud') || description.includes('microsoft')) {
      category = 'Software & Tools';
      expenseType = 'software';
    }
    
    // Payroll
    else if (description.includes('payroll') || description.includes('salary') ||
             description.includes('gusto') || description.includes('adp')) {
      category = 'Payroll';
      expenseType = 'payroll';
    }
    
    // Professional services
    else if (description.includes('legal') || description.includes('accounting') ||
             description.includes('consulting') || description.includes('service')) {
      category = 'Professional Services';
      expenseType = 'services';
    }
    
    // Tax payments
    else if (description.includes('tax') || description.includes('irs') ||
             description.includes('state tax')) {
      category = 'Taxes';
      expenseType = 'tax';
    }

    return { vendor, category, expenseType };
  }

  // Calculate burn rate metrics for recent months
  async getBurnRateMetrics(months: number = 3): Promise<APIResponse<BurnRateMetrics[]>> {
    try {
      // First, get all accounts
      const accountsResponse = await this.getAccounts();
      if (!accountsResponse.success || !accountsResponse.data) {
        return {
          success: false,
          error: accountsResponse.error || { message: 'Failed to fetch accounts' }
        };
      }

      const accounts = accountsResponse.data;
      const burnMetrics: BurnRateMetrics[] = [];
      
      // Generate date ranges for the last N months
      const currentDate = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(currentDate.getMonth() - i);
        const yearMonth = targetDate.toISOString().slice(0, 7); // YYYY-MM
        
        const startDate = `${yearMonth}-01`;
        const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
          .toISOString().slice(0, 10); // Last day of month

        let totalBurn = 0;
        const vendorBreakdown: Record<string, number> = {};
        const categoryBreakdown: Record<string, number> = {};
        let transactionCount = 0;

        // Fetch transactions for all accounts in this period
        for (const account of accounts) {
          const transactionsResponse = await this.getTransactions(account.id, {
            startDate,
            endDate,
            limit: 1000 // Adjust as needed
          });

          if (transactionsResponse.success && transactionsResponse.data) {
            const transactions = transactionsResponse.data;
            
            for (const transaction of transactions) {
              // Only count outgoing payments (debits) as burn
              if (transaction.kind === 'debit' && transaction.amount > 0) {
                const { vendor, category } = this.categorizeTransaction(transaction);
                
                totalBurn += transaction.amount;
                transactionCount++;
                
                vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + transaction.amount;
                categoryBreakdown[category] = (categoryBreakdown[category] || 0) + transaction.amount;
              }
            }
          }
        }

        const averageTransactionSize = transactionCount > 0 ? totalBurn / transactionCount : 0;

        burnMetrics.push({
          period: yearMonth,
          totalBurn,
          vendorBreakdown,
          categoryBreakdown,
          transactionCount,
          averageTransactionSize
        });
      }

      return {
        success: true,
        data: burnMetrics
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to calculate burn rate metrics',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  // Get current bank balances (Mercury accounts only - Macquarie will be manual)
  async getBankBalances(): Promise<APIResponse<BankBalance[]>> {
    try {
      const accountsResponse = await this.getAccounts();
      if (!accountsResponse.success || !accountsResponse.data) {
        return {
          success: false,
          error: accountsResponse.error || { message: 'Failed to fetch accounts' }
        };
      }

      const balances: BankBalance[] = accountsResponse.data.map(account => ({
        source: 'mercury' as const,
        accountName: account.name,
        balance: account.availableBalance,
        currency: account.currency,
        lastUpdated: new Date().toISOString()
      }));

      return {
        success: true,
        data: balances
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to fetch bank balances',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}

// Factory function to create client instance
export function createMercuryClient(config?: MercuryConfig): MercuryAPIClient {
  const isClient = typeof window !== 'undefined';
  
  // For server-side usage, use provided config or environment variables
  const finalConfig = config || {
    apiKey: process.env.REACT_APP_MERCURY_API_KEY || process.env.MERCURY_API_KEY || ''
  };
  
  return new MercuryAPIClient(finalConfig);
}