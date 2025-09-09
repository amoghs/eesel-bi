'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCombinedMRRData } from '@/hooks/useCombinedMRRData';
import { formatCurrency, formatMonth } from '@/lib/utils';
import { Download, RefreshCw, Building2, ShoppingCart } from 'lucide-react';

export function CombinedMRRBreakdownTable() {
  const { combinedData, loading, error, refetch, services } = useCombinedMRRData(6);

  const exportToCSV = () => {
    if (!combinedData) return;
    
    const headers = [
      'Month',
      'Total New Revenue',
      'Total Reactivations', 
      'Total Upgrades',
      'Total Downgrades',
      'Total Voluntary Churn',
      'Total Delinquent Churn',
      'Total Existing',
      'Total MRR',
      'Profitwell New Revenue',
      'Profitwell Reactivations',
      'Profitwell Upgrades', 
      'Profitwell Downgrades',
      'Profitwell Voluntary Churn',
      'Profitwell Delinquent Churn',
      'Profitwell Existing',
      'Profitwell MRR',
      'Atlassian New Revenue',
      'Atlassian Reactivations',
      'Atlassian Upgrades',
      'Atlassian Downgrades', 
      'Atlassian Voluntary Churn',
      'Atlassian Delinquent Churn',
      'Atlassian Existing',
      'Atlassian MRR'
    ];
    
    const csvContent = [
      headers.join(','),
      ...combinedData.map(row => [
        formatMonth(row.date),
        row.combined.new_revenue,
        row.combined.reactivations,
        row.combined.upgrades,
        row.combined.downgrades,
        row.combined.voluntary_churn,
        row.combined.delinquent_churn,
        row.combined.existing,
        row.combined.total_mrr,
        row.profitwell.new_revenue,
        row.profitwell.reactivations,
        row.profitwell.upgrades,
        row.profitwell.downgrades,
        row.profitwell.voluntary_churn,
        row.profitwell.delinquent_churn,
        row.profitwell.existing,
        row.profitwell.total_mrr,
        row.atlassian.new_revenue,
        row.atlassian.reactivations,
        row.atlassian.upgrades,
        row.atlassian.downgrades,
        row.atlassian.voluntary_churn,
        row.atlassian.delinquent_churn,
        row.atlassian.existing,
        row.atlassian.total_mrr
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined-mrr-breakdown.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Combined MRR Breakdown</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading combined MRR breakdown data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Combined MRR Breakdown</CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-destructive mb-4">
              Error loading combined data
            </div>
            {services.profitwell.error && (
              <div className="text-sm text-muted-foreground mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Profitwell: {services.profitwell.error}
              </div>
            )}
            {services.atlassian.error && (
              <div className="text-sm text-muted-foreground">
                <ShoppingCart className="inline h-4 w-4 mr-1" />
                Atlassian: {services.atlassian.error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!combinedData || combinedData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Combined MRR Breakdown</CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Combined MRR Breakdown</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Month</th>
                  <th className="text-right p-4 font-medium text-green-600">New</th>
                  <th className="text-right p-4 font-medium text-blue-600">Reactivations</th>
                  <th className="text-right p-4 font-medium text-purple-600">Upgrades</th>
                  <th className="text-right p-4 font-medium text-orange-600">Downgrades</th>
                  <th className="text-right p-4 font-medium text-red-600">Voluntary Churn</th>
                  <th className="text-right p-4 font-medium text-red-700">Delinquent Churn</th>
                  <th className="text-right p-4 font-medium text-gray-600">Existing</th>
                  <th className="text-right p-4 font-medium font-bold">Total MRR</th>
                  <th className="text-right p-4 font-medium text-blue-500">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Profitwell
                  </th>
                  <th className="text-right p-4 font-medium text-purple-500">
                    <ShoppingCart className="inline h-4 w-4 mr-1" />
                    Atlassian
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((row, index) => (
                  <tr key={row.date} className={`border-b hover:bg-muted/30 ${index === combinedData.length - 1 ? 'bg-muted/20 font-medium' : ''}`}>
                    <td className="p-4">
                      <div className="font-medium">{formatMonth(row.date)}</div>
                      {index === combinedData.length - 1 && (
                        <div className="text-xs text-muted-foreground">Latest</div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(row.combined.new_revenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.new_revenue)} | AT: {formatCurrency(row.atlassian.new_revenue)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-blue-600">
                        {formatCurrency(row.combined.reactivations)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.reactivations)} | AT: {formatCurrency(row.atlassian.reactivations)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-purple-600">
                        {formatCurrency(row.combined.upgrades)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.upgrades)} | AT: {formatCurrency(row.atlassian.upgrades)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-orange-600">
                        {formatCurrency(row.combined.downgrades)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.downgrades)} | AT: {formatCurrency(row.atlassian.downgrades)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-red-600">
                        {formatCurrency(row.combined.voluntary_churn)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.voluntary_churn)} | AT: {formatCurrency(row.atlassian.voluntary_churn)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-red-700">
                        {formatCurrency(row.combined.delinquent_churn)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.delinquent_churn)} | AT: {formatCurrency(row.atlassian.delinquent_churn)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-gray-600">
                        {formatCurrency(row.combined.existing)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PW: {formatCurrency(row.profitwell.existing)} | AT: {formatCurrency(row.atlassian.existing)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(row.combined.total_mrr)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ARR: {formatCurrency(row.combined.arr)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-blue-600">
                        {formatCurrency(row.profitwell.total_mrr)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.combined.total_mrr > 0 ? ((row.profitwell.total_mrr / row.combined.total_mrr) * 100).toFixed(1) : 0}%
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-purple-600">
                        {formatCurrency(row.atlassian.total_mrr)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.combined.total_mrr > 0 ? ((row.atlassian.total_mrr / row.combined.total_mrr) * 100).toFixed(1) : 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <Building2 className="h-3 w-3 text-blue-500 mr-1" />
              PW = Profitwell
            </div>
            <div className="flex items-center">
              <ShoppingCart className="h-3 w-3 text-purple-500 mr-1" />
              AT = Atlassian
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}