'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  DollarSign,
  Plus,
  X,
  Keyboard,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  onOpenShortcuts: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  orgSlug,
  onOpenShortcuts,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Global keydown listeners for shortcuts
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    function handleKeyDown(e: KeyboardEvent) {
      // Toggle palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
        return;
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      // If user is typing in an input field, do not trigger chord shortcuts
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      // Global single-key shortcuts: '?' for help, '/' for search
      if (e.key === '?' && !isOpen) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      // Global chord shortcuts: 'g' then 'o' (orders), 'g' then 'i' (inventory), 'g' then 't' (today)
      const now = Date.now();
      if (now - lastKeyTime > 1000) {
        keyBuffer = '';
      }
      lastKeyTime = now;
      keyBuffer += e.key.toLowerCase();

      if (keyBuffer === 'go') {
        e.preventDefault();
        keyBuffer = '';
        router.push(`/${orgSlug}/orders`);
      } else if (keyBuffer === 'gi') {
        e.preventDefault();
        keyBuffer = '';
        router.push(`/${orgSlug}/inventory`);
      } else if (keyBuffer === 'gt') {
        e.preventDefault();
        keyBuffer = '';
        router.push(`/${orgSlug}/today`);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpenShortcuts, router, orgSlug]);

  if (!isOpen) return null;

  const actions = [
    { label: 'Go to Orders', href: `/${orgSlug}/orders`, icon: ShoppingCart, group: 'Navigation' },
    { label: 'Go to Inventory & Stock', href: `/${orgSlug}/inventory`, icon: Boxes, group: 'Navigation' },
    { label: 'Go to Fulfillment / Pack Station', href: `/${orgSlug}/fulfillment`, icon: Truck, group: 'Navigation' },
    { label: 'Go to Customers', href: `/${orgSlug}/customers`, icon: Users, group: 'Navigation' },
    { label: 'Go to Finance & P&L', href: `/${orgSlug}/finance`, icon: DollarSign, group: 'Navigation' },
    { label: 'Create New Order', href: `/${orgSlug}/orders/new`, icon: Plus, group: 'Quick Actions' },
    { label: 'Show Keyboard Shortcuts Help', action: () => { onClose(); onOpenShortcuts(); }, icon: Keyboard, group: 'Help' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  function executeAction(item: typeof actions[0]) {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-3.5 py-3 gap-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => executeAction(item)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-foreground hover:bg-primary hover:text-primary-foreground group transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] uppercase font-mono">{item.group}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3.5 py-2 text-[10px] text-muted-foreground">
          <span>Navigate with arrows and Enter</span>
          <div className="flex items-center gap-2">
            <span>Esc to close</span>
            <span>•</span>
            <kbd className="rounded border bg-card px-1 font-mono">?</kbd> for shortcut help
          </div>
        </div>
      </div>
    </div>
  );
}
