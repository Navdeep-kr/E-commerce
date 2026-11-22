'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

// Global Event-driven Toast Manager
type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public show(item: Omit<ToastItem, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastItem = { ...item, id };
    this.toasts = [toast, ...this.toasts].slice(0, 5); // Keep max 5 toasts
    this.notify();

    const duration = item.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public success(title: string, description?: string, duration?: number) {
    this.show({ type: 'success', title, description, duration });
  }

  public error(title: string, description?: string, duration?: number) {
    this.show({ type: 'error', title, description, duration });
  }

  public warning(title: string, description?: string, duration?: number) {
    this.show({ type: 'warning', title, description, duration });
  }

  public info(title: string, description?: string, duration?: number) {
    this.show({ type: 'info', title, description, duration });
  }
}

export const toast = new ToastManager();

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      aria-live="polite"
    >
      {toasts.map((t) => {
        return (
          <div
            key={t.id}
            className="pointer-events-auto bg-white border border-black/10 rounded-2xl p-4 shadow-xl flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
            role="alert"
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'warning' && (
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <span className="block text-xs font-bold text-black tracking-tight leading-snug">
                {t.title}
              </span>
              {t.description && (
                <span className="block text-[11px] text-zinc-500 font-medium leading-relaxed mt-0.5">
                  {t.description}
                </span>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 text-zinc-400 hover:text-black rounded-lg p-1 hover:bg-zinc-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default toast;
