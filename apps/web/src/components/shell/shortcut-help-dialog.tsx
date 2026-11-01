'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutHelpDialog({ isOpen, onClose }: ShortcutHelpDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd / Ctrl + K', description: 'Open global search and command palette' },
    { key: '/', description: 'Focus search bar in lists' },
    { key: '?', description: 'Open this keyboard shortcuts help modal' },
    { key: 'g then o', description: 'Quick jump to Orders' },
    { key: 'g then i', description: 'Quick jump to Inventory' },
    { key: 'g then t', description: 'Quick jump to Today dashboard' },
    { key: 'n', description: 'Quick-create menu (Order, Product, Ticket)' },
    { key: 'Esc', description: 'Close modals, drawers, or reset selection' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Keyboard className="h-4 w-4 text-primary" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{sc.description}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
