'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Store,
  Boxes,
  Truck,
  Users,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OnboardingBannerProps {
  orgSlug: string;
  orgName?: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  actionText: string;
  icon: React.ElementType;
}

export function OnboardingBanner({ orgSlug, orgName = 'Your Store' }: OnboardingBannerProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>(['step-1']);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load persistence from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`onboarding_${orgSlug}`);
      if (saved) {
        setCompletedSteps(JSON.parse(saved));
      }
      const dismissed = localStorage.getItem(`onboarding_dismissed_${orgSlug}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // LocalStorage fallback
    }
  }, [orgSlug]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId];
      try {
        localStorage.setItem(`onboarding_${orgSlug}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(`onboarding_dismissed_${orgSlug}`, 'true');
    } catch {}
  };

  if (isDismissed) {
    return null;
  }

  const steps: Step[] = [
    {
      id: 'step-1',
      title: 'Connect Sales Channel',
      description: 'Link Shopify, WooCommerce, or custom API to stream live orders and inventory.',
      href: `/${orgSlug}/integrations`,
      actionText: 'Connect Store',
      icon: Store,
    },
    {
      id: 'step-2',
      title: 'Import Catalog & SKUs',
      description: 'Upload product variants with price minor units, weights, and reorder points.',
      href: `/${orgSlug}/catalog`,
      actionText: 'View Catalog',
      icon: Boxes,
    },
    {
      id: 'step-3',
      title: 'Configure Pack Station & Bins',
      description: 'Calibrate picking aisles, bin locations, and handheld USB/Bluetooth scanners.',
      href: `/${orgSlug}/fulfillment`,
      actionText: 'Setup Pack Dock',
      icon: Truck,
    },
    {
      id: 'step-4',
      title: 'Invite Operations Staff',
      description: 'Add team members with server-enforced roles (Fulfillment, Support, Purchasing, Finance).',
      href: `/${orgSlug}/settings`,
      actionText: 'Manage Team',
      icon: Users,
    },
  ];

  const progressPercent = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-sm text-black space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-xs">
              <Sparkles className="h-3 w-3 text-orange-400" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              Store Launch Checklist • {orgName}
            </span>
            <span className="rounded-full bg-white border border-green-300 px-2 py-0.5 text-[10px] font-bold text-green-700">
              {progressPercent}% Complete
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Complete these 4 operational steps to begin receiving automated wave picks and live orders.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors"
            title={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black transition-colors"
            title="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-black h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Checklist Cards */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-3 transition-colors ${
                  isCompleted
                    ? 'border-zinc-200 bg-zinc-50/60'
                    : 'border-zinc-300 bg-white hover:border-black'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-black group"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-400 group-hover:text-black flex-shrink-0" />
                      )}
                      <span className={isCompleted ? 'line-through text-zinc-500 font-medium' : 'text-black'}>
                        {idx + 1}. {step.title}
                      </span>
                    </button>
                    <Icon className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    {step.description}
                  </p>
                </div>

                <Link
                  href={step.href}
                  className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-black hover:underline"
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
