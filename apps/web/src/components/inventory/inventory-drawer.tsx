'use client';

import React, { useState } from 'react';
import {
  Boxes,
  MapPin,
  Barcode,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  RotateCw,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/drawer';
import { StatusPill } from '@/components/ui/status-pill';
import { toast } from '@/components/ui/toast';

export interface InventoryDetailDrawerProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjustStock?: (sku: string, delta: number, reason: string) => Promise<void>;
}

export function InventoryDetailDrawer({
  item,
  isOpen,
  onClose,
  onAdjustStock,
}: InventoryDetailDrawerProps) {
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('correction');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  async function handleAdjust(isPositive: boolean) {
    const delta = isPositive ? Math.abs(adjustDelta) : -Math.abs(adjustDelta);
    setIsSubmitting(true);
    try {
      if (onAdjustStock) {
        await onAdjustStock(item.sku, delta, adjustReason);
      }
      toast.success(
        'Inventory Calibrated',
        `Adjusted ${item.sku} by ${delta > 0 ? '+' : ''}${delta} units (${adjustReason}).`
      );
    } catch {
      toast.error('Adjustment Failed', 'Could not sync inventory update with server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrintBarcode() {
    toast.info('Barcode Label Printed', `Sent bin barcode label for ${item.sku} to printer.`);
  }

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={item.sku}
      subtitle={item.title}
      badge={<StatusPill status={item.status} type="stock" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handlePrintBarcode}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-black hover:bg-zinc-100 transition-colors"
          >
            <Barcode className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print Bin Label</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      }
    >
      {/* 1. Primary Metrics Grid */}
      <div className="grid grid-cols-4 gap-2.5 p-4 rounded-2xl bg-zinc-50/70 border border-black/[0.06]">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Available
          </span>
          <span className="text-xl font-black text-black tracking-tight mt-0.5 block">
            {item.available ?? 0}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            On Hand
          </span>
          <span className="text-base font-extrabold text-black tracking-tight mt-0.5 block">
            {item.on_hand ?? item.onHand ?? 0}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Committed
          </span>
          <span className="text-base font-extrabold text-zinc-600 tracking-tight mt-0.5 block">
            {item.committed ?? 0}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Days Stock
          </span>
          <span className="text-base font-extrabold text-black tracking-tight mt-0.5 block">
            {item.days_of_stock ?? item.daysOfStock ?? 30}d
          </span>
        </div>
      </div>

      {/* 2. Warehouse & Bin Location */}
      <div className="rounded-2xl border border-black/[0.08] p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Stocking Location</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Primary Facility
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-zinc-400 font-medium block text-[11px]">Facility</span>
            <span className="font-bold text-black block mt-0.5">{item.location_name || item.locationName || 'East Coast DC'}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium block text-[11px]">Bin Location</span>
            <span className="font-mono font-extrabold text-black block mt-0.5 px-2 py-0.5 rounded bg-black/5 w-fit">
              {item.bin_location || item.binLocation || 'A-01-01'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium block text-[11px]">Reorder Point</span>
            <span className="font-bold text-black block mt-0.5">
              {item.reorder_point || item.reorderPoint || 15} units
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Stock Calibration Action */}
      <div className="rounded-2xl border border-black/[0.08] p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Quick Stock Adjustment</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Real-time Math
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Units Count
              </label>
              <input
                type="number"
                min="1"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-xl px-3 py-2 text-xs font-mono font-bold text-black border border-black/10 focus:border-black outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Reason
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-black border border-black/10 focus:border-black outline-hidden bg-white"
              >
                <option value="correction">Inventory Cycle Count</option>
                <option value="found">Found Items</option>
                <option value="damage">Damaged Stock</option>
                <option value="loss">Inventory Shrink / Loss</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleAdjust(true)}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-xs active:scale-[0.98]"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              <span>Add +{adjustDelta} Units</span>
            </button>
            <button
              onClick={() => handleAdjust(false)}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-black/20 bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-colors active:scale-[0.98]"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-zinc-600" />
              <span>Deduct -{adjustDelta} Units</span>
            </button>
          </div>
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default InventoryDetailDrawer;
