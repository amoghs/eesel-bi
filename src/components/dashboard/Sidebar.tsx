'use client';

import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  PieChart,
  Settings,
  Home
} from "lucide-react";

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const menuItems = [
    {
      id: "overview",
      title: "Overview", 
      icon: Home,
      description: "Dashboard overview"
    },
    {
      id: "revenue",
      title: "Revenue Analytics",
      icon: TrendingUp,
      description: "MRR, growth, and revenue trends"
    },
    {
      id: "burn",
      title: "Burn & Cash Flow", 
      icon: BarChart3,
      description: "Spending analysis and burn rate"
    },
    {
      id: "customers",
      title: "Customer Intelligence",
      icon: Users,
      description: "Customer metrics and churn analysis"
    },
    {
      id: "banking",
      title: "Banking & Balances",
      icon: CreditCard,
      description: "Account balances and transactions"
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <PieChart className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">eesel AI</span>
            <span className="text-xs text-sidebar-muted-foreground">Business Intelligence</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => onSectionChange(item.id)}
                  className={activeSection === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                  tooltip={item.description}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange("settings")}
                className={activeSection === "settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}