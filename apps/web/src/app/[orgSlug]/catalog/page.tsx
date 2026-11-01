'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/status-pill';
import { MoneyMath } from '@storefront-ops/core';

interface ProductItem {
  id: string;
  title: string;
  sku: string;
  vendor: string;
  productType: string;
  status: string;
  priceMinor: number;
  costMinor: number;
  onHand: number;
  committed: number;
  available: number;
}

export default function CatalogPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.items || []);
    } catch {
      // Fallback
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setImportStatus('Validating CSV rows...');
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvText, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportStatus(`❌ Import Error: ${data.errors?.[0]?.message || data.error}`);
        return;
      }
      setImportStatus(`✅ Successfully imported ${data.importedCount} products!`);
      setTimeout(() => {
        setImportModalOpen(false);
        setImportStatus(null);
        fetchProducts();
      }, 1500);
    } catch {
      setImportStatus('❌ Network error processing import');
    }
  }

  const columns: Column<ProductItem>[] = [
    {
      key: 'title',
      header: 'Product Title',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground font-bold text-[10px]">
            {row.title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-foreground block hover:text-primary transition-colors">
              {row.title}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">{row.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusPill status={row.status === 'active' ? 'ok' : 'low'} type="stock" />,
    },
    {
      key: 'vendor',
      header: 'Vendor',
      sortable: true,
    },
    {
      key: 'priceMinor',
      header: 'Price',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-medium">
          {MoneyMath.format({ amount: row.priceMinor, currency: 'USD' })}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Gross Margin',
      sortable: true,
      render: (row) => {
        const bp = MoneyMath.calculateMarginBasisPoints(
          { amount: row.priceMinor, currency: 'USD' },
          { amount: row.costMinor, currency: 'USD' }
        );
        const marginPct = (bp / 100).toFixed(1);
        const isNegative = bp < 0;
        return (
          <span className={`font-mono text-xs font-semibold ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
            {marginPct}%
          </span>
        );
      },
    },
    {
      key: 'available',
      header: 'Available Stock',
      sortable: true,
      render: (row) => (
        <div className="font-mono">
          <span className="font-semibold text-foreground">{row.available}</span>
          <span className="text-[10px] text-muted-foreground ml-1">
            ({row.onHand} on hand, {row.committed} com.)
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Product Catalog</h1>
          <p className="text-xs text-muted-foreground">
            Manage SKUs, variants, prices, inventory availability, and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              const sample = `sku,title,price,cost,stock,vendor\nTSHIRT-SUMMER-01,Summer Graphic Tee,28.00,8.50,150,Acme Apparel`;
              setCsvText(sample);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Filter products by title or SKU..."
        searchKey="title"
        bulkActions={[
          {
            label: 'Bulk Archive',
            action: (rows) => alert(`Archived ${rows.length} products`),
            destructive: true,
          },
        ]}
      />

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span>Import Products via CSV</span>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste CSV with columns: <code>sku, title, price, cost, stock, vendor</code>.
              Dry-run will validate row syntax, negative prices, and catch duplicate SKUs.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="sku,title,price,cost,stock,vendor&#10;SHIRT-01,Classic Shirt,29.99,10.00,50,Acme"
                required
                className="w-full font-mono text-xs rounded-md border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {importStatus && (
                <div className="rounded-md border border-border bg-muted/50 p-2.5 text-xs">
                  {importStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="rounded px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Process Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
