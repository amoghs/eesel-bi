'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { RevenueAnalytics } from '@/components/dashboard/RevenueAnalytics';
import { BurnAnalytics } from '@/components/dashboard/BurnAnalytics';
import { BankBalanceCards } from '@/components/dashboard/BankBalanceCards';
import { MRRSummaryCards } from '@/components/dashboard/MRRSummaryCards';
import { CombinedMRRBreakdownTable } from '@/components/dashboard/CombinedMRRBreakdownTable';
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'revenue':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Revenue Analytics</h1>
              <p className="text-muted-foreground">
                Track MRR growth, revenue sources, and subscription metrics
              </p>
            </div>
            <RevenueAnalytics />
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Detailed Breakdown</h2>
              <CombinedMRRBreakdownTable />
            </div>
          </div>
        );

      case 'burn':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Burn & Cash Flow</h1>
              <p className="text-muted-foreground">
                Monitor spending, burn rate, and vendor breakdown
              </p>
            </div>
            <BurnAnalytics />
          </div>
        );

      case 'banking':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Banking & Balances</h1>
              <p className="text-muted-foreground">
                Current account balances and banking overview
              </p>
            </div>
            <BankBalanceCards />
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Customer Intelligence</h1>
              <p className="text-muted-foreground">
                Customer metrics, churn analysis, and growth insights
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 col-span-4">
                <h3 className="text-lg font-medium mb-4">Customer Analytics</h3>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Customer intelligence components coming soon
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 col-span-3">
                <h3 className="text-lg font-medium mb-4">Churn Analysis</h3>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Churn intelligence and at-risk customers
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure your dashboard and integrations
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">API Integrations</h3>
                <div className="space-y-2 text-sm">
                  <div>✅ Profitwell API: Connected</div>
                  <div>✅ Atlassian API: Connected</div>
                  <div>✅ Mercury API: Connected</div>
                  <div>📝 Macquarie Balance: Manual ($45,230 AUD)</div>
                </div>
              </div>
            </div>
          </div>
        );

      default: // overview
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground">
                Key metrics and insights for eesel AI
              </p>
            </div>
            
            {/* Key Metrics Summary */}
            <MRRSummaryCards />
            
            {/* Quick Bank Balances */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Bank Balances</h2>
              <BankBalanceCards />
            </div>

            {/* Navigation Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div 
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveSection('revenue')}
              >
                <h3 className="text-lg font-medium mb-2">Revenue Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed MRR growth, revenue sources, and subscription metrics
                </p>
              </div>
              
              <div 
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveSection('burn')}
              >
                <h3 className="text-lg font-medium mb-2">Burn Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Track spending patterns, vendor breakdown, and burn rate trends
                </p>
              </div>
              
              <div 
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveSection('customers')}
              >
                <h3 className="text-lg font-medium mb-2">Customer Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Customer metrics, churn analysis, and growth insights
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <div className="font-semibold">eesel AI BI Dashboard</div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}