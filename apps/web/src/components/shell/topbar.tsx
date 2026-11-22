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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-black/[0.08] bg-white/95 backdrop-blur-md px-4 gap-4 select-none">
      {/* Global Search Trigger (Cmd+K) */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center justify-between w-full max-w-sm rounded-xl border border-black/[0.08] bg-zinc-50/70 px-3.5 py-1.5 text-xs text-zinc-500 hover:border-black/30 hover:bg-white hover:text-black transition-all shadow-xs"
        aria-label="Open command palette search"
      >
        <div className="flex items-center gap-2.5">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-medium text-xs">Search orders, inventory, SKUs...</span>
        </div>
        <kbd className="inline-flex items-center gap-0.5 rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-500 shadow-2xs">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Store / Channel Switcher */}
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <Store className="h-3.5 w-3.5 text-zinc-500" />
            <span className="hidden md:inline max-w-[140px] truncate">{selectedStore.name}</span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl z-30">
              <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Channel Filter
              </span>
              {STORES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStore(s);
                    setStoreDropdownOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-black hover:bg-zinc-100 transition-colors text-left"
                >
                  <span className="truncate">{s.name}</span>
                  {selectedStore.id === s.id && <Check className="h-3.5 w-3.5 text-black" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Menu */}
        <button
          onClick={onOpenQuickCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 text-white" />
          <span className="hidden sm:inline text-white font-bold">New</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-xl border border-black/[0.08] bg-white p-2 text-black hover:bg-zinc-50 transition-colors shadow-2xs"
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
            className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white p-1 pr-2.5 hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white font-bold text-xs select-none">
              <span className="text-white font-bold text-xs leading-none">{session.fullName.charAt(0)}</span>
            </div>
            <span className="hidden md:inline text-xs font-bold text-black">
              {session.fullName}
            </span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl z-30">
              <div className="border-b border-black/[0.06] px-3 py-2.5">
                <span className="block text-xs font-bold text-black truncate">{session.fullName}</span>
                <span className="block text-[11px] text-zinc-500 truncate">{session.email}</span>
                <span className="mt-1.5 inline-block rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black capitalize">
                  {session.role.replace('_', ' ')}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href={`/${session.organizationSlug}/settings`}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-black hover:bg-zinc-100 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Account &amp; Workspace</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-600" />
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
