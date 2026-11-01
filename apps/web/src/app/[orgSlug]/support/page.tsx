'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Headphones,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Send,
  Sparkles,
  DollarSign,
  RotateCcw,
  Package,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  User,
  ShoppingBag,
  Paperclip,
  Check,
} from 'lucide-react';
import { SupportService, type SupportTicket } from '@storefront-ops/core';

interface TicketItem extends SupportTicket {
  slaUrgency: 'ok' | 'warning' | 'breached';
  minutesRemaining: number;
}

export default function SupportInboxPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('tkt-401');
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sidecar state
  const [activeOrder, setActiveOrder] = useState({
    orderNumber: 'ORD-10892',
    status: 'shipped',
    carrier: 'USPS',
    trackingNumber: '94001118995648123901',
    totalMinor: 14200,
    items: [
      { sku: 'HOODIE-BLK-M', title: 'Heavyweight Fleece Hoodie (Black / M)', qty: 1 },
      { sku: 'TEE-WHT-L', title: 'Classic Cotton Tee (White / L)', qty: 2 },
    ],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/support/tickets');
        const data = await res.json();
        if (data.tickets) {
          setTickets(data.tickets);
        }
      } catch {
        // Fallback
      }
    };
    fetchTickets();
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleApplyMacro = (macroType: 'tracking' | 'refund' | 'return') => {
    if (!selectedTicket) return;

    let template = '';
    let variables: Record<string, string | number> = {
      customer_name: selectedTicket.customerName,
      order_number: selectedTicket.orderNumber || 'ORD-10892',
    };

    if (macroType === 'tracking') {
      template =
        'Hi {{customer_name}},\n\nYour order {{order_number}} is in transit via {{carrier}} with tracking number {{tracking_number}}.\nYou can track delivery updates here: https://track.example.com/{{tracking_number}}.\n\nPlease let us know if we can assist further!';
      variables.carrier = activeOrder.carrier;
      variables.tracking_number = activeOrder.trackingNumber;
    } else if (macroType === 'refund') {
      template =
        'Hi {{customer_name}},\n\nWe have issued a full refund of {{refund_amount}} for order {{order_number}} to your original payment method. Please allow 2-3 business days for your banking institution to post the credit.';
      variables.refund_amount = `$${(activeOrder.totalMinor / 100).toFixed(2)}`;
    } else {
      template =
        'Hi {{customer_name}},\n\nWe have generated your prepaid return label for order {{order_number}}.\nYou can access your label and packing slip here: https://returns.example.com/rma/{{order_number}}.\n\nOnce dropped off with USPS, your refund or replacement will process automatically.';
    }

    const interpolated = SupportService.interpolateMacro(template, variables);
    setReplyText(interpolated);
    showToast(`Inserted macro: ${macroType.toUpperCase()}`);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    showToast(isInternalNote ? 'Internal note added to ticket.' : 'Reply sent to customer!');
    setReplyText('');
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeChannelFilter === 'all') return true;
    return t.channel === activeChannelFilter;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-zinc-900 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-400 shadow-xl shadow-black/40">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Omnichannel Inbox</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              Live SLA Router Active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Support Workspace</h1>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'email', 'chat', 'sms'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannelFilter(ch)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                activeChannelFilter === ch
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Support Workspace: Tickets (3) | Conversation (5) | Order Action Sidecar (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[75vh]">
        {/* Left Column: Tickets Queue (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
          <div className="p-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase">Inbox Queue</span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 font-mono">
              {filteredTickets.length} open
            </span>
          </div>

          <div className="divide-y divide-zinc-800/70 overflow-y-auto flex-1">
            {filteredTickets.map((tkt) => {
              const isSelected = tkt.id === selectedTicketId;
              return (
                <div
                  key={tkt.id}
                  onClick={() => setSelectedTicketId(tkt.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-l-4 border-indigo-500'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-300">{tkt.ticketNumber}</span>
                    {tkt.slaUrgency === 'warning' ? (
                      <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        {tkt.minutesRemaining}m SLA
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase font-mono">
                        {tkt.priority}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-sm text-zinc-100 truncate">{tkt.customerName}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{tkt.subject}</p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                    <span className="capitalize">{tkt.channel}</span>
                    <span>&bull;</span>
                    <span>{tkt.orderNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Conversation Thread & Reply Box (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{selectedTicket.ticketNumber}</span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 capitalize">
                      {selectedTicket.channel}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-100 mt-1">{selectedTicket.subject}</h2>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-zinc-950/20">
                {/* Customer Initial Message */}
                <div className="rounded-xl bg-zinc-800/60 p-4 space-y-2 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">{selectedTicket.customerName}</span>
                    <span className="text-zinc-500">1 hour ago</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Hello, I noticed my order has been marked as shipped, but I live in an apartment building with a locked security gate. Can you confirm if USPS has the gate code or access details? Thank you!
                  </p>
                </div>
              </div>

              {/* Reply Box with Macros */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
                {/* Macro Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Macros:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('tracking')}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 text-xs"
                  >
                    Tracking Update
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('refund')}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 text-xs"
                  >
                    Issue Refund Note
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('return')}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 text-xs"
                  >
                    Return RMA Label
                  </button>
                </div>

                {/* Mode Toggle (Public Reply vs Internal Note) */}
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`font-semibold pb-1 border-b-2 transition-colors ${
                      !isInternalNote
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Customer Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`font-semibold pb-1 border-b-2 transition-colors ${
                      isInternalNote
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Internal Note (Staff Only)
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Write internal staff note (not visible to customer)...'
                      : 'Type response to customer or insert a macro...'
                  }
                  className={`w-full rounded-lg border p-3 text-xs text-white placeholder-zinc-500 focus:outline-none ${
                    isInternalNote
                      ? 'bg-amber-950/20 border-amber-500/30 focus:border-amber-500'
                      : 'bg-zinc-900 border-zinc-800 focus:border-indigo-500'
                  }`}
                />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500">
                    SLA Target: First reply within 4 hours
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isInternalNote ? 'Save Internal Note' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-zinc-500">No ticket selected</div>
          )}
        </div>

        {/* Right Column: ORDER ACTION SIDECAR (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-5 overflow-y-auto">
          {/* Customer 360 Capsule */}
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                Customer Profile
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Champion RFM
              </span>
            </div>
            <div className="mt-3 text-xs space-y-1">
              <p className="font-bold text-sm text-zinc-100">{selectedTicket.customerName}</p>
              <p className="text-zinc-400">{selectedTicket.customerEmail}</p>
              <div className="pt-2 flex justify-between text-zinc-300">
                <span>Lifetime Spend:</span>
                <span className="font-mono font-bold text-emerald-400">$1,680.00 (14 orders)</span>
              </div>
            </div>
          </div>

          {/* Active Order Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-indigo-400">{activeOrder.orderNumber}</span>
              <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                {activeOrder.status}
              </span>
            </div>

            <div className="text-xs space-y-1 border-y border-zinc-800/80 py-2">
              <p className="text-zinc-400">
                Carrier:{' '}
                <span className="font-semibold text-zinc-200">
                  {activeOrder.carrier} ({activeOrder.trackingNumber.slice(0, 12)}...)
                </span>
              </p>
              <p className="text-zinc-400">
                Order Value:{' '}
                <span className="font-mono font-bold text-zinc-100">
                  ${(activeOrder.totalMinor / 100).toFixed(2)}
                </span>
              </p>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase font-semibold">Items:</span>
              {activeOrder.items.map((it) => (
                <p key={it.sku} className="text-zinc-300 truncate">
                  &bull; {it.qty}x {it.title}
                </p>
              ))}
            </div>
          </div>

          {/* 1-Click Order Actions */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">1-Click Order Actions</span>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(activeOrder.trackingNumber);
                showToast(`Copied tracking number ${activeOrder.trackingNumber} to clipboard!`);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" />
                <span>Copy Tracking Link</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <button
              type="button"
              onClick={() => {
                showToast(`Refund of $${(activeOrder.totalMinor / 100).toFixed(2)} processed to Stripe customer card!`);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Issue 1-Click Full Refund</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">${(activeOrder.totalMinor / 100).toFixed(2)}</span>
            </button>

            <Link
              href={`/${orgSlug}/returns`}
              className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 hover:border-rose-500/40 hover:bg-rose-950/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-400" />
                <span>Initiate Return / Exchange RMA</span>
              </div>
              <span className="text-[10px] text-zinc-500">Warehouse Dock &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
