'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  RotateCcw,
  Package,
  Boxes,
  Briefcase,
  Users,
  Megaphone,
  Headphones,
  DollarSign,
  Kanban,
  BarChart3,
  Zap,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type { UserRole } from '@storefront-ops/db';
import { checkPermission, type OpsModule } from '@/lib/auth/guards';

interface SidebarProps {
  orgSlug: string;
  role: UserRole;
  orgName?: string;
}

interface NavItem {
  name: string;
  href: string;
  module: OpsModule;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'warning' | 'danger' | 'info';
}

export function Sidebar({ orgSlug, role, orgName = 'Acme Commerce' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Today', href: `/${orgSlug}/today`, module: 'today', icon: LayoutDashboard },
    {
      name: 'Orders',
      href: `/${orgSlug}/orders`,
      module: 'orders',
      icon: ShoppingCart,
      badge: 12,
      badgeVariant: 'warning',
    },
    {
      name: 'Fulfillment',
      href: `/${orgSlug}/fulfillment`,
      module: 'fulfillment',
      icon: Truck,
      badge: 'Pack',
      badgeVariant: 'info',
    },
    { name: 'Returns', href: `/${orgSlug}/returns`, module: 'returns', icon: RotateCcw },
    { name: 'Catalog', href: `/${orgSlug}/catalog`, module: 'catalog', icon: Package },
    {
      name: 'Inventory',
      href: `/${orgSlug}/inventory`,
      module: 'inventory',
      icon: Boxes,
      badge: 5,
      badgeVariant: 'danger',
    },
    { name: 'Purchasing', href: `/${orgSlug}/purchasing`, module: 'purchasing', icon: Briefcase },
    { name: 'Customers', href: `/${orgSlug}/customers`, module: 'customers', icon: Users },
    { name: 'Marketing', href: `/${orgSlug}/marketing`, module: 'marketing', icon: Megaphone },
    {
      name: 'Support',
      href: `/${orgSlug}/support`,
      module: 'support',
      icon: Headphones,
      badge: 3,
      badgeVariant: 'danger',
    },
    { name: 'Finance', href: `/${orgSlug}/finance`, module: 'finance', icon: DollarSign },
    {
      name: 'Tasks',
      href: `/${orgSlug}/tasks`,
      module: 'tasks',
      icon: Kanban,
      badge: 4,
      badgeVariant: 'info',
    },
    { name: 'Reports', href: `/${orgSlug}/reports`, module: 'reports', icon: BarChart3 },
    { name: 'Automations', href: `/${orgSlug}/automations`, module: 'automations', icon: Zap },
    { name: 'Integrations', href: `/${orgSlug}/integrations`, module: 'integrations', icon: Plug },
    { name: 'Settings', href: `/${orgSlug}/settings`, module: 'settings', icon: Settings },
  ];

  // Filter items based on user's server role permissions
  const visibleItems = navItems.filter((item) => checkPermission(role, item.module, 'view'));

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              SO
            </div>
            <span className="truncate text-xs font-semibold text-foreground tracking-tight">
              {orgName}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            SO
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`ml-auto rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : item.badgeVariant === 'danger'
                      ? 'bg-rose-500/10 text-rose-500'
                      : item.badgeVariant === 'warning'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Role Footer */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <div className="overflow-hidden">
              <span className="block truncate font-medium text-foreground capitalize">
                {role.replace('_', ' ')}
              </span>
              <span className="block text-[10px] text-muted-foreground">Active Policy</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
