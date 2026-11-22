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

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function Sidebar({ orgSlug, role, orgName = 'Acme Commerce' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      id: 'operations',
      label: 'Operations',
      items: [
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
        {
          name: 'Inventory',
          href: `/${orgSlug}/inventory`,
          module: 'inventory',
          icon: Boxes,
          badge: 5,
          badgeVariant: 'danger',
        },
      ],
    },
    {
      id: 'supply',
      label: 'Supply & Catalog',
      items: [
        { name: 'Catalog', href: `/${orgSlug}/catalog`, module: 'catalog', icon: Package },
        { name: 'Purchasing', href: `/${orgSlug}/purchasing`, module: 'purchasing', icon: Briefcase },
        { name: 'Finance', href: `/${orgSlug}/finance`, module: 'finance', icon: DollarSign },
      ],
    },
    {
      id: 'customers',
      label: 'Customers & Care',
      items: [
        { name: 'Customers', href: `/${orgSlug}/customers`, module: 'customers', icon: Users },
        {
          name: 'Support',
          href: `/${orgSlug}/support`,
          module: 'support',
          icon: Headphones,
          badge: 3,
          badgeVariant: 'danger',
        },
        { name: 'Returns', href: `/${orgSlug}/returns`, module: 'returns', icon: RotateCcw },
        { name: 'Marketing', href: `/${orgSlug}/marketing`, module: 'marketing', icon: Megaphone },
      ],
    },
    {
      id: 'management',
      label: 'Platform & Setup',
      items: [
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
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-black/[0.08] bg-white transition-all duration-200 select-none z-10 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-black/[0.08] px-3.5 bg-white">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black text-white font-black text-xs shadow-sm select-none">
              <span className="text-white font-black text-xs leading-none">SO</span>
            </div>
            <div className="overflow-hidden">
              <span className="block truncate text-xs font-bold text-black tracking-tight leading-tight">
                {orgName}
              </span>
              <span className="block text-[10px] font-medium text-zinc-400 leading-none">
                Storefront Ops
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white font-black text-xs shadow-sm select-none">
            <span className="text-white font-black text-xs leading-none">SO</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Grouped Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 bg-white">
        {navGroups.map((group) => {
          // Filter items based on user's server role permissions
          const visibleItems = group.items.filter((item) =>
            checkPermission(role, item.module, 'view')
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {!collapsed ? (
                <div className="px-2.5 pb-1 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 select-none block">
                    {group.label}
                  </span>
                </div>
              ) : (
                <div className="my-2 border-t border-black/[0.06] first:hidden" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-black text-white shadow-xs font-bold'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <IconComponent
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-zinc-500 group-hover:text-black'
                          }`}
                        />
                        {!collapsed && (
                          <span
                            className={`truncate ${
                              isActive ? 'text-white font-bold' : 'text-zinc-700 group-hover:text-black'
                            }`}
                          >
                            {item.name}
                          </span>
                        )}
                      </div>

                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeVariant === 'danger'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Role Footer */}
      {!collapsed && (
        <div className="border-t border-black/[0.08] p-3 bg-white">
          <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 border border-black/[0.06] p-2.5 text-xs">
            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="overflow-hidden">
              <span className="block truncate font-bold text-black capitalize leading-tight">
                {role.replace('_', ' ')}
              </span>
              <span className="block text-[10px] text-zinc-500 font-medium leading-none">
                Active Tenant Policy
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
