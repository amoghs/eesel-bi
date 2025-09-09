'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCombinedMRRData } from '@/hooks/useCombinedMRRData';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle, Building2, ShoppingCart } from 'lucide-react';

export function MRRSummaryCards() {
  const { summaryMetrics, loading, error, services } = useCombinedMRRData(6);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gray-200 h-8 rounded animate-pulse"></div>
              <div className="text-xs bg-gray-100 h-4 rounded mt-1 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summaryMetrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combined MRR Data</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">Error</div>
            <p className="text-xs text-muted-foreground">
              {error || 'No data available'}
            </p>
            {services.profitwell.error && (
              <p className="text-xs text-muted-foreground mt-1">
                Profitwell: {services.profitwell.error}
              </p>
            )}
            {services.atlassian.error && (
              <p className="text-xs text-muted-foreground mt-1">
                Atlassian: {services.atlassian.error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {/* Combined MRR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.currentMRR)}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            {summaryMetrics.monthlyGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={summaryMetrics.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(summaryMetrics.monthlyGrowth).toFixed(1)}%
            </span>
            <span className="ml-1">from last month</span>
          </p>
        </CardContent>
      </Card>

      {/* Profitwell MRR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitwell MRR</CardTitle>
          <Building2 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summaryMetrics.profitwellMRR)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summaryMetrics.profitwellPercentage.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      {/* Atlassian MRR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atlassian MRR</CardTitle>
          <ShoppingCart className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(summaryMetrics.atlassianMRR)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summaryMetrics.atlassianPercentage.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      {/* New Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summaryMetrics.newRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      {/* ARR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.currentARR)}</div>
          <p className="text-xs text-muted-foreground">
            Annual recurring revenue
          </p>
        </CardContent>
      </Card>

      {/* Monthly Churn */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Churn</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summaryMetrics.churnRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summaryMetrics.currentMRR > 0 ? (summaryMetrics.churnRevenue / summaryMetrics.currentMRR * 100).toFixed(1) : 0}% of MRR
          </p>
        </CardContent>
      </Card>
    </div>
  );
}