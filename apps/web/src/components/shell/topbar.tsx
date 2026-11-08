'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Store,
  Bell,
  Plus,
  User,
  LogOut,
  Command,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { UserSession } from '@/lib/auth/session';

interface TopbarProps {
  session: UserSession;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenQuickCreate: () => void;
}

const STORES = [
  { id: 'all', name: 'All Stores & Channels' },
  { id: 'shopify', name: 'Shopify Storefront (US)' },
  { id: 'woo', name: 'WooCommerce Storefront (UK)' },
];

export function Topbar({
  session,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenQuickCreate,
}: TopbarProps) {
  const router = useRouter();
  const [selectedStore, setSelectedStore] = useState(STORES[0]);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 gap-4 z-20">
      {/* Global Search Trigger (Cmd+K) */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center justify-between w-full max-w-sm rounded-lg border border-input bg-background/80 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span>Search orders, products, customers...</span>
        </div>
        <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Store / Channel Switcher */}
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden md:inline max-w-[140px] truncate">{selectedStore.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-lg z-30">
              <span className="block px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Channel Filter
              </span>
              {STORES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStore(s);
                    setStoreDropdownOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted text-left"
                >
                  <span className="truncate">{s.name}</span>
                  {selectedStore.id === s.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Menu */}
        <button
          onClick={onOpenQuickCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-md border border-zinc-200 bg-white p-1.5 text-black hover:bg-zinc-100 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-zinc-200 p-1 pr-2 hover:bg-zinc-100 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white font-bold text-xs select-none">
              <span className="text-white font-bold text-xs leading-none">{session.fullName.charAt(0)}</span>
            </div>
            <span className="hidden md:inline text-xs font-bold text-black">
              {session.fullName}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-card p-1 shadow-lg z-30">
              <div className="border-b border-border px-3 py-2">
                <span className="block text-xs font-semibold text-foreground truncate">{session.fullName}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{session.email}</span>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                  {session.role.replace('_', ' ')}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href={`/${session.organizationSlug}/settings`}
                  className="flex items-center gap-2 rounded px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Account &amp; Workspace</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
