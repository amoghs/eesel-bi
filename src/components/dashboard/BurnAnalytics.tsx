'use client';

import { useMercuryBurnData } from '@/hooks/useMercuryData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Activity } from 'lucide-react';

export function BurnAnalytics() {
  const { data: burnData, loading, error } = useMercuryBurnData(6); // Last 6 months

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
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Burn Analytics Unavailable</CardTitle>
          <CardDescription className="text-yellow-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">
            Check your Mercury API configuration. Showing demo data would go here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!burnData || burnData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burn Rate Analytics</CardTitle>
          <CardDescription>No burn data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect Mercury API to view comprehensive burn rate analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  // Process data for charts
  const latestMonth = burnData[burnData.length - 1];
  const previousMonth = burnData.length > 1 ? burnData[burnData.length - 2] : null;
  
  // Calculate trends
  const burnTrend = previousMonth ? 
    ((latestMonth.totalBurn - previousMonth.totalBurn) / previousMonth.totalBurn) * 100 : 0;
  
  // Prepare monthly trend data
  const monthlyTrendData = burnData.map(month => ({
    period: month.period,
    totalBurn: month.totalBurn,
    transactionCount: month.transactionCount,
    avgTransaction: month.averageTransactionSize,
    dailyBurn: month.totalBurn / 30
  }));

  // Prepare vendor breakdown (top 10)
  const vendorData = Object.entries(latestMonth.vendorBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([vendor, amount]) => ({
      vendor: vendor.length > 15 ? vendor.slice(0, 15) + '...' : vendor,
      amount,
      percentage: ((amount / latestMonth.totalBurn) * 100).toFixed(1)
    }));

  // Prepare category breakdown
  const categoryData = Object.entries(latestMonth.categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / latestMonth.totalBurn) * 100).toFixed(1)
    }));

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Burn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${latestMonth.totalBurn.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className={`text-xs ${burnTrend >= 0 ? 'text-red-600' : 'text-green-600'} flex items-center`}>
              {burnTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(burnTrend).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(latestMonth.totalBurn / 30).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              per day this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMonth.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              ${latestMonth.averageTransactionSize.toFixed(0)} average size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Vendor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${vendorData[0]?.amount.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {vendorData[0]?.vendor || 'No data'} ({vendorData[0]?.percentage || '0'}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Burn Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Burn Trend</CardTitle>
            <CardDescription>Spending over the last {burnData.length} months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'totalBurn' ? `$${value.toLocaleString()}` : 
                    name === 'transactionCount' ? value.toString() : 
                    `$${Math.round(value).toLocaleString()}`,
                    name === 'totalBurn' ? 'Monthly Burn' : 
                    name === 'transactionCount' ? 'Transactions' :
                    'Daily Average'
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalBurn"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dailyBurn"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spend</CardTitle>
            <CardDescription>Largest expenses in {latestMonth.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vendor" type="category" width={80} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#8884d8">
                  {vendorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Expense categories for {latestMonth.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume & Size Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Patterns</CardTitle>
            <CardDescription>Volume and average size over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'transactionCount' ? value.toString() : `$${Math.round(value).toLocaleString()}`,
                    name === 'transactionCount' ? 'Transactions' : 'Avg Transaction'
                  ]}
                />
                <Bar yAxisId="left" dataKey="transactionCount" fill="#8884d8" fillOpacity={0.6} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="avgTransaction" 
                  stroke="#ff7300" 
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Vendor List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Spending Breakdown</CardTitle>
          <CardDescription>All vendors for {latestMonth.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {vendorData.map((vendor, index) => (
              <div key={vendor.vendor} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium">{vendor.vendor}</p>
                    <p className="text-sm text-muted-foreground">{vendor.percentage}% of total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${vendor.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}