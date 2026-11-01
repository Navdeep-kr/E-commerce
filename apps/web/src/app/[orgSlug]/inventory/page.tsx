'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Boxes,
  SlidersHorizontal,
  Barcode,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  History,
  ScanBarcode,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/status-pill';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner-modal';

interface StockItem {
  id: string;
  sku: string;
  title: string;
  locationName: string;
  binLocation: string;
  onHand: number;
  committed: number;
  available: number;
  incoming: number;
  reorderPoint: number;
  daysOfStock: number;
  status: 'ok' | 'low' | 'out' | 'overstock';
}

export default function InventoryPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<StockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('correction');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Generate realistic multi-location stock records
    const sampleStock: StockItem[] = [
      {
        id: 'st-1',
        sku: 'HOODIE-BLK-M',
        title: 'Heavyweight Fleece Hoodie (Black / M)',
        locationName: 'East Coast DC',
        binLocation: 'A-02-14',
        onHand: 65,
        committed: 15,
        available: 50,
        incoming: 100,
        reorderPoint: 25,
        daysOfStock: 28,
        status: 'ok',
      },
      {
        id: 'st-2',
        sku: 'HOODIE-BLK-XL',
        title: 'Heavyweight Fleece Hoodie (Black / XL)',
        locationName: 'East Coast DC',
        binLocation: 'A-02-16',
        onHand: 4,
        committed: 2,
        available: 2,
        incoming: 0,
        reorderPoint: 15,
        daysOfStock: 2,
        status: 'low',
      },
      {
        id: 'st-3',
        sku: 'TEE-WHT-S',
        title: 'Organic Vintage Tee (White / S)',
        locationName: 'West Coast Hub',
        binLocation: 'B-08-01',
        onHand: 0,
        committed: 0,
        available: 0,
        incoming: 50,
        reorderPoint: 20,
        daysOfStock: 0,
        status: 'out',
      },
      {
        id: 'st-4',
        sku: 'CAP-NAVY-OS',
        title: 'Structured Dad Cap (Navy)',
        locationName: 'UK & EU 3PL',
        binLocation: 'C-01-04',
        onHand: 140,
        committed: 10,
        available: 130,
        incoming: 0,
        reorderPoint: 30,
        daysOfStock: 95,
        status: 'overstock',
      },
    ];
    setItems(sampleStock);
  }, []);

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemForAdjust || adjustDelta === 0) return;

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedItemForAdjust.sku,
          quantityDelta: adjustDelta,
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update local state atomically
        setItems((prev) =>
          prev.map((it) => {
            if (it.sku === selectedItemForAdjust.sku) {
              const newOnHand = Math.max(0, it.onHand + adjustDelta);
              return {
                ...it,
                onHand: newOnHand,
                available: Math.max(0, newOnHand - it.committed),
              };
            }
            return it;
          })
        );
        setToastMessage(`✅ ${data.message}`);
        setTimeout(() => setToastMessage(null), 3000);
        setSelectedItemForAdjust(null);
        setAdjustDelta(0);
        setAdjustNotes('');
      }
    } catch {
      alert('Failed to submit stock adjustment');
    }
  }

  const columns: Column<StockItem>[] = [
    {
      key: 'sku',
      header: 'SKU & Title',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-foreground block font-mono">{row.sku}</span>
          <span className="text-[11px] text-muted-foreground">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'locationName',
      header: 'Warehouse & Bin',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">{row.locationName}</span>
          <span className="block text-[10px] font-mono text-muted-foreground">Bin: {row.binLocation}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      sortable: true,
      render: (row) => <StatusPill status={row.status} type="stock" />,
    },
    {
      key: 'available',
      header: 'Available',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-sm">{row.available}</span>
      ),
    },
    {
      key: 'onHand',
      header: 'On Hand',
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.onHand}</span>,
    },
    {
      key: 'committed',
      header: 'Committed',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-amber-500 font-semibold">{row.committed}</span>
      ),
    },
    {
      key: 'incoming',
      header: 'Incoming PO',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-blue-500">{row.incoming > 0 ? `+${row.incoming}` : '0'}</span>
      ),
    },
    {
      key: 'daysOfStock',
      header: 'Stock Runout',
      sortable: true,
      render: (row) => (
        <span
          className={`font-mono text-xs ${
            row.daysOfStock < 7 ? 'text-rose-500 font-bold' : 'text-muted-foreground'
          }`}
        >
          {row.daysOfStock} days
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedItemForAdjust(row);
            setAdjustDelta(0);
          }}
          className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-muted hover:border-primary/50 transition-colors"
        >
          <SlidersHorizontal className="h-3 w-3 text-primary" />
          <span>Adjust</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-500 shadow-lg animate-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Multi-Location Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Real-time available-to-promise calculations, stockout prevention, and immutable movement ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <ScanBarcode className="h-3.5 w-3.5 text-primary" />
            <span>Barcode Scanner</span>
          </button>

          <Link
            href={`/${orgSlug}/inventory/cycle-count`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Cycle Count</span>
          </Link>
        </div>
      </div>

      {/* Main Stock Table */}
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Filter by SKU or variant title..."
        searchKey="sku"
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          const matched = items.find((it) => it.sku.toLowerCase() === code.toLowerCase());
          if (matched) {
            setScannerOpen(false);
            setSelectedItemForAdjust(matched);
          }
        }}
      />

      {/* Quick Adjust Slide-Over Drawer */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Adjust Stock Count</h2>
                <span className="text-xs font-mono text-muted-foreground">{selectedItemForAdjust.sku}</span>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex-1 space-y-4 pt-4">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current On Hand:</span>
                  <span className="font-mono font-bold">{selectedItemForAdjust.onHand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Committed:</span>
                  <span className="font-mono text-amber-500 font-bold">{selectedItemForAdjust.committed}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-1">
                  <span className="text-muted-foreground">Available to Promise:</span>
                  <span className="font-mono text-emerald-500 font-bold">{selectedItemForAdjust.available}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Quantity Delta (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  value={adjustDelta || ''}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. +10 or -3"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[11px] text-muted-foreground">
                  Resulting on hand: <strong>{selectedItemForAdjust.onHand + adjustDelta}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Mandatory Reason Code</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="correction">Count Correction / Discrepancy</option>
                  <option value="damage">Damaged in Warehouse</option>
                  <option value="loss">Lost / Theft</option>
                  <option value="found">Found / Restocked</option>
                  <option value="return">Customer Return Restock</option>
                  <option value="po_receipt">Supplier PO Receipt</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Internal Audit Notes</label>
                <textarea
                  rows={3}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Explain why this adjustment is being made..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="rounded px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustDelta === 0}
                  className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
