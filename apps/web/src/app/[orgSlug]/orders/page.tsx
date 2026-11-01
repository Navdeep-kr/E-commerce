'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Filter,
  Download,
  Printer,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/status-pill';
import { MoneyMath } from '@storefront-ops/core';

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  channel: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalMinor: number;
  itemsCount: number;
  riskLevel: string;
  shippingMethod: string;
  placedAt: string;
}

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unfulfilled' | 'on_hold' | 'shipped'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  async function fetchOrders() {
    try {
      const statusParam = activeTab === 'all' ? '' : `status=${activeTab === 'unfulfilled' ? 'ready_to_pack' : activeTab}`;
      const res = await fetch(`/api/orders?${statusParam}`);
      const data = await res.json();
      setOrders(data.items || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<OrderRow>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (row) => (
        <Link
          href={`/${orgSlug}/orders/${row.id}`}
          className="font-mono font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <span>{row.orderNumber}</span>
          <Eye className="h-3 w-3 opacity-50" />
        </Link>
      ),
    },
    {
      key: 'placedAt',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground text-[11px] font-mono">
          {new Date(row.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-foreground block">{row.customerName}</span>
          <span className="text-[10px] text-muted-foreground">{row.customerEmail}</span>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      sortable: true,
      render: (row) => <StatusPill status={row.status} type="order" />,
    },
    {
      key: 'riskLevel',
      header: 'Risk',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            row.riskLevel === 'high'
              ? 'bg-rose-500/10 text-rose-500'
              : row.riskLevel === 'medium'
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {row.riskLevel === 'high' && <AlertTriangle className="h-2.5 w-2.5" />}
          {row.riskLevel}
        </span>
      ),
    },
    {
      key: 'itemsCount',
      header: 'Items',
      sortable: true,
      render: (row) => <span className="font-mono font-medium">{row.itemsCount}</span>,
    },
    {
      key: 'totalMinor',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-foreground">
          {MoneyMath.format({ amount: row.totalMinor, currency: 'USD' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Orders Management</h1>
          <p className="text-xs text-muted-foreground">
            Move every order from placed to delivered with live tracking, stock reservation, and zero dropped steps.
          </p>
        </div>

        <Link
          href={`/${orgSlug}/orders/new`}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Order</span>
        </Link>
      </div>

      {/* Saved Views Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setActiveTab('unfulfilled')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'unfulfilled'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ready to Pack (12)
        </button>
        <button
          onClick={() => setActiveTab('on_hold')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'on_hold'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Fraud Holds (4)
        </button>
        <button
          onClick={() => setActiveTab('shipped')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'shipped'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Shipped &amp; Delivered
        </button>
      </div>

      {/* Orders Data Table */}
      <DataTable
        data={orders}
        columns={columns}
        searchPlaceholder="Search by order #, customer, or email..."
        searchKey="orderNumber"
        bulkActions={[
          {
            label: 'Print Packing Slips',
            action: (rows) => alert(`Printing packing slips for ${rows.length} orders`),
          },
          {
            label: 'Mark Packed',
            action: (rows) => alert(`Marked ${rows.length} orders packed`),
          },
          {
            label: 'Cancel Orders',
            action: (rows) => alert(`Cancelled ${rows.length} orders and released stock`),
            destructive: true,
          },
        ]}
      />
    </div>
  );
}
