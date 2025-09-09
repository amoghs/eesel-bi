'use client';

import { useMercuryBurnData } from '@/hooks/useMercuryData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function BurnRateChart() {
  const { data: burnData, loading, error } = useMercuryBurnData(3);

  if (loading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Burn Rate Unavailable</CardTitle>
          <CardDescription className="text-yellow-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">
            Mercury API integration is ready. Add your API key to view burn rate data.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!burnData || burnData.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Monthly Burn Rate</CardTitle>
          <CardDescription>No burn rate data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect Mercury API to view burn rate analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = burnData.map(metric => ({
    month: metric.period,
    burn: metric.totalBurn,
    transactions: metric.transactionCount,
    avgTransaction: metric.averageTransactionSize
  }));

  // Get latest month's category breakdown for pie chart
  const latestMonth = burnData[burnData.length - 1];
  const categoryData = Object.entries(latestMonth.categoryBreakdown).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / latestMonth.totalBurn) * 100).toFixed(1)
  }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Calculate month-over-month change
  const currentBurn = burnData[burnData.length - 1]?.totalBurn || 0;
  const previousBurn = burnData[burnData.length - 2]?.totalBurn || 0;
  const burnChange = previousBurn > 0 ? ((currentBurn - previousBurn) / previousBurn) * 100 : 0;

  return (
    <div className="grid gap-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Monthly Burn</CardTitle>
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentBurn.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className={`text-xs ${burnChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {burnChange >= 0 ? '+' : ''}{burnChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMonth.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">
              ${latestMonth.averageTransactionSize.toFixed(0)} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
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
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(currentBurn / 30).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Burn Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Burn Trend</CardTitle>
            <CardDescription>Spending over the last {burnData.length} months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'burn' ? `$${value.toLocaleString()}` : value.toLocaleString(), 
                    name === 'burn' ? 'Monthly Burn' : 
                    name === 'transactions' ? 'Transactions' : 'Avg Transaction'
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="burn" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Categories</CardTitle>
            <CardDescription>Breakdown for {latestMonth.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center">
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 lg:mt-0 lg:ml-4 space-y-2">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center space-x-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      ${category.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>Highest spending in {latestMonth.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(latestMonth.vendorBreakdown)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([vendor, amount], index) => (
                <div key={vendor} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{vendor}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}