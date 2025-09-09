'use client';

import { useCombinedMRRData } from '@/hooks/useCombinedMRRData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Zap } from 'lucide-react';

export function RevenueAnalytics() {
  const { combinedData, summaryMetrics, loading, error } = useCombinedMRRData(6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !combinedData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Revenue Analytics Unavailable</CardTitle>
          <CardDescription className="text-red-600">
            {error || 'Failed to load revenue data'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = combinedData.map(item => ({
    date: item.date,
    // Combined totals
    totalMRR: item.combined.total_mrr,
    newRevenue: item.combined.new_revenue,
    upgrades: item.combined.upgrades,
    existing: item.combined.existing,
    churn: Math.abs(item.combined.voluntary_churn + item.combined.delinquent_churn),
    netGrowth: item.combined.new_revenue + item.combined.upgrades + item.combined.voluntary_churn + item.combined.delinquent_churn,
    // Individual sources
    profitwellMRR: item.profitwell.total_mrr,
    atlassianMRR: item.atlassian.total_mrr,
    // Growth rates
    arr: item.combined.arr
  }));

  // Calculate growth trend
  const latestData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  const growthRate = summaryMetrics?.monthlyGrowth || 0;

  // Prepare MRR breakdown data for stacked area chart
  const mrrBreakdownData = combinedData.map(item => ({
    date: item.date,
    new: item.combined.new_revenue,
    upgrades: item.combined.upgrades,
    existing: item.combined.existing,
    churn: item.combined.voluntary_churn + item.combined.delinquent_churn // Keep negative for visual
  }));

  // Prepare revenue source split
  const sourceData = [
    {
      name: 'Profitwell',
      value: summaryMetrics?.profitwellMRR || 0,
      percentage: summaryMetrics?.profitwellPercentage || 0
    },
    {
      name: 'Atlassian',
      value: summaryMetrics?.atlassianMRR || 0,
      percentage: summaryMetrics?.atlassianPercentage || 0
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics?.currentMRR.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}
            </div>
            <p className={`text-xs flex items-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(growthRate).toFixed(1)}% from last month
            </p>
            {summaryMetrics?.isAdjusted && (
              <p className="text-xs text-muted-foreground">Smart adjusted</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics?.currentARR.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Annual Run Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Revenue</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics?.newRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics?.netGrowth.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              New - Churn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MRR Trend */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Growth Trend</CardTitle>
            <CardDescription>Monthly Recurring Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="totalMRR"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Source Split */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Current MRR breakdown by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 lg:mt-0 lg:ml-4 space-y-2">
                {sourceData.map((source, index) => (
                  <div key={source.name} className="flex items-center space-x-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{source.name}</span>
                    <span className="text-muted-foreground">
                      ${source.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MRR Components Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Components</CardTitle>
            <CardDescription>New, Upgrades, Existing, and Churn</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={mrrBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${Math.abs(value).toLocaleString()}`,
                    name === 'new' ? 'New Revenue' :
                    name === 'upgrades' ? 'Upgrades' :
                    name === 'existing' ? 'Existing' : 'Churn'
                  ]}
                />
                <Legend />
                <Bar dataKey="new" stackId="a" fill="#00C49F" />
                <Bar dataKey="upgrades" stackId="a" fill="#0088FE" />
                <Bar dataKey="existing" stackId="a" fill="#FFBB28" />
                <Bar dataKey="churn" stackId="a" fill="#FF8042" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Sources Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources Trend</CardTitle>
            <CardDescription>Profitwell vs Atlassian over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'profitwellMRR' ? 'Profitwell' : 'Atlassian'
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profitwellMRR"
                  stroke="#0088FE"
                  strokeWidth={3}
                  name="Profitwell"
                />
                <Line
                  type="monotone"
                  dataKey="atlassianMRR"
                  stroke="#00C49F"
                  strokeWidth={3}
                  name="Atlassian"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment Note */}
      {summaryMetrics?.adjustmentNote && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-2">
              <div className="h-4 w-4 rounded-full bg-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Smart MRR Adjustment Applied</p>
                <p className="text-sm text-blue-600 mt-1">{summaryMetrics.adjustmentNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}