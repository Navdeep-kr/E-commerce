'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { MoneyMath, OrderEngine } from '@storefront-ops/core';

interface FormLine {
  sku: string;
  variantTitle: string;
  quantity: number;
  unitPriceMinor: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  // Customer State
  const [customerName, setCustomerName] = useState('Sarah Jenkins');
  const [customerEmail, setCustomerEmail] = useState('sarah.j@example.com');
  const [address1, setAddress1] = useState('100 Broadway');
  const [city, setCity] = useState('New York');
  const [postalCode, setPostalCode] = useState('10001');
  const [country, setCountry] = useState('US');

  // Order Lines
  const [lines, setLines] = useState<FormLine[]>([
    { sku: 'HOODIE-BLK-M', variantTitle: 'Fleece Hoodie (Black / M)', quantity: 1, unitPriceMinor: 8500 },
    { sku: 'TEE-WHT-L', variantTitle: 'Vintage Washed Tee (White / L)', quantity: 2, unitPriceMinor: 3500 },
  ]);

  // Pricing adjustments
  const [discountMinor, setDiscountMinor] = useState(1000); // $10.00 discount
  const [shippingMinor, setShippingMinor] = useState(750); // $7.50 shipping
  const [taxBasisPoints, setTaxBasisPoints] = useState(825); // 8.25% NY tax

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live totals
  const totals = OrderEngine.calculateTotals(lines, discountMinor, shippingMinor, taxBasisPoints);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { sku: `SKU-ACC-${prev.length + 1}`, variantTitle: 'Accessory Item', quantity: 1, unitPriceMinor: 2500 },
    ]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof FormLine, value: unknown) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          customerName,
          customerEmail,
          channel: 'Phone / Manual Sales Order',
          lines,
          discountMinor,
          shippingMinor,
          taxBasisPoints,
          shippingAddress: { address1, city, postalCode, country },
          billingAddress: { address1, city, postalCode, country },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      router.push(`/${orgSlug}/orders`);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/orders`}
          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create Manual Order</h1>
          <p className="text-xs text-muted-foreground">
            Create a phone, wholesale, or VIP order with instantaneous inventory reservation and automated fraud scoring.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Customer Information &amp; Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-foreground">Delivery Address</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Line Items ({lines.length})
              </h2>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="divide-y divide-border text-xs">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={line.variantTitle}
                      onChange={(e) => updateLine(idx, 'variantTitle', e.target.value)}
                      placeholder="Product variant title"
                      className="w-full rounded border border-input bg-background px-2.5 py-1 text-foreground font-medium"
                    />
                    <input
                      type="text"
                      value={line.sku}
                      onChange={(e) => updateLine(idx, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="w-32 rounded border border-input bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                    />
                  </div>

                  <div className="w-16">
                    <label className="block text-[10px] text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded border border-input bg-background px-2 py-1 font-mono text-center"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-muted-foreground">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={(line.unitPriceMinor / 100).toFixed(2)}
                      onChange={(e) => updateLine(idx, 'unitPriceMinor', Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="w-full rounded border border-input bg-background px-2 py-1 font-mono text-right"
                    />
                  </div>

                  <div className="w-20 text-right pt-3 font-mono font-semibold">
                    {MoneyMath.format({ amount: line.quantity * line.unitPriceMinor, currency: 'USD' })}
                  </div>

                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive mt-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Submit */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Payment Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{MoneyMath.format({ amount: totals.subtotalMinor, currency: 'USD' })}</span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Discount ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={(discountMinor / 100).toFixed(2)}
                  onChange={(e) => setDiscountMinor(Math.round(parseFloat(e.target.value || '0') * 100))}
                  className="w-20 text-right font-mono rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground"
                />
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={(shippingMinor / 100).toFixed(2)}
                  onChange={(e) => setShippingMinor(Math.round(parseFloat(e.target.value || '0') * 100))}
                  className="w-20 text-right font-mono rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground"
                />
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Tax (8.25%)</span>
                <span className="font-mono text-foreground">{MoneyMath.format({ amount: totals.taxMinor, currency: 'USD' })}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between items-baseline font-bold text-sm text-foreground">
                <span>Total Due</span>
                <span className="text-lg font-mono text-primary">{MoneyMath.format({ amount: totals.totalMinor, currency: 'USD' })}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              <span>Place Order &amp; Reserve Stock</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
