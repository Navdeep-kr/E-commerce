'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Boxes,
  SlidersHorizontal,
  ScanBarcode,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/status-pill';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryDetailDrawer } from '@/components/inventory/inventory-drawer';
import { toast } from '@/components/ui/toast';

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
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      setItems([]);
    }
  }

  async function handleAdjustStock(sku: string, delta: number, reason: string) {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku,
        quantityDelta: delta,
        reason,
        notes: 'Calibrated via Inventory Inspector Drawer',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to adjust stock');
    }

    // Update local state atomically
    setItems((prev) =>
      prev.map((it) => {
        if (it.sku === sku) {
          const newOnHand = Math.max(0, it.onHand + delta);
          return {
            ...it,
            onHand: newOnHand,
            available: Math.max(0, newOnHand - it.committed),
          };
        }
        return it;
      })
    );

    setSelectedItemForAdjust((prev) => {
      if (!prev || prev.sku !== sku) return prev;
      const newOnHand = Math.max(0, prev.onHand + delta);
      return {
        ...prev,
        onHand: newOnHand,
        available: Math.max(0, newOnHand - prev.committed),
      };
    });
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
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItemForAdjust(row);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-black hover:bg-zinc-50 transition-colors shadow-2xs"
        >
          <SlidersHorizontal className="h-3 w-3 text-zinc-500" />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-4 bg-white text-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Inventory &amp; Stock</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-300">
              Append-Only Ledger Active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Multi-Location Inventory</h1>
          <p className="text-xs text-zinc-600">
            Real-time available-to-promise calculations, stockout prevention, and immutable movement ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <ScanBarcode className="h-3.5 w-3.5 text-black" />
            <span>Barcode Scanner</span>
          </button>

          <Link
            href={`/${orgSlug}/inventory/cycle-count`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Launch Cycle Count</span>
          </Link>
        </div>
      </div>

      {/* Main Stock Table */}
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Filter by SKU or variant title..."
        searchKey="sku"
        onRowClick={(row) => setSelectedItemForAdjust(row)}
        emptyState={
          <EmptyState
            icon={Boxes}
            title="No Stock Tracked Yet"
            description="Your inventory ledger currently has zero tracked SKUs. Import your catalog from Shopify or WooCommerce, or add manual items with bin locations."
            primaryAction={{
              label: 'Import Catalog SKUs',
              href: `/${orgSlug}/catalog`,
            }}
            secondaryAction={{
              label: 'Launch Cycle Count',
              href: `/${orgSlug}/inventory/cycle-count`,
            }}
          />
        }
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

      {/* Slide-Over Inventory Detail & Calibration Drawer */}
      <InventoryDetailDrawer
        item={selectedItemForAdjust}
        isOpen={Boolean(selectedItemForAdjust)}
        onClose={() => setSelectedItemForAdjust(null)}
        onAdjustStock={handleAdjustStock}
      />
    </div>
  );
}
