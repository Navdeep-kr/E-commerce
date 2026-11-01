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

const DEFAULT_TICKETS: TicketItem[] = [
  {
    id: 'tkt-401',
    ticketNumber: 'TICK-1049',
    customerId: 'cust-101',
    customerName: 'Alex Mercer',
    customerEmail: 'alex.mercer@example.com',
    orderNumber: 'ORD-10892',
    subject: 'Where is my order? Need delivery confirmation for apartment gate',
    priority: 'high',
    status: 'open',
    channel: 'email',
    createdAt: new Date().toISOString(),
    firstResponseDueIso: new Date(Date.now() + 150 * 60000).toISOString(),
    slaUrgency: 'ok',
    minutesRemaining: 150,
  },
  {
    id: 'tkt-402',
    ticketNumber: 'TICK-1050',
    customerId: 'cust-102',
    customerName: 'Brianna Hayes',
    customerEmail: 'brianna.hayes@example.com',
    orderNumber: 'ORD-10893',
    subject: 'Wrong size received, need to exchange for a Medium',
    priority: 'medium',
    status: 'open',
    channel: 'chat',
    createdAt: new Date().toISOString(),
    firstResponseDueIso: new Date(Date.now() + 680 * 60000).toISOString(),
    slaUrgency: 'ok',
    minutesRemaining: 680,
  },
  {
    id: 'tkt-403',
    ticketNumber: 'TICK-1045',
    customerId: 'cust-103',
    customerName: 'Carlos Rivera',
    customerEmail: 'carlos.r@example.com',
    orderNumber: 'ORD-10894',
    subject: 'Urgent: Address was entered incorrectly before shipment',
    priority: 'urgent',
    status: 'open',
    channel: 'sms',
    createdAt: new Date().toISOString(),
    firstResponseDueIso: new Date(Date.now() + 10 * 60000).toISOString(),
    slaUrgency: 'warning',
    minutesRemaining: 10,
  },
];

export default function SupportInboxPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [tickets, setTickets] = useState<TicketItem[]>(DEFAULT_TICKETS);
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
        if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
          setTickets(data.tickets);
        }
      } catch {
        // Fallback to initial defaults
      }
    };
    fetchTickets();
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || DEFAULT_TICKETS[0];

  const handleApplyMacro = (macroType: 'tracking' | 'refund' | 'return') => {
    if (!selectedTicket) return;

    let template = '';
    let variables: Record<string, string | number> = {
      customer_name: selectedTicket?.customerName || 'Alex Mercer',
      order_number: selectedTicket?.orderNumber || 'ORD-10892',
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
    <div className="space-y-4 bg-white text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white border-2 border-green-500 px-4 py-3 text-sm text-green-700 shadow-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
          <span className="font-semibold text-black">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Omnichannel Inbox</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-300">
              Live SLA Router Active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Support Workspace</h1>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'email', 'chat', 'sms'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannelFilter(ch)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                activeChannelFilter === ch
                  ? 'bg-black text-white border border-black'
                  : 'bg-white text-black border border-zinc-200 hover:bg-zinc-50'
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
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 bg-white border-b border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider">Inbox Queue</span>
            <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-[11px] text-black font-mono font-bold">
              {filteredTickets.length} open
            </span>
          </div>

          <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
            {filteredTickets.map((tkt) => {
              const isSelected = tkt.id === selectedTicketId;
              return (
                <div
                  key={tkt.id}
                  onClick={() => setSelectedTicketId(tkt.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1.5 border-l-4 ${
                    isSelected
                      ? 'bg-zinc-50 border-black'
                      : 'border-transparent hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-black">{tkt.ticketNumber}</span>
                    {tkt.slaUrgency === 'warning' ? (
                      <span className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-300">
                        <Clock className="h-3 w-3 text-orange-600" />
                        {tkt.minutesRemaining}m SLA
                      </span>
                    ) : tkt.slaUrgency === 'breached' ? (
                      <span className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-red-600 border border-red-300">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        Breached SLA
                      </span>
                    ) : (
                      <span className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[10px] text-black uppercase font-mono font-bold">
                        {tkt.priority}
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm text-black truncate">{tkt.customerName}</p>
                  <p className="text-xs text-zinc-600 line-clamp-2">{tkt.subject}</p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 font-medium">
                    <span className="capitalize">{tkt.channel}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{tkt.orderNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Conversation Thread & Reply Box (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 bg-white border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-black">{selectedTicket.ticketNumber}</span>
                    <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-[10px] text-black font-semibold capitalize">
                      {selectedTicket.channel}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-black mt-1">{selectedTicket.subject}</h2>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-white">
                {/* Customer Initial Message */}
                <div className="rounded-xl bg-white p-4 space-y-2 border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-black">{selectedTicket.customerName}</span>
                    <span className="text-zinc-500 font-medium">1 hour ago</span>
                  </div>
                  <p className="text-xs text-black leading-relaxed">
                    Hello, I noticed my order has been marked as shipped, but I live in an apartment building with a locked security gate. Can you confirm if USPS has the gate code or access details? Thank you!
                  </p>
                </div>
              </div>

              {/* Reply Box with Macros */}
              <div className="p-4 bg-white border-t border-zinc-200 space-y-3">
                {/* Macro Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] text-orange-600 font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-orange-500" />
                    Macros:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('tracking')}
                    className="rounded border border-zinc-200 bg-white hover:border-black text-black px-2 py-1 text-xs font-medium transition-colors"
                  >
                    Tracking Update
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('refund')}
                    className="rounded border border-zinc-200 bg-white hover:border-green-600 text-green-700 px-2 py-1 text-xs font-medium transition-colors"
                  >
                    Issue Refund Note
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacro('return')}
                    className="rounded border border-zinc-200 bg-white hover:border-orange-500 text-orange-600 px-2 py-1 text-xs font-medium transition-colors"
                  >
                    Return RMA Label
                  </button>
                </div>

                {/* Mode Toggle (Public Reply vs Internal Note) */}
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`font-bold pb-1 border-b-2 transition-colors ${
                      !isInternalNote
                        ? 'border-black text-black'
                        : 'border-transparent text-zinc-500 hover:text-black'
                    }`}
                  >
                    Customer Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`font-bold pb-1 border-b-2 transition-colors ${
                      isInternalNote
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-zinc-500 hover:text-orange-600'
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
                  className={`w-full rounded-lg border p-3 text-xs text-black placeholder-zinc-400 focus:outline-none transition-colors ${
                    isInternalNote
                      ? 'bg-white border-2 border-orange-400 focus:border-orange-600'
                      : 'bg-white border border-zinc-300 focus:border-black'
                  }`}
                />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500 font-medium">
                    SLA Target: First reply within 4 hours
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm ${
                      isInternalNote
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-black hover:bg-zinc-800'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isInternalNote ? 'Save Internal Note' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-xs font-medium">No ticket selected</div>
          )}
        </div>

        {/* Right Column: ORDER ACTION SIDECAR (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-200 bg-white shadow-sm p-5 space-y-5 overflow-y-auto">
          {/* Customer 360 Capsule */}
          <div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-black" />
                Customer Profile
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-300">
                Champion RFM
              </span>
            </div>
            <div className="mt-3 text-xs space-y-1">
              <p className="font-bold text-sm text-black">{selectedTicket?.customerName || 'Alex Mercer'}</p>
              <p className="text-zinc-600 font-medium">{selectedTicket?.customerEmail || 'alex.mercer@example.com'}</p>
              <div className="pt-2 flex justify-between text-zinc-800 font-medium">
                <span>Lifetime Spend:</span>
                <span className="font-mono font-bold text-green-600">$1,680.00 (14 orders)</span>
              </div>
            </div>
          </div>

          {/* Active Order Card */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-black">{activeOrder.orderNumber}</span>
              <span className="rounded bg-white border border-zinc-200 text-black px-2 py-0.5 text-[10px] font-bold uppercase">
                {activeOrder.status}
              </span>
            </div>

            <div className="text-xs space-y-1 border-y border-zinc-100 py-2">
              <p className="text-zinc-600 font-medium">
                Carrier:{' '}
                <span className="font-semibold text-black">
                  {activeOrder.carrier} ({activeOrder.trackingNumber.slice(0, 12)}...)
                </span>
              </p>
              <p className="text-zinc-600 font-medium">
                Order Value:{' '}
                <span className="font-mono font-bold text-black">
                  ${(activeOrder.totalMinor / 100).toFixed(2)}
                </span>
              </p>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase font-bold">Items:</span>
              {activeOrder.items.map((it) => (
                <p key={it.sku} className="text-black truncate font-medium">
                  &bull; {it.qty}x {it.title}
                </p>
              ))}
            </div>
          </div>

          {/* 1-Click Order Actions */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-black">1-Click Order Actions</span>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(activeOrder.trackingNumber);
                showToast(`Copied tracking number ${activeOrder.trackingNumber} to clipboard!`);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-black hover:border-black hover:bg-zinc-50 transition-colors shadow-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-black" />
                <span>Copy Tracking Link</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <button
              type="button"
              onClick={() => {
                showToast(`Refund of $${(activeOrder.totalMinor / 100).toFixed(2)} processed to Stripe customer card!`);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-green-300 bg-white p-2.5 text-xs text-green-700 hover:border-green-600 hover:bg-green-50/50 transition-colors shadow-sm font-bold"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Issue 1-Click Full Refund</span>
              </div>
              <span className="font-mono text-green-700 font-bold">${(activeOrder.totalMinor / 100).toFixed(2)}</span>
            </button>

            <Link
              href={`/${orgSlug}/returns`}
              className="w-full flex items-center justify-between rounded-lg border border-red-300 bg-white p-2.5 text-xs text-red-700 hover:border-red-600 hover:bg-red-50/50 transition-colors shadow-sm font-bold"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-red-600" />
                <span>Initiate Return / Exchange RMA</span>
              </div>
              <span className="text-[10px] text-red-600 font-bold">Warehouse Dock &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
