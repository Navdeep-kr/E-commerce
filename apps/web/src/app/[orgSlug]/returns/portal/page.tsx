'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  Printer,
  ArrowRight,
  ShieldCheck,
  Truck,
  Download,
} from 'lucide-react';
import { ReturnsService } from '@storefront-ops/core';

interface OrderLookupResult {
  orderNumber: string;
  orderDate: string;
  deliveryDateIso: string;
  customerName: string;
  items: {
    orderItemId: string;
    sku: string;
    title: string;
    priceMinor: number;
    isFinalSale: boolean;
  }[];
}

export default function CustomerReturnPortal() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderNumberInput, setOrderNumberInput] = useState('ORD-10892');
  const [zipInput, setZipInput] = useState('11249');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Selected Order
  const [foundOrder, setFoundOrder] = useState<OrderLookupResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed Return
  const [completedRma, setCompletedRma] = useState<{
    rmaNumber: string;
    refundAmountMinor: number;
    labelUrl: string;
  } | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    if (orderNumberInput.trim().toUpperCase() !== 'ORD-10892' && !orderNumberInput.toUpperCase().startsWith('ORD-')) {
      setLookupError('Order not found. Please verify your order number and zip code.');
      return;
    }

    const deliveryDateIso = new Date(Date.now() - 6 * 86400000).toISOString(); // 6 days ago
    const eligibility = ReturnsService.validateReturnEligibility(deliveryDateIso, false);

    if (!eligibility.eligible) {
      setLookupError(eligibility.reason || 'This order is past the 30-day return window.');
      return;
    }

    const orderData: OrderLookupResult = {
      orderNumber: orderNumberInput.trim().toUpperCase(),
      orderDate: 'October 26, 2026',
      deliveryDateIso,
      customerName: 'Alex Mercer',
      items: [
        {
          orderItemId: 'item-101',
          sku: 'HOODIE-BLK-M',
          title: 'Heavyweight Fleece Hoodie (Black / M)',
          priceMinor: 8500,
          isFinalSale: false,
        },
        {
          orderItemId: 'item-102',
          sku: 'TEE-WHT-L',
          title: 'Classic Cotton Tee (White / L)',
          priceMinor: 2800,
          isFinalSale: false,
        },
      ],
    };

    setFoundOrder(orderData);
    setSelectedItems({
      'item-101': { selected: true, reason: 'wrong_size' },
      'item-102': { selected: false, reason: 'changed_mind' },
    });
    setStep(2);
  };

  const handleCreateReturn = async () => {
    if (!foundOrder) return;
    setIsSubmitting(true);

    try {
      const itemsToReturn = foundOrder.items
        .filter((it) => selectedItems[it.orderItemId]?.selected)
        .map((it) => ({
          orderItemId: it.orderItemId,
          sku: it.sku,
          quantity: 1,
          unitPriceMinor: it.priceMinor,
          reason: selectedItems[it.orderItemId]?.reason as any || 'wrong_size',
          isFinalSale: it.isFinalSale,
        }));

      if (itemsToReturn.length === 0) {
        alert('Please select at least 1 item to return.');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: foundOrder.orderNumber,
          deliveryDateIso: foundOrder.deliveryDateIso,
          items: itemsToReturn,
          deductShipping: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedRma({
          rmaNumber: data.rmaNumber,
          refundAmountMinor: data.refundSummary.netRefundMinor,
          labelUrl: data.prepaidReturnLabelUrl,
        });
        setStep(3);
      } else {
        alert(data.error || 'Failed to submit return request.');
      }
    } catch {
      alert('Network error submitting return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Storefront Ops Returns Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Returns & Exchanges</h1>
          <p className="text-sm text-zinc-400">
            Fast, hassle-free returns within 30 days of delivery with prepaid shipping labels.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-rose-400' : 'text-zinc-600'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40">
              1
            </span>
            <span>Lookup</span>
          </div>
          <div className="h-0.5 w-8 bg-zinc-800" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-rose-400' : 'text-zinc-600'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40">
              2
            </span>
            <span>Items & Reason</span>
          </div>
          <div className="h-0.5 w-8 bg-zinc-800" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-rose-400' : 'text-zinc-600'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40">
              3
            </span>
            <span>Label & Instructions</span>
          </div>
        </div>

        {/* Step 1: Order Lookup */}
        {step === 1 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-100">Find Your Order</h2>
              <p className="text-xs text-zinc-400 mt-1">Enter your order number and shipping zip code.</p>
            </div>

            {lookupError && (
              <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(e) => setOrderNumberInput(e.target.value)}
                  placeholder="e.g. ORD-10892"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Delivery Zip / Postal Code
                </label>
                <input
                  type="text"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  placeholder="e.g. 11249"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
              >
                <span>Find Order</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && foundOrder && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-rose-400">{foundOrder.orderNumber}</span>
                <h2 className="text-lg font-bold text-zinc-100">Select Items to Return</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Eligible &bull; Delivered 6 days ago
              </span>
            </div>

            <div className="space-y-4">
              {foundOrder.items.map((item) => {
                const isSelected = !!selectedItems[item.orderItemId]?.selected;
                return (
                  <div
                    key={item.orderItemId}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isSelected
                        ? 'border-rose-500/50 bg-rose-950/10'
                        : 'border-zinc-800 bg-zinc-950/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.orderItemId]: {
                                selected: e.target.checked,
                                reason: prev[item.orderItemId]?.reason || 'wrong_size',
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-bold text-zinc-200">{item.title}</p>
                          <p className="font-mono text-xs text-zinc-400">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-zinc-200">
                        ${(item.priceMinor / 100).toFixed(2)}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="pt-2 border-t border-zinc-800/60">
                        <label className="block text-xs text-zinc-400 mb-1">Reason for return:</label>
                        <select
                          value={selectedItems[item.orderItemId]?.reason}
                          onChange={(e) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.orderItemId]: { ...prev[item.orderItemId], reason: e.target.value },
                            }))
                          }
                          className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
                        >
                          <option value="wrong_size">Wrong size / Fit not as expected</option>
                          <option value="changed_mind">Changed my mind / No longer needed</option>
                          <option value="not_as_described">Item does not match website photo</option>
                          <option value="damaged">Damaged during shipping</option>
                          <option value="defective">Defective material / zipper / stitching</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                &larr; Back to lookup
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateReturn}
                className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-950/40 transition-colors"
              >
                {isSubmitting ? 'Generating Return Label...' : 'Submit & Get Return Label'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success & Download Label */}
        {step === 3 && completedRma && (
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900 p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Return Approved & Label Ready!</h2>
              <p className="mt-1 text-sm text-zinc-400">
                RMA Number: <span className="font-mono font-bold text-rose-400">{completedRma.rmaNumber}</span>
              </p>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Estimated Refund:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${(completedRma.refundAmountMinor / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Refund Method:</span>
                <span className="text-zinc-200">Original Payment Method (Stripe)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Return Carrier:</span>
                <span className="text-zinc-200">USPS Prepaid Priority</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={completedRma.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
              >
                <Download className="h-4 w-4" />
                <span>Download Prepaid Label (PDF)</span>
              </a>

              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print Instructions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
