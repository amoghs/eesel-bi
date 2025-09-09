'use client';

import { useMercuryBalances } from '@/hooks/useMercuryData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BankBalanceCards() {
  const { data: balances, loading, error } = useMercuryBalances();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !balances) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Bank Balance Error</CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Please check your Mercury API configuration or contact support if this persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">No Bank Data</CardTitle>
          <CardDescription className="text-yellow-600">
            No bank account information available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate totals by currency
  const totals = balances.reduce((acc, balance) => {
    const currency = balance.currency;
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += balance.balance;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Total Balances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(totals).map(([currency, total]) => (
          <Card key={currency}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cash ({currency})
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20m9-2H3m12-5c0 1.66-2.69 3-6 3s-6-1.34-6-3 2.69-3 6-3 6 1.34 6 3z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {balances.filter(b => b.currency === currency).length} accounts
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Account Balances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {balances.map((balance, index) => (
          <Card key={`${balance.source}-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {balance.accountName}
              </CardTitle>
              <div className="flex items-center space-x-1">
                {balance.source === 'mercury' ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full" title="Mercury (Live)" />
                ) : (
                  <div className="h-2 w-2 bg-blue-500 rounded-full" title="Manual Entry" />
                )}
                <span className="text-xs text-muted-foreground uppercase">
                  {balance.source}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                ${balance.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {balance.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                {balance.source === 'mercury' ? 'Live data' : 'Manual entry'} • 
                Updated {new Date(balance.lastUpdated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Information */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
              <p className="text-sm text-yellow-800">
                <strong>Notice:</strong> {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}