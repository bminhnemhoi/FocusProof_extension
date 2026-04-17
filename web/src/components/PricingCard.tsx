import type { BillingCycle, PricingTier } from '../types';

interface PricingCardProps {
  tier: PricingTier;
  cycle: BillingCycle;
  onBuy: () => void;
}

/**
 * 1 cột pricing — phong cách GitHub Copilot Pricing.
 * - Cột "recommended" có viền brand + glow, scale nhẹ trên desktop.
 * - Hiển thị giá đổi theo billing cycle.
 */
export function PricingCard({ tier, cycle, onBuy }: PricingCardProps) {
  const isFree = tier.id === 'free';
  const price = cycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
  const displayUnit =
    isFree ? tier.unit : cycle === 'yearly' ? '/năm' : tier.unit;

  // For yearly Pro show monthly equivalent under main price
  const yearlyMonthlyEquivalent =
    cycle === 'yearly' && tier.priceYearly > 0 ? (tier.priceYearly / 12).toFixed(2) : null;

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border bg-bg-surface p-8 transition-all duration-200 ${
        tier.recommended
          ? 'border-brand-500/60 shadow-glow lg:scale-[1.03]'
          : 'border-bg-border hover:border-bg-border/80 hover:bg-bg-elevated/50'
      } animate-fadeIn`}
    >
      {/* Badge "Recommended" */}
      {tier.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="badge bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-lg">
            ⭐ Khuyến nghị
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white">{tier.name}</h3>
        <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tracking-tight text-white">
          {isFree ? '$0' : `$${price}`}
        </span>
        <span className="text-sm font-medium text-slate-400">{displayUnit}</span>
      </div>
      {yearlyMonthlyEquivalent && (
        <p className="mt-1 text-xs text-slate-500">
          ≈ ${yearlyMonthlyEquivalent}/tháng — tiết kiệm 18%
        </p>
      )}
      {!yearlyMonthlyEquivalent && !isFree && (
        <p className="mt-1 text-xs text-slate-500">Hủy bất cứ lúc nào</p>
      )}
      {isFree && <p className="mt-1 text-xs text-slate-500">Không cần thẻ tín dụng</p>}

      {/* CTA */}
      <button
        type="button"
        onClick={onBuy}
        className={`mt-6 ${
          tier.recommended ? 'btn-primary' : 'btn-secondary'
        } w-full justify-center py-3 text-base`}
      >
        {tier.ctaLabel}
      </button>

      {/* Divider */}
      <div className="my-6 h-px w-full bg-bg-border" />

      {/* Feature list */}
      <ul className="flex flex-1 flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-green" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Footnote */}
      {tier.footnote && (
        <p className="mt-6 text-xs italic text-slate-500">{tier.footnote}</p>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.704 5.296a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.29-7.29a1 1 0 011.414 0z"
      />
    </svg>
  );
}
