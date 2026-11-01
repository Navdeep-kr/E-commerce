'use client';

import React, { useState, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertTriangle, ScanBarcode } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  expectedCode?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / SKU',
  expectedCode,
}: BarcodeScannerModalProps) {
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<boolean>(false);

  // Listen for physical hardware keyboard-wedge barcode scanner input
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      // Fast successive keystrokes (< 50ms) represent a laser/CCD barcode scanner
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          processScan(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expectedCode]);

  function processScan(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLastScanned(trimmed);

    // Audio feedback chime
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (expectedCode && trimmed.toLowerCase() !== expectedCode.toLowerCase()) {
        // Warning buzz for mismatch
        setMismatch(true);
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low A
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Success high chirp
        setMismatch(false);
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High A
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // AudioContext not allowed or unsupported
    }

    onScan(trimmed);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    processScan(manualInput);
    setManualInput('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <ScanBarcode className="h-5 w-5 text-primary" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Target */}
        <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-black/90 p-8 min-h-[220px] text-center overflow-hidden">
          <div className="absolute inset-x-8 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
          <Camera className="h-10 w-10 text-white/40 mb-3" />
          <p className="text-xs text-white/80 font-medium max-w-[200px]">
            Position barcode in center or scan with handheld laser scanner
          </p>

          {expectedCode && (
            <div className="mt-4 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono text-white/90">
              Target SKU: <strong>{expectedCode}</strong>
            </div>
          )}
        </div>

        {lastScanned && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-xs border ${
              mismatch
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
            }`}
          >
            {mismatch ? (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>MISMATCH WARNING:</strong> Scanned {lastScanned} does not match expected {expectedCode}
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Verified:</strong> Scanned {lastScanned} successfully
                </span>
              </>
            )}
          </div>
        )}

        {/* Manual Keyboard Fallback */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type barcode/SKU manually..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
}

export default BarcodeScannerModal;

