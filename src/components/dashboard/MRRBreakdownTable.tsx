'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMRRData } from '@/hooks/useMRRData';
import { formatCurrency, formatMonth } from '@/lib/utils';
import { Download, RefreshCw } from 'lucide-react';

export function MRRBreakdownTable() {
  const { data, loading, error, refetch } = useMRRData(6);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>MRR Breakdown</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading MRR breakdown data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>MRR Breakdown</CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-destructive">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MRR Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No MRR data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const exportCSV = () => {
    const headers = ['Month', 'New', 'Reactivations', 'Upgrades', 'Downgrades', 'Voluntary Churn', 'Delinquent Churn', 'Existing', 'MRR', 'ARR'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        formatMonth(row.date),
        row.new_revenue,
        row.reactivations,
        row.upgrades,
        row.downgrades,
        row.voluntary_churn,
        row.delinquent_churn,
        row.existing,
        row.total_mrr,
        row.arr
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mrr-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get the latest month for current metrics
  const latestMonth = data[data.length - 1];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          MRR Breakdown
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-2 font-medium text-muted-foreground"></th>
                {data.map((month) => (
                  <th key={month.date} className="py-3 px-4 font-medium text-center min-w-[120px]">
                    {formatMonth(month.date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-green-600">NEW</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-green-600">
                    {formatCurrency(month.new_revenue)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(month.new_revenue * 1.1)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-blue-600">REACTIVATIONS</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-blue-600">
                    {formatCurrency(month.reactivations)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(Math.max(month.reactivations * 1.2, 500))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-purple-600">UPGRADES</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-purple-600">
                    {formatCurrency(month.upgrades)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(Math.max(month.upgrades * 1.5, 1000))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-orange-600">DOWNGRADES</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-orange-600">
                    {formatCurrency(month.downgrades)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(month.downgrades)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-red-600">VOLUNTARY CHURN</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-red-600">
                    {formatCurrency(month.voluntary_churn)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(month.voluntary_churn * 0.8)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-red-800">DELINQUENT CHURN</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-red-800">
                    {formatCurrency(month.delinquent_churn)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PROJ: {formatCurrency(Math.min(month.delinquent_churn * 0.5, -200))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium text-slate-600">EXISTING</td>
                {data.map((month) => (
                  <td key={month.date} className="py-3 px-4 text-center font-medium text-slate-600">
                    {formatCurrency(month.existing)}
                  </td>
                ))}
              </tr>

              <tr className="border-b-2 border-slate-300 hover:bg-muted/50">
                <td className="py-4 px-2 font-bold text-lg">MRR</td>
                {data.map((month) => (
                  <td key={month.date} className="py-4 px-4 text-center font-bold text-lg">
                    {formatCurrency(month.total_mrr)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1 font-normal">
                        PROJ: {formatCurrency(month.total_mrr * 1.05)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-muted/50">
                <td className="py-4 px-2 font-bold text-lg">ARR</td>
                {data.map((month) => (
                  <td key={month.date} className="py-4 px-4 text-center font-bold text-lg">
                    {formatCurrency(month.arr)}
                    {month.date === latestMonth.date && (
                      <div className="text-xs text-muted-foreground mt-1 font-normal">
                        PROJ: {formatCurrency(month.arr * 1.05)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}