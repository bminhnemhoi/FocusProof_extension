# -*- coding: utf-8 -*-
"""
FocusProof - Growth Chart (T6/2026 -> T6/2027)
Biểu đồ thể hiện lộ trình phát triển 13 tháng đầu sau launch.

Số liệu dựa trên:
- Conservative S-curve growth model
- Pricing mix: 60% Sinh viên 49K + 30% Pro 99K + 10% Team 79K
- ARPU trung bình: 67K VND/user/tháng
- Cost per user: ~12K VND (Stripe + OpenAI) + 100K fixed (Vercel/domain)
"""
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

ROOT = Path(__file__).parent
OUT = ROOT / "_diagrams" / "growth_chart.png"
OUT.parent.mkdir(exist_ok=True)

# ============================================================
# DATA — 13 tháng (T6/2026 - T6/2027)
# Conservative S-curve, dựa trên benchmark Chrome Extension indie
# ============================================================
months = ['T6\n2026', 'T7\n2026', 'T8\n2026', 'T9\n2026', 'T10\n2026',
          'T11\n2026', 'T12\n2026', 'T1\n2027', 'T2\n2027', 'T3\n2027',
          'T4\n2027', 'T5\n2027', 'T6\n2027']

# Số user trả phí - S-curve (slow start, accel mid, plateau end)
users = [5, 15, 35, 65, 105, 155, 215, 285, 365, 455, 555, 665, 800]

# ARPU 67K, cost per user 12K, fixed cost 100K
ARPU = 67_000
VAR_COST = 12_000
FIX_COST = 100_000

revenue_vnd = [u * ARPU for u in users]
costs_vnd = [u * VAR_COST + FIX_COST for u in users]
profit_vnd = [r - c for r, c in zip(revenue_vnd, costs_vnd)]

# Convert to triệu VND for display
revenue = [v / 1_000_000 for v in revenue_vnd]
costs = [c / 1_000_000 for c in costs_vnd]
profits = [p / 1_000_000 for p in profit_vnd]

# ============================================================
# COLORS — Match slide design (navy + teal + amber + green)
# ============================================================
NAVY      = '#0F2A47'
NAVY_SOFT = '#1E3A5F'
TEAL      = '#14B8A6'
TEAL_LITE = '#5EEAD4'
ORANGE    = '#F59E0B'
GREEN     = '#10B981'
GRAY      = '#94A3B8'
GRID      = '#E2E8F0'
LIGHT_BG  = '#F8FAFC'

# Phase colors (background shading)
PHASE_LAUNCH = '#FEF3C7'   # amber-100 — Launch phase
PHASE_GROWTH = '#DBEAFE'   # blue-100 — Growth phase
PHASE_SCALE  = '#D1FAE5'   # green-100 — Scale phase

# ============================================================
# FONT — Vietnamese-compatible
# ============================================================
plt.rcParams['font.family'] = ['Segoe UI', 'Arial', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================
# FIGURE
# ============================================================
fig, ax = plt.subplots(figsize=(16, 9), dpi=120)
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

x = np.arange(len(months))

# ============================================================
# PHASE BACKGROUND SHADING (3 phases)
# ============================================================
# Phase 1: Launch (M1-M4)
ax.axvspan(-0.5, 3.5, alpha=0.4, color=PHASE_LAUNCH, zorder=0)
# Phase 2: Growth (M5-M9)
ax.axvspan(3.5, 8.5, alpha=0.4, color=PHASE_GROWTH, zorder=0)
# Phase 3: Scale (M10-M13)
ax.axvspan(8.5, 12.5, alpha=0.4, color=PHASE_SCALE, zorder=0)

# Phase labels (positioned at top, but offset to avoid legend overlap)
y_max = max(revenue) * 1.18
ax.text(2.5, y_max, 'PHASE 1 — LAUNCH', ha='center', fontsize=10,
        fontweight='bold', color='#92400E', alpha=0.85)
ax.text(6.0, y_max, 'PHASE 2 — GROWTH', ha='center', fontsize=10,
        fontweight='bold', color='#1E3A8A', alpha=0.85)
ax.text(10.5, y_max, 'PHASE 3 — SCALE', ha='center', fontsize=10,
        fontweight='bold', color='#065F46', alpha=0.85)

# ============================================================
# BARS — Revenue
# ============================================================
bars = ax.bar(x, revenue, color=TEAL, alpha=0.85, width=0.65,
              label='Doanh thu', edgecolor='white', linewidth=1.5,
              zorder=2)

# Add subtle gradient effect (top of bar lighter)
for bar in bars:
    bar.set_path_effects([])

# ============================================================
# LINES — Cost (orange) and Profit (green)
# ============================================================
ax.plot(x, costs, color=ORANGE, linewidth=3.5, marker='o', markersize=9,
        markerfacecolor='white', markeredgecolor=ORANGE, markeredgewidth=2.5,
        label='Chi phí vận hành', zorder=4)

ax.plot(x, profits, color=GREEN, linewidth=3.5, marker='D', markersize=9,
        markerfacecolor='white', markeredgecolor=GREEN, markeredgewidth=2.5,
        label='Lợi nhuận ròng', zorder=4)

# ============================================================
# DATA LABELS — User count above each bar
# ============================================================
for i, (bar, u) in enumerate(zip(bars, users)):
    height = bar.get_height()
    # User count
    ax.text(bar.get_x() + bar.get_width()/2, height + 1.2,
            f'{u}', ha='center', va='bottom',
            fontsize=10, color=NAVY, fontweight='bold')
    # "user" label below count (only for first and last)
    if i == 0:
        ax.text(bar.get_x() + bar.get_width()/2, height + 3.5,
                'user', ha='center', va='bottom',
                fontsize=8, color=GRAY, style='italic')

# ============================================================
# KEY ANNOTATIONS — Milestones
# ============================================================
# M1 — Launch annotation
ax.annotate('Launch\nProduct Hunt\n+ Reddit',
            xy=(0, revenue[0]), xytext=(-0.3, 18),
            fontsize=8.5, color='#92400E', fontweight='bold',
            ha='center',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='white',
                     edgecolor=ORANGE, linewidth=1.5),
            arrowprops=dict(arrowstyle='->', color=ORANGE, lw=1.5))

# M3 — Back-to-school spike
ax.annotate('Mùa\ntựu trường',
            xy=(2, revenue[2]), xytext=(2, 22),
            fontsize=8.5, color='#1E3A8A', fontweight='bold',
            ha='center',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='white',
                     edgecolor='#3B82F6', linewidth=1.5),
            arrowprops=dict(arrowstyle='->', color='#3B82F6', lw=1.5))

# M7 — Exam season
ax.annotate('Mùa\nthi cuối kỳ',
            xy=(6, revenue[6]), xytext=(6, 30),
            fontsize=8.5, color='#1E3A8A', fontweight='bold',
            ha='center',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='white',
                     edgecolor='#3B82F6', linewidth=1.5),
            arrowprops=dict(arrowstyle='->', color='#3B82F6', lw=1.5))

# M13 — Final milestone
final_label = (f'800 user trả phí\n'
               f'{revenue[-1]:.0f}M ₫/tháng\n'
               f'Lợi nhuận {profits[-1]:.0f}M ₫')
ax.annotate(final_label,
            xy=(12, revenue[-1]), xytext=(11.0, 65),
            fontsize=10, color=NAVY, fontweight='bold',
            ha='center',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='white',
                     edgecolor=GREEN, linewidth=2),
            arrowprops=dict(arrowstyle='->', color=GREEN, lw=2))

# ============================================================
# AXES STYLING
# ============================================================
ax.set_xticks(x)
ax.set_xticklabels(months, fontsize=10, color=NAVY)
ax.tick_params(axis='y', colors=NAVY, labelsize=10)
ax.tick_params(axis='x', length=0)

ax.set_ylim(-3, y_max + 5)
ax.set_xlim(-0.7, 12.7)

# Hide top/right spines
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRID)
ax.spines['bottom'].set_color(GRID)
ax.spines['left'].set_linewidth(1)
ax.spines['bottom'].set_linewidth(1)

# Grid (only horizontal, light)
ax.yaxis.grid(True, linestyle='--', alpha=0.5, color=GRID, zorder=1)
ax.set_axisbelow(True)

# Y-axis label
ax.set_ylabel('Triệu ₫ (VND)', fontsize=11, color=NAVY,
              fontweight='bold', labelpad=12)

# ============================================================
# TITLE BAR (top)
# ============================================================
fig.text(0.5, 0.96, 'LỘ TRÌNH PHÁT TRIỂN — 13 THÁNG ĐẦU',
         fontsize=22, fontweight='bold', color=NAVY,
         ha='center')
fig.text(0.5, 0.925,
         'Tháng 6/2026  →  Tháng 6/2027   ·   Conservative growth model dựa trên unit economics thật',
         fontsize=12, color='#475569', ha='center', style='italic')

# ============================================================
# LEGEND — moved to upper-left BELOW phase labels to avoid overlap
# ============================================================
legend = ax.legend(loc='upper left', fontsize=11, frameon=True,
                   facecolor='white', edgecolor=GRID,
                   bbox_to_anchor=(0.01, 0.92))
legend.get_frame().set_linewidth(1)

# ============================================================
# FOOTER METRICS BOX
# ============================================================
total_revenue = sum(revenue)
total_cost = sum(costs)
total_profit = sum(profits)
margin = (total_profit / total_revenue) * 100

footer_text = (
    f'TỔNG NĂM ĐẦU:  '
    f'Doanh thu {total_revenue:.0f}M ₫   ·   '
    f'Chi phí {total_cost:.0f}M ₫   ·   '
    f'Lợi nhuận {total_profit:.0f}M ₫   ·   '
    f'Margin {margin:.0f}%   ·   '
    f'Hòa vốn từ tháng đầu tiên'
)
fig.text(0.5, 0.025, footer_text,
         fontsize=11, color=NAVY, fontweight='bold',
         ha='center',
         bbox=dict(boxstyle='round,pad=0.6', facecolor=LIGHT_BG,
                  edgecolor=TEAL, linewidth=2))

# ============================================================
# SAVE
# ============================================================
plt.tight_layout(rect=[0.02, 0.06, 0.98, 0.91])
plt.savefig(str(OUT), dpi=300, bbox_inches='tight',
            facecolor='white', pad_inches=0.3)
plt.close()

# Print summary (ASCII only for Windows cp1252 console)
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print("=" * 70)
print("  FocusProof - Growth Chart Generated")
print("=" * 70)
print(f"  Output: {OUT}")
print(f"  Size: {OUT.stat().st_size // 1024} KB")
print(f"\n  KEY METRICS:")
print(f"    M1  (Jun 2026): {users[0]:>4} user, "
      f"Rev {revenue[0]:.1f}M, Profit {profits[0]:.2f}M VND")
print(f"    M7  (Dec 2026): {users[6]:>4} user, "
      f"Rev {revenue[6]:.1f}M, Profit {profits[6]:.1f}M VND")
print(f"    M13 (Jun 2027): {users[-1]:>4} user, "
      f"Rev {revenue[-1]:.1f}M, Profit {profits[-1]:.1f}M VND")
print(f"\n  YEAR 1 TOTAL:")
print(f"    Revenue: {total_revenue:>7.0f}M VND  (~${total_revenue*40:.0f})")
print(f"    Cost:    {total_cost:>7.0f}M VND")
print(f"    Profit:  {total_profit:>7.0f}M VND  (margin {margin:.0f}%)")
print("=" * 70)
