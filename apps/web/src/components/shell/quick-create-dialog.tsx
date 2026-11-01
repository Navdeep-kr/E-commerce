'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ShoppingCart, Package, Headphones, Kanban } from 'lucide-react';

interface QuickCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
}

export function QuickCreateDialog({ isOpen, onClose, orgSlug }: QuickCreateDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const items = [
    {
      title: 'Manual Order',
      description: 'Create phone, wholesale or draft order with stock reservation',
      icon: ShoppingCart,
      href: `/${orgSlug}/orders?action=new`,
    },
    {
      title: 'Product / Variant',
      description: 'Add new SKU, variant options, pricing, and initial stock',
      icon: Package,
      href: `/${orgSlug}/catalog?action=new`,
    },
    {
      title: 'Support Ticket',
      description: 'Log inbound customer ticket from phone, chat or email',
      icon: Headphones,
      href: `/${orgSlug}/support?action=new`,
    },
    {
      title: 'Team Task',
      description: 'Assign operational task with due dates and entity links',
      icon: Kanban,
      href: `/${orgSlug}/tasks?action=new`,
    },
  ];

  function handleSelect(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">Quick Create</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {items.map((it, idx) => {
            const IconC = it.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(it.href)}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left hover:border-primary/50 hover:bg-muted/40 transition-all group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <IconC className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{it.title}</div>
                  <div className="text-[11px] text-muted-foreground">{it.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
