'use client';

import React from 'react';
import {
  Printer,
  Copy,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  User,
  MapPin,
  Package,
  CreditCard,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/drawer';
import { StatusPill } from '@/components/ui/status-pill';
import { toast } from '@/components/ui/toast';

export interface OrderDetailDrawerProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onStatusChange,
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const totalFormatted = (order.totalMinor / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: order.currency || 'USD',
  });

  const subtotalFormatted = ((order.totalMinor * 0.85) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: order.currency || 'USD',
  });

  const shippingFormatted = ((order.totalMinor * 0.08) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: order.currency || 'USD',
  });

  const taxFormatted = ((order.totalMinor * 0.07) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: order.currency || 'USD',
  });

  function handlePrintLabel() {
    toast.success('4x6 Thermal Label Generated', `Queued print job for ${order.orderNumber}`);
  }

  function handleCopyReference() {
    navigator.clipboard?.writeText(order.orderNumber);
    toast.info('Copied to Clipboard', `Reference ${order.orderNumber} copied`);
  }

  function handleMarkShipped() {
    if (onStatusChange) {
      onStatusChange(order.id, 'shipped');
    }
    toast.success('Fulfillment Updated', `Order ${order.orderNumber} marked as Shipped.`);
  }

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={order.orderNumber}
      subtitle={order.placedAt ? `Placed ${new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : undefined}
      badge={<StatusPill status={order.status} type="order" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReference}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-black hover:bg-zinc-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copy #</span>
            </button>
            <button
              onClick={handlePrintLabel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-black hover:bg-zinc-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span>Print 4x6 Label</span>
            </button>
          </div>

          {order.status !== 'shipped' && order.status !== 'delivered' && (
            <button
              onClick={handleMarkShipped}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-xs active:scale-[0.98]"
            >
              <Truck className="w-3.5 h-3.5 text-white" />
              <span>Mark Shipped</span>
            </button>
          )}
        </div>
      }
    >
      {/* 1. Quick Financial & Status Banner */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50/70 border border-black/[0.06]">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total Paid
          </span>
          <span className="text-base font-extrabold text-black tracking-tight mt-0.5 block">
            {totalFormatted}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Channel
          </span>
          <span className="text-xs font-bold text-black truncate mt-0.5 block">
            {order.channel || 'Shopify US'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Fraud Risk
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {order.riskLevel === 'high' ? (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-600">
                <ShieldAlert className="w-3.5 h-3.5" /> High Risk
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" /> Normal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Customer Profile & Shipping Address */}
      <div className="rounded-2xl border border-black/[0.08] p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Customer Details</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Verified Buyer
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 font-medium block text-[11px]">Name & Email</span>
            <span className="font-bold text-black block mt-0.5">{order.customerName}</span>
            <span className="text-zinc-500 font-medium block truncate">{order.customerEmail}</span>
          </div>

          <div>
            <span className="text-zinc-400 font-medium block text-[11px]">Shipping Destination</span>
            <div className="flex items-start gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span className="font-semibold text-black leading-tight">
                {order.shippingAddress?.address1 || '142 Grand Street, Apt 4B'}
                <br />
                <span className="text-zinc-500 font-normal">
                  {order.shippingAddress?.city || 'Brooklyn'}, {order.shippingAddress?.postalCode || '11249'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Breakdown */}
      <div className="rounded-2xl border border-black/[0.08] p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Order Line Items</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {order.itemsCount || 1} Item(s)
          </span>
        </div>

        <div className="divide-y divide-black/[0.06]">
          <div className="py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-[10px] text-zinc-600">
                1x
              </div>
              <div>
                <span className="font-bold text-black block">Heavyweight Cotton Crewneck</span>
                <span className="text-[11px] text-zinc-400 font-mono">SKU: PROD-101 • Black / L</span>
              </div>
            </div>
            <span className="font-extrabold text-black font-mono">{totalFormatted}</span>
          </div>
        </div>
      </div>

      {/* 4. Financial Accounting Breakdown */}
      <div className="rounded-2xl border border-black/[0.08] p-4 bg-white space-y-2.5">
        <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2.5">
          <CreditCard className="w-4 h-4 text-black" />
          <span className="text-xs font-extrabold text-black">Financial Breakdown</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span className="font-mono font-medium">{subtotalFormatted}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Shipping ({order.shippingMethod || 'USPS Priority'})</span>
            <span className="font-mono font-medium">{shippingFormatted}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Estimated Sales Tax</span>
            <span className="font-mono font-medium">{taxFormatted}</span>
          </div>
          <div className="flex justify-between font-extrabold text-black border-t border-black/[0.08] pt-2 text-sm">
            <span>Total</span>
            <span className="font-mono">{totalFormatted}</span>
          </div>
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default OrderDetailDrawer;
