'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Boxes,
  ScanBarcode,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Save,
} from 'lucide-react';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner-modal';

interface CountRow {
  sku: string;
  title: string;
  bin: string;
  expected: number;
  counted: number;
  scannedAt?: string;
}

const INITIAL_CYCLE_ITEMS: CountRow[] = [
  { sku: 'HOODIE-BLK-M', title: 'Fleece Hoodie (Black / M)', bin: 'A-02-14', expected: 65, counted: 65 },
  { sku: 'HOODIE-BLK-XL', title: 'Fleece Hoodie (Black / XL)', bin: 'A-02-16', expected: 4, counted: 3 }, // Variance -1
  { sku: 'TEE-WHT-S', title: 'Vintage Tee (White / S)', bin: 'B-08-01', expected: 0, counted: 0 },
  { sku: 'CAP-NAVY-OS', title: 'Dad Cap (Navy)', bin: 'C-01-04', expected: 140, counted: 142 }, // Variance +2
];

export default function CycleCountPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [items, setItems] = useState<CountRow[]>(INITIAL_CYCLE_ITEMS);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeSkuForScan, setActiveSkuForScan] = useState<string | undefined>();
  const [completed, setCompleted] = useState(false);

  function incrementCount(sku: string) {
    setItems((prev) =>
      prev.map((it) => (it.sku === sku ? { ...it, counted: it.counted + 1 } : it))
    );
  }

  function decrementCount(sku: string) {
    setItems((prev) =>
      prev.map((it) => (it.sku === sku ? { ...it, counted: Math.max(0, it.counted - 1) } : it))
    );
  }

  function handleScan(code: string) {
    const found = items.find((it) => it.sku.toLowerCase() === code.toLowerCase());
    if (found) {
      incrementCount(found.sku);
    }
  }

  const totalVariance = items.reduce((acc, it) => acc + Math.abs(it.counted - it.expected), 0);

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/inventory`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Zone A Cycle Count</h1>
            <p className="text-xs text-muted-foreground">
              Scan bin items with barcode reader to reconcile physical counts against system inventory.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveSkuForScan(undefined);
            setScannerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ScanBarcode className="h-4 w-4" />
          <span>Launch Scanner</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Items in Zone</span>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Discrepancy Units</span>
          <p className={`mt-1 text-2xl font-bold font-mono ${totalVariance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {totalVariance} units
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Audit Status</span>
          <p className="mt-1 text-sm font-semibold text-primary">In Progress</p>
        </div>
      </div>

      {/* Count Items List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {items.map((row) => {
            const variance = row.counted - row.expected;
            return (
              <div key={row.sku} className="flex items-center justify-between p-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground font-mono">{row.sku}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Bin: {row.bin}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{row.title}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="block text-[10px] text-muted-foreground">Expected</span>
                    <span className="font-mono font-medium">{row.expected}</span>
                  </div>

                  {/* Touch Counter Buttons */}
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1">
                    <button
                      onClick={() => decrementCount(row.sku)}
                      className="h-7 w-7 rounded bg-muted text-foreground font-bold hover:bg-muted/80 text-center"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-foreground">
                      {row.counted}
                    </span>
                    <button
                      onClick={() => incrementCount(row.sku)}
                      className="h-7 w-7 rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Variance Indicator */}
                  <div className="w-16 text-right">
                    {variance === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-bold font-mono">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {variance > 0 ? `+${variance}` : variance}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer submission bar */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-4">
          <span className="text-xs text-muted-foreground">
            Approving will update <code>inventory_levels</code> and log <code>cycle_count</code> adjustment rows.
          </span>
          <button
            onClick={() => {
              setCompleted(true);
              alert('Cycle count approved! Stock levels reconciled with audit movements.');
            }}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>Approve &amp; Reconcile Count</span>
          </button>
        </div>
      </div>

      {/* Barcode scanner */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        expectedCode={activeSkuForScan}
      />
    </div>
  );
}
