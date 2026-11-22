'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-xl', 'max-w-2xl'
}

export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: DrawerProps) {
  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-text" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`w-screen ${maxWidth} bg-white pointer-events-auto border-l border-black/10 shadow-2xl flex flex-col h-full transform transition-transform duration-200 ease-out`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08] bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-black tracking-tight truncate">
                    {title}
                  </h2>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-black/[0.08] p-4 bg-zinc-50/60 sticky bottom-0 z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideOverDrawer;
