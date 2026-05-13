# -*- coding: utf-8 -*-
"""
FocusProof - Pie Charts (Year 1 Cost & Profit Breakdown)
2 panels:
  - LEFT: Doanh thu split (Loi nhuan 82% vs Chi phi 18%)
  - RIGHT: Bóc tách 18% chi phí thành các hạng mục

Số liệu dựa trên Year 1 totals (đồng nhất với growth_chart.py):
- Doanh thu: 249 triệu ₫
- Chi phí:    46 triệu ₫
- Lợi nhuận: 203 triệu ₫ (margin 82%)
"""
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).parent
OUT = ROOT / "_diagrams" / "pie_chart_costs.png"
OUT.parent.mkdir(exist_ok=True)

# ============================================================
# DATA — Year 1 totals (triệu ₫)
# ============================================================
TOTAL_REVENUE = 249  # triệu ₫
TOTAL_COST = 46
TOTAL_PROFIT = 203

# Cost breakdown (tổng 46M ₫)
# Tỷ lệ thực tế dựa trên unit economics
costs_breakdown = {
    "Phí thanh toán\n(Stripe/VNPay 2.5%)":    32.0,   # 70% of cost
    "Marketing & Content":                       6.0,   # 13%
    "Tools, dev licenses":                       3.5,   # 7.5%
    "AI API (OpenAI)":                           2.5,   # 5%
    "Hosting & Domain":                          1.2,   # 2.5%
    "Misc (email, support)":                     0.8,   # 2%
}

# ============================================================
# COLORS — Match slide template (navy/teal/orange/green)
# ============================================================
NAVY      = '#0F2A47'
NAVY_SOFT = '#1E3A5F'
TEAL      = '#14B8A6'
ORANGE    = '#F59E0B'
GREEN     = '#10B981'
GREEN_LITE = '#34D399'
RED       = '#EF4444'
PURPLE    = '#8B5CF6'
BLUE      = '#3B82F6'
GRAY      = '#94A3B8'
LIGHT_BG  = '#F8FAFC'
GRID      = '#E2E8F0'

# ============================================================
# FONT — Vietnamese-compatible
# ============================================================
plt.rcParams['font.family'] = ['Segoe UI', 'Arial', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================
# FIGURE — 2 panels side by side (wider to fit legend)
# ============================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 8), dpi=120,
                                gridspec_kw={'width_ratios': [1, 1.3]})
fig.patch.set_facecolor('white')

# ============================================================
# CHART 1 (LEFT) — Tổng quan: Lợi nhuận vs Chi phí
# ============================================================
overview_labels = ['Lợi nhuận ròng', 'Chi phí vận hành']
overview_values = [TOTAL_PROFIT, TOTAL_COST]
overview_colors = [GREEN, ORANGE]
overview_explode = (0.04, 0.04)  # tách nhẹ ra cho đẹp

wedges1, texts1, autotexts1 = ax1.pie(
    overview_values,
    labels=overview_labels,
    colors=overview_colors,
    autopct=lambda p: f'{p:.0f}%\n{p*sum(overview_values)/100:.0f}M ₫',
    startangle=90,
    counterclock=False,
    explode=overview_explode,
    pctdistance=0.7,
    textprops={'fontsize': 13, 'fontweight': 'bold', 'color': NAVY},
    wedgeprops={'edgecolor': 'white', 'linewidth': 3},
)
for autotext in autotexts1:
    autotext.set_color('white')
    autotext.set_fontsize(13)
    autotext.set_fontweight('bold')
for text in texts1:
    text.set_fontsize(14)
    text.set_fontweight('bold')

# Center text in donut
ax1.add_artist(plt.Circle((0, 0), 0.45, color='white', zorder=10))
ax1.text(0, 0.08, 'DOANH THU\nNĂM 1', ha='center', va='center',
         fontsize=11, fontweight='bold', color=NAVY, zorder=11)
ax1.text(0, -0.08, f'{TOTAL_REVENUE}M ₫', ha='center', va='center',
         fontsize=20, fontweight='bold', color=NAVY, zorder=11)
ax1.text(0, -0.22, '(~ $10K)', ha='center', va='center',
         fontsize=10, color=GRAY, style='italic', zorder=11)

# Subtitle for chart 1
ax1.set_title('Tổng quan — Doanh thu Năm 1',
              fontsize=15, fontweight='bold', color=NAVY, pad=20)

# Margin badge
ax1.text(0, -1.32, 'Margin 82% — Hòa vốn từ tháng đầu tiên',
         ha='center', fontsize=12, fontweight='bold',
         color=GREEN,
         bbox=dict(boxstyle='round,pad=0.5', facecolor='#D1FAE5',
                  edgecolor=GREEN, linewidth=2))

# ============================================================
# CHART 2 (RIGHT) — Bóc tách chi phí (18%)
# Use LEGEND instead of inline labels to avoid overlap on small slices
# ============================================================
# Sort by value descending (largest slice first)
sorted_items = sorted(costs_breakdown.items(), key=lambda x: -x[1])
cost_labels_short = [k.replace("\n", " ") for k, _ in sorted_items]
cost_values = [v for _, v in sorted_items]
cost_colors = [ORANGE, BLUE, PURPLE, TEAL, GRAY, '#CBD5E1']

total_cost_actual = sum(cost_values)

# Pie WITHOUT outer labels (we'll use legend)
def autopct_smart(pct):
    """Show % only for slices >= 5%, otherwise blank."""
    return f'{pct:.0f}%' if pct >= 5 else ''

wedges2, texts2, autotexts2 = ax2.pie(
    cost_values,
    labels=None,
    colors=cost_colors,
    autopct=autopct_smart,
    startangle=90,
    counterclock=False,
    pctdistance=0.75,
    textprops={'fontsize': 12, 'fontweight': 'bold', 'color': 'white'},
    wedgeprops={'edgecolor': 'white', 'linewidth': 3},
)
for autotext in autotexts2:
    autotext.set_color('white')
    autotext.set_fontsize(13)
    autotext.set_fontweight('bold')

# Center hole for donut effect
ax2.add_artist(plt.Circle((0, 0), 0.45, color='white', zorder=10))
ax2.text(0, 0.08, 'TỔNG CHI PHÍ\nNĂM 1', ha='center', va='center',
         fontsize=11, fontweight='bold', color=NAVY, zorder=11)
ax2.text(0, -0.08, f'{TOTAL_COST}M ₫', ha='center', va='center',
         fontsize=20, fontweight='bold', color=ORANGE, zorder=11)
ax2.text(0, -0.22, '(18% doanh thu)', ha='center', va='center',
         fontsize=10, color=GRAY, style='italic', zorder=11)

# Subtitle for chart 2
ax2.set_title('Bóc tách Chi phí — 46 triệu ₫',
              fontsize=15, fontweight='bold', color=NAVY, pad=20)

# Legend (right side of chart 2) with values
legend_labels = [
    f'{lbl}  —  {val:.1f}M ₫  ({val/total_cost_actual*100:.0f}%)'
    for lbl, val in zip(cost_labels_short, cost_values)
]
ax2.legend(wedges2, legend_labels,
           loc='center left', bbox_to_anchor=(1.05, 0.5),
           fontsize=10, frameon=True, facecolor='white',
           edgecolor=GRID, title='Hạng mục chi phí',
           title_fontsize=11, alignment='left')

# Insight badge
ax2.text(0, -1.32,
         'Phí thanh toán chiếm 70% — không thể tối ưu thêm',
         ha='center', fontsize=11, fontweight='bold',
         color=NAVY_SOFT,
         bbox=dict(boxstyle='round,pad=0.5', facecolor=LIGHT_BG,
                  edgecolor=GRID, linewidth=1.5))

# ============================================================
# MAIN TITLE (top of figure)
# ============================================================
fig.text(0.5, 0.96, 'CƠ CẤU CHI PHÍ & LỢI NHUẬN — NĂM 1 (2026)',
         fontsize=20, fontweight='bold', color=NAVY, ha='center')
fig.text(0.5, 0.92,
         'Local-first architecture · Margin 82% · Profitable từ user thứ 16',
         fontsize=12, color='#475569', ha='center', style='italic')

# ============================================================
# FOOTER METRICS (insights)
# ============================================================
footer_text = (
    'KEY INSIGHTS:   '
    '·   AI on-device → chi phí AI chỉ 2.5M/năm   '
    '·   Supabase + Vercel free tier 100% năm đầu   '
    '·   Phí thanh toán là chi phí lớn nhất (32M)'
)
fig.text(0.5, 0.04, footer_text,
         fontsize=10, color=NAVY, fontweight='bold', ha='center',
         bbox=dict(boxstyle='round,pad=0.6', facecolor=LIGHT_BG,
                  edgecolor=TEAL, linewidth=2))

# ============================================================
# SAVE
# ============================================================
plt.tight_layout(rect=[0.02, 0.08, 0.98, 0.91])
plt.savefig(str(OUT), dpi=300, bbox_inches='tight',
            facecolor='white', pad_inches=0.3)
plt.close()

# Print summary (ASCII safe)
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print("=" * 70)
print("  FocusProof - Pie Charts Generated")
print("=" * 70)
print(f"  Output: {OUT}")
print(f"  Size: {OUT.stat().st_size // 1024} KB")
print(f"\n  YEAR 1 BREAKDOWN:")
print(f"    Revenue:  {TOTAL_REVENUE}M VND  (100%)")
print(f"    Profit:   {TOTAL_PROFIT}M VND  ({TOTAL_PROFIT/TOTAL_REVENUE*100:.0f}%)")
print(f"    Cost:     {TOTAL_COST}M VND  ({TOTAL_COST/TOTAL_REVENUE*100:.0f}%)")
print(f"\n  COST BREAKDOWN ({TOTAL_COST}M total):")
for label, value in costs_breakdown.items():
    pct = value / TOTAL_COST * 100
    label_clean = label.replace("\n", " ")
    print(f"    {label_clean:<40s} {value:>5.1f}M  ({pct:>5.1f}%)")
print("=" * 70)
