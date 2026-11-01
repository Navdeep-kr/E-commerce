'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Barcode,
  Package,
  CheckCircle2,
  AlertOctagon,
  ArrowLeft,
  Printer,
  Scale,
  Truck,
  RotateCcw,
  Sparkles,
  Volume2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { FulfillmentService, type PackVerificationLine } from '@storefront-ops/core';

interface OrderPackage {
  id: string;
  name: string;
  dimensions: string;
  tareWeightOz: number;
}

const BOX_PRESETS: OrderPackage[] = [
  { id: 'box-sm', name: 'Box Small', dimensions: '8" x 6" x 4"', tareWeightOz: 3 },
  { id: 'box-md', name: 'Box Medium', dimensions: '12" x 9" x 6"', tareWeightOz: 6 },
  { id: 'box-lg', name: 'Box Large', dimensions: '16" x 12" x 8"', tareWeightOz: 10 },
  { id: 'poly-10', name: 'Polybag Mailer', dimensions: '10" x 13"', tareWeightOz: 1 },
];

interface CarrierRate {
  rateId: string;
  carrier: string;
  serviceName: string;
  amountMinor: number;
  currency: string;
  estimatedDeliveryDays: number;
}

export default function PackStationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const orderParam = searchParams.get('order');

  // Station State
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>(orderParam || 'ORD-10892');
  const [recipient, setRecipient] = useState({
    name: 'Alex Mercer',
    street: '142 Grand Street, Apt 4B',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11249',
    country: 'US',
  });

  const [lines, setLines] = useState<PackVerificationLine[]>([
    {
      sku: 'HOODIE-BLK-M',
      barcode: '890123456789',
      variantTitle: 'Heavyweight Fleece Hoodie (Black / M)',
      quantityOrdered: 1,
      quantityScanned: 0,
    },
    {
      sku: 'TEE-WHT-L',
      barcode: '890123456790',
      variantTitle: 'Classic Cotton Tee (White / L)',
      quantityOrdered: 2,
      quantityScanned: 0,
    },
  ]);

  const [scanInput, setScanInput] = useState('');
  const [alertError, setAlertError] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<string>('box-md');
  const [packageWeightLbs, setPackageWeightLbs] = useState<number>(2.4);

  // Carrier Rates
  const [rates, setRates] = useState<CarrierRate[]>([
    {
      rateId: 'rate_usps_priority',
      carrier: 'USPS',
      serviceName: 'Priority Mail 2-Day',
      amountMinor: 750,
      currency: 'USD',
      estimatedDeliveryDays: 2,
    },
    {
      rateId: 'rate_ups_ground',
      carrier: 'UPS',
      serviceName: 'UPS Ground',
      amountMinor: 890,
      currency: 'USD',
      estimatedDeliveryDays: 3,
    },
    {
      rateId: 'rate_fedex_2day',
      carrier: 'FedEx',
      serviceName: 'FedEx 2Day Air',
      amountMinor: 1420,
      currency: 'USD',
      estimatedDeliveryDays: 2,
    },
  ]);
  const [selectedRateId, setSelectedRateId] = useState<string>('rate_usps_priority');

  // Shipment Completion State
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedShipment, setCompletedShipment] = useState<{
    trackingNumber: string;
    carrier: string;
    labelUrl: string;
    packedAt: string;
    elapsedSeconds: number;
  } | null>(null);

  // Packing stopwatch
  const [startTime, setStartTime] = useState<number>(Date.now());
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Focus scan input on load
  useEffect(() => {
    scanInputRef.current?.focus();
    setStartTime(Date.now());
  }, [activeOrderNumber]);

  // Audio synthesizer cues (Zero-network Web Audio API)
  const playSound = (type: 'success' | 'complete' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'complete') {
        // Triumphant chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.3);
        });
      } else {
        // Low error buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext not supported or blocked by browser policy
    }
  };

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    const code = scanInput.trim();
    setScanInput('');
    setAlertError(null);

    // If scanning order barcode to switch orders
    if (code.toUpperCase().startsWith('ORD-')) {
      setActiveOrderNumber(code.toUpperCase());
      return;
    }

    // Verify item
    const result = FulfillmentService.verifyScannedItem(lines, code);

    if (result.mismatch) {
      playSound('error');
      setAlertError(result.message);
    } else {
      setLines(result.lines);
      if (result.isComplete) {
        playSound('complete');
      } else {
        playSound('success');
      }
    }
  };

  const isAllVerified = lines.every((l) => l.quantityScanned >= l.quantityOrdered);
  const totalItemsRequired = lines.reduce((acc, l) => acc + l.quantityOrdered, 0);
  const totalItemsScanned = lines.reduce((acc, l) => acc + l.quantityScanned, 0);

  const handlePrintAndShip = async () => {
    setIsProcessing(true);
    setAlertError(null);

    try {
      const res = await fetch('/api/fulfillment/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrderNumber,
          rateId: selectedRateId,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;

      if (res.ok && data.success) {
        setCompletedShipment({
          trackingNumber: data.shipment.trackingNumber,
          carrier: data.shipment.carrier,
          labelUrl: data.shipment.labelUrl,
          packedAt: new Date().toLocaleTimeString(),
          elapsedSeconds: elapsed,
        });
        playSound('complete');
      } else {
        setAlertError(data.error || 'Failed to purchase shipping label.');
        playSound('error');
      }
    } catch {
      setAlertError('Network error connecting to shipping service.');
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetForNextOrder = () => {
    setCompletedShipment(null);
    setActiveOrderNumber('ORD-10893');
    setRecipient({
      name: 'Brianna Hayes',
      street: '882 Sunset Blvd',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'US',
    });
    setLines([
      {
        sku: 'CAP-NAVY-OS',
        barcode: '890123456795',
        variantTitle: 'Signature Logo Cap (Navy / OS)',
        quantityOrdered: 1,
        quantityScanned: 0,
      },
    ]);
    setAlertError(null);
    setStartTime(Date.now());
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-[85vh] flex flex-col space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/fulfillment`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">Station #02</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-400">East Coast DC &bull; Live Scanner Active</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Pack Station Touch Terminal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Target Speed: &lt; 30s per order</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Quick Orders:</span>
            {['ORD-10892', 'ORD-10893', 'ORD-10894'].map((ord) => (
              <button
                key={ord}
                onClick={() => {
                  setActiveOrderNumber(ord);
                  setCompletedShipment(null);
                  setAlertError(null);
                }}
                className={`px-2 py-1 text-xs font-mono font-medium rounded ${
                  activeOrderNumber === ord
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {ord}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertError && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-rose-300 shadow-lg shadow-rose-950/20 flex items-center gap-3 animate-bounce">
          <AlertOctagon className="h-6 w-6 text-rose-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">SCAN VERIFICATION MISMATCH</p>
            <p className="text-xs text-rose-200 mt-0.5">{alertError}</p>
          </div>
          <button
            onClick={() => setAlertError(null)}
            className="rounded px-2 py-1 text-xs font-bold text-rose-400 hover:bg-rose-900/60"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Completed Shipment Banner / Modal */}
      {completedShipment ? (
        <div className="rounded-2xl border border-emerald-500/50 bg-zinc-900/90 p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-100">ORDER {activeOrderNumber} PACKED & LABELED!</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Shipped via <span className="font-semibold text-zinc-200">{completedShipment.carrier}</span> &bull; Processed in{' '}
              <span className="font-bold text-emerald-400">{completedShipment.elapsedSeconds} seconds</span> (Target met &lt; 30s)
            </p>
          </div>

          {/* Simulated 4x6 Thermal Shipping Label */}
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-white p-5 text-left text-zinc-900 shadow-xl font-mono">
            <div className="flex justify-between items-start border-b-2 border-black pb-2">
              <div>
                <p className="font-black text-xl leading-none">{completedShipment.carrier}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5">PRIORITY MAIL 2-DAY</p>
              </div>
              <div className="border border-black px-1.5 py-0.5 text-right">
                <p className="text-[10px] font-black">ZONE 4</p>
              </div>
            </div>

            <div className="py-3 text-xs leading-tight border-b border-zinc-300">
              <p className="text-[9px] uppercase text-zinc-500">SHIP TO:</p>
              <p className="font-bold">{recipient.name}</p>
              <p>{recipient.street}</p>
              <p>
                {recipient.city}, {recipient.state} {recipient.zip}
              </p>
            </div>

            {/* Simulated 1D Barcode */}
            <div className="pt-3 text-center">
              <div className="h-14 w-full flex items-center justify-center bg-zinc-100 border border-zinc-300 rounded font-mono text-xs tracking-[4px] font-black">
                ||| | |||| || ||| |||| | ||| ||||
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-wider">{completedShipment.trackingNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Reprint Label
            </button>

            <button
              onClick={handleResetForNextOrder}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <span>Scan Next Order</span>
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Active Packing Workspace Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Barcode Scanner & Line Items (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Scanner Input Bar */}
            <div className="rounded-xl border border-indigo-500/30 bg-zinc-900/90 p-4 shadow-lg">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan Item Barcode or SKU... (or press Enter)"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 pl-11 pr-4 py-3 text-sm font-mono text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  Scan
                </button>
              </form>

              {/* Quick Click-to-Scan Simulator Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500 text-[11px]">Click to simulate physical scanner:</span>
                {lines.map((l) => (
                  <button
                    key={l.sku}
                    type="button"
                    onClick={() => {
                      setScanInput(l.sku);
                      const result = FulfillmentService.verifyScannedItem(lines, l.sku);
                      if (result.mismatch) {
                        playSound('error');
                        setAlertError(result.message);
                      } else {
                        setLines(result.lines);
                        if (result.isComplete) playSound('complete');
                        else playSound('success');
                      }
                      setScanInput('');
                    }}
                    className="font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-2 py-1 rounded"
                  >
                    + Scan {l.sku}
                  </button>
                ))}
                {/* Mismatch trigger test */}
                <button
                  type="button"
                  onClick={() => {
                    const result = FulfillmentService.verifyScannedItem(lines, 'WRONG-BARCODE-999');
                    playSound('error');
                    setAlertError(result.message);
                  }}
                  className="font-mono bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 px-2 py-1 rounded"
                >
                  Test Mismatch Alert
                </button>
              </div>
            </div>

            {/* Scan Verification Progress */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Order Items Verification</h3>
                  <p className="text-xs text-zinc-400">
                    {totalItemsScanned} of {totalItemsRequired} items scanned & verified
                  </p>
                </div>
                {isAllVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    All Items Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                    Scanning in Progress
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAllVerified ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalItemsScanned / totalItemsRequired) * 100)}%` }}
                />
              </div>

              {/* Line Items List */}
              <div className="divide-y divide-zinc-800">
                {lines.map((item) => {
                  const isLineDone = item.quantityScanned >= item.quantityOrdered;
                  return (
                    <div
                      key={item.sku}
                      className={`py-3.5 flex items-center justify-between transition-colors ${
                        isLineDone ? 'opacity-70 bg-zinc-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                            isLineDone
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isLineDone ? <CheckCircle2 className="h-5 w-5" /> : <Package className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{item.variantTitle}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400 font-mono">
                            <span>SKU: {item.sku}</span>
                            <span>&bull;</span>
                            <span>Barcode: {item.barcode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-lg font-bold">
                          <span className={isLineDone ? 'text-emerald-400' : 'text-zinc-200'}>
                            {item.quantityScanned}
                          </span>
                          <span className="text-zinc-500 font-normal"> / {item.quantityOrdered}</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500">
                          {isLineDone ? 'Complete' : 'Pending Scan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Packaging, Rate Shopping & 1-Click Buy (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Box Size & Scale Weight */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" />
                1. Box Size & Scale Weight
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {BOX_PRESETS.map((box) => (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => setSelectedBox(box.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedBox === box.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-200">{box.name}</p>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{box.dimensions}</p>
                  </button>
                ))}
              </div>

              {/* Weight Scale */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Scale className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium">Digital Scale (USB):</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-base text-zinc-100">
                  <input
                    type="number"
                    step="0.1"
                    value={packageWeightLbs}
                    onChange={(e) => setPackageWeightLbs(parseFloat(e.target.value) || 1)}
                    className="w-16 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-sm"
                  />
                  <span className="text-xs text-zinc-400">lbs</span>
                </div>
              </div>
            </div>

            {/* Carrier Rate Shopping */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-400" />
                  2. Rate Shopping ({recipient.city}, {recipient.state})
                </h3>
                <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  BEST RATE AUTO-SELECTED
                </span>
              </div>

              <div className="space-y-2">
                {rates.map((rate) => (
                  <div
                    key={rate.rateId}
                    onClick={() => setSelectedRateId(rate.rateId)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRateId === rate.rateId
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shippingRate"
                        checked={selectedRateId === rate.rateId}
                        onChange={() => {}}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-200">{rate.carrier} &bull; {rate.serviceName}</p>
                        <p className="text-[11px] text-zinc-400">{rate.estimatedDeliveryDays} business days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-zinc-100">
                        ${(rate.amountMinor / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-Click Buy Label & Complete Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!isAllVerified || isProcessing}
                onClick={handlePrintAndShip}
                className={`w-full py-4 rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all ${
                  isAllVerified && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 cursor-pointer active:scale-[0.99]'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Purchasing Carrier Label...</span>
                  </>
                ) : !isAllVerified ? (
                  <>
                    <Barcode className="h-5 w-5" />
                    <span>Scan All Items to Unlock Label Print</span>
                  </>
                ) : (
                  <>
                    <Printer className="h-5 w-5" />
                    <span>Buy Label, Print & Mark Shipped (1-Click)</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-zinc-500 mt-2">
                Pressing prints 4x6 label on thermal printer and auto-advances station queue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
