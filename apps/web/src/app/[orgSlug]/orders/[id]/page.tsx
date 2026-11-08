'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Box,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Clock,
  Printer,
  ShieldAlert,
  CreditCard,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { MoneyMath, OrderStateMachine, type OrderStatus } from '@storefront-ops/core';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';
  const orderId = (params?.id as string) || 'ord_1';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [transitionStatus, setTransitionStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setOrder(data.order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusTransition(toStatus: OrderStatus) {
    if (!order) return;
    setTransitionStatus(`Transitioning to ${toStatus}...`);

    try {
      const res = await fetch(`/api/orders/${orderId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStatus: order.status,
          toStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Transition error: ${data.error}`);
        setTransitionStatus(null);
        return;
      }

      setOrder((prev: any) => ({
        ...prev,
        status: toStatus,
        timeline: [
          { id: `ev-${Date.now()}`, event: `Status updated to ${toStatus}`, time: 'Just now', user: 'Admin' },
          ...prev.timeline,
        ],
      }));
      setTransitionStatus(null);
    } catch {
      alert('Network error attempting transition');
      setTransitionStatus(null);
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !order) return;

    setOrder((prev: any) => ({
      ...prev,
      internalNotes: [
        { id: `note-${Date.now()}`, author: 'Alex Mercer', text: newComment, time: 'Just now' },
        ...prev.internalNotes,
      ],
    }));
    setNewComment('');
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Order not found.</div>;
  }

  const allowedNextStatuses = OrderStateMachine.getPermittedNextStatuses(order.status as OrderStatus);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/orders`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">{order.orderNumber}</h1>
              <StatusPill status={order.status} type="order" />
            </div>
            <p className="text-xs text-muted-foreground">
              Placed on {new Date(order.placedAt).toLocaleString()} via {order.channel}
            </p>
          </div>
        </div>

        {/* Action transition buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {allowedNextStatuses.map((nextSt) => (
            <button
              key={nextSt}
              onClick={() => handleStatusTransition(nextSt)}
              disabled={Boolean(transitionStatus)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 capitalize"
            >
              <span>Move to {nextSt.replace(/_/g, ' ')}</span>
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Order Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items, Addresses, Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Order Items ({order.lines.length})
            </h2>

            <div className="divide-y divide-border text-xs">
              {order.lines.map((line: any) => (
                <div key={line.id} className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{line.title}</span>
                    <span className="text-muted-foreground block">{line.variantTitle}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">SKU: {line.sku}</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-muted-foreground">
                      {line.quantity} × {MoneyMath.format({ amount: line.unitPriceMinor, currency: 'USD' })}
                    </span>
                    <span className="block font-bold text-foreground text-sm">
                      {MoneyMath.format({ amount: line.totalPriceMinor, currency: 'USD' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial summary breakdown */}
            <div className="border-t border-border pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{MoneyMath.format({ amount: order.subtotalMinor, currency: 'USD' })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="font-mono text-emerald-500">-{MoneyMath.format({ amount: order.discountMinor, currency: 'USD' })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-mono text-foreground">{MoneyMath.format({ amount: order.shippingMinor, currency: 'USD' })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-mono text-foreground">{MoneyMath.format({ amount: order.taxMinor, currency: 'USD' })}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                <span>Total Paid</span>
                <span className="text-primary font-mono">{MoneyMath.format({ amount: order.totalMinor, currency: 'USD' })}</span>
              </div>
            </div>
          </div>

          {/* Payment & Fraud Panel */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center justify-between">
              <span>Payment &amp; Risk Assessment</span>
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Payment Gateway</span>
                <span className="font-medium text-foreground">Stripe (Card ending in 4242)</span>
                <span className="text-emerald-500 font-semibold block text-[11px] mt-0.5">Authorized &amp; Captured</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Risk Score</span>
                <span className="font-mono font-bold text-emerald-500">Low Risk (Score: 12/100)</span>
                <span className="text-muted-foreground block text-[11px] mt-0.5">Address &amp; CVC verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Card, Timeline & Internal Notes */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm text-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center justify-between">
              <span>Customer Details</span>
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </h2>

            <div>
              <span className="font-bold text-foreground block">{order.customer.name}</span>
              <span className="text-muted-foreground block">{order.customer.email}</span>
              <span className="text-muted-foreground block">{order.customer.phone}</span>
            </div>

            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Delivery Address</span>
              <p className="text-foreground mt-0.5">
                {order.shippingAddress.address1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm text-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Activity Timeline</span>
            </h2>

            <div className="space-y-3">
              {order.timeline.map((ev: any) => (
                <div key={ev.id} className="relative pl-4 border-l-2 border-border text-xs space-y-0.5">
                  <div className="font-medium text-foreground">{ev.event}</div>
                  <div className="text-[10px] text-muted-foreground">{ev.time} • {ev.user}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes & @mentions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm text-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Internal Notes</span>
            </h2>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add internal note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="space-y-2.5 pt-2">
              {order.internalNotes.map((note: any) => (
                <div key={note.id} className="rounded-lg bg-muted/40 p-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{note.author}</span>
                    <span>{note.time}</span>
                  </div>
                  <p className="text-xs text-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
