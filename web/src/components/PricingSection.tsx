import { useState } from 'react';
import { PRICING_TIERS } from '../data/pricing';
import { PricingCard } from './PricingCard';
import type { BillingCycle, PricingTier } from '../types';

interface PricingSectionProps {
  /** Callback khi user nhấn "Mua ngay" — parent sẽ mở QR/Stripe modal. */
  onBuy: (tier: PricingTier, cycle: BillingCycle) => void;
}

/**
 * Section pricing chính: heading + billing toggle + 3 cột.
 */
export function PricingSection({ onBuy }: PricingSectionProps) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="container-narrow">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30">
            💎 Pricing minh bạch
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Chọn gói phù hợp với bạn
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Bắt đầu miễn phí với 7 ngày trial đầy đủ + 100 Credit. Nâng cấp bất cứ lúc nào,
            hủy bất cứ lúc nào.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex items-center justify-center">
          <div
            role="tablist"
            aria-label="Chu kỳ thanh toán"
            className="inline-flex items-center rounded-full border border-bg-border bg-bg-surface p-1"
          >
            <button
              role="tab"
              aria-selected={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                cycle === 'monthly'
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hàng tháng
            </button>
            <button
              role="tab"
              aria-selected={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                cycle === 'yearly'
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hàng năm
              <span className="badge bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30">
                -18%
              </span>
            </button>
          </div>
        </div>

        {/* 3 cards grid */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} cycle={cycle} onBuy={() => onBuy(tier, cycle)} />
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="text-accent-green">✓</span> Hoàn tiền 14 ngày
          </span>
          <span className="flex items-center gap-2">
            <span className="text-accent-green">✓</span> Không khóa hợp đồng
          </span>
          <span className="flex items-center gap-2">
            <span className="text-accent-green">✓</span> Thanh toán Momo / Stripe
          </span>
          <span className="flex items-center gap-2">
            <span className="text-accent-green">✓</span> 100% Privacy-first
          </span>
        </div>
      </div>
    </section>
  );
}
