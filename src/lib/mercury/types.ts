// Mercury Banking API types

export interface MercuryConfig {
  apiKey: string;
}

export interface MercuryAccount {
  id: string;
  name: string;
  type: string;
  availableBalance: number;
  currentBalance: number;
  currency: string;
  routingNumber?: string;
  accountNumber?: string;
}

export interface MercuryTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  counterpartyName?: string;
  createdAt: string;
  postedAt: string;
  status: 'pending' | 'posted' | 'cancelled';
  kind: 'debit' | 'credit';
  category?: string;
  note?: string;
  // Additional fields for expense categorization
  vendor?: string;
  expenseType?: 'software' | 'services' | 'payroll' | 'tax' | 'other';
}

export interface MercuryStatement {
  accountId: string;
  statementDate: string;
  beginningBalance: number;
  endingBalance: number;
  transactions: MercuryTransaction[];
}

export interface BurnRateMetrics {
  period: string; // YYYY-MM
  totalBurn: number;
  vendorBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  transactionCount: number;
  averageTransactionSize: number;
}

export interface BankBalance {
  source: 'mercury' | 'macquarie';
  accountName: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}