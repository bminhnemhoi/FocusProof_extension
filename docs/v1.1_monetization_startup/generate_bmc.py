# -*- coding: utf-8 -*-
"""
FocusProof - Business Model Canvas (BMC) Generator
9-block Osterwalder layout, Vietnamese-localized, content đã sửa theo review.

Layout standard:
+----------+-----------+----------+-----------+----------+
|          | Activities|          | Relations |          |
| Partners +-----------+ Value    +-----------+ Segments |
|          | Resources | Props    | Channels  |          |
+----------+-----------+----------+-----------+----------+
|     Cost Structure     |     Revenue Streams           |
+------------------------+-------------------------------+
"""
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import matplotlib.font_manager as fm

ROOT = Path(__file__).parent
OUT = ROOT / "_diagrams" / "bmc.png"
OUT.parent.mkdir(exist_ok=True)

# ============================================================
# COLOR PALETTE — match slide template
# ============================================================
NAVY        = '#0F2A47'
NAVY_SOFT   = '#1E3A5F'
TEAL        = '#14B8A6'
TEAL_LITE   = '#CCFBF1'
TEAL_BG     = '#F0FDFA'
ORANGE      = '#F59E0B'
ORANGE_LITE = '#FEF3C7'
ORANGE_BG   = '#FFFBEB'
GREEN       = '#10B981'
GREEN_LITE  = '#D1FAE5'
GREEN_BG    = '#F0FDF4'
PURPLE      = '#8B5CF6'
PURPLE_LITE = '#EDE9FE'
BLUE        = '#3B82F6'
BLUE_LITE   = '#DBEAFE'
PINK        = '#EC4899'
PINK_LITE   = '#FCE7F3'
GRAY        = '#94A3B8'
GRAY_LITE   = '#F1F5F9'
BORDER      = '#CBD5E1'
WHITE       = '#FFFFFF'

# ============================================================
# FONT — include Segoe UI Emoji for emoji rendering
# ============================================================
plt.rcParams['font.family'] = ['Segoe UI', 'Segoe UI Emoji',
                                'Segoe UI Symbol', 'Arial', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================
# FIGURE — 16:9 ratio for slide
# ============================================================
W, H = 20, 12  # canvas units (will scale)
fig, ax = plt.subplots(figsize=(20, 12), dpi=120)
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis('off')
ax.set_aspect('equal')
fig.patch.set_facecolor('white')

# ============================================================
# Helper: draw a block (rectangle + title + bullets)
# ============================================================
def draw_block(ax, x, y, w, h, *, title, icon, bullets=None,
               bg_color=WHITE, accent=NAVY, title_size=12,
               bullet_size=8.5, sub_headers=None,
               highlight=False):
    """Draw a BMC block."""
    # Background
    if highlight:
        # Highlighted block (Value Props center)
        outer = FancyBboxPatch((x, y), w, h,
                               boxstyle="round,pad=0.0,rounding_size=0.15",
                               linewidth=3,
                               facecolor=bg_color,
                               edgecolor=accent,
                               zorder=2)
    else:
        outer = FancyBboxPatch((x, y), w, h,
                               boxstyle="round,pad=0.0,rounding_size=0.1",
                               linewidth=1.2,
                               facecolor=bg_color,
                               edgecolor=BORDER,
                               zorder=2)
    ax.add_patch(outer)

    # Header bar (top of block)
    header_h = 0.45
    header = FancyBboxPatch((x, y + h - header_h), w, header_h,
                            boxstyle="round,pad=0.0,rounding_size=0.1",
                            linewidth=0,
                            facecolor=accent,
                            zorder=3)
    ax.add_patch(header)

    # Header icon + title (use Segoe UI Symbol for icons - works without emoji)
    ax.text(x + 0.18, y + h - header_h/2, icon,
            fontsize=16, color=WHITE, va='center', ha='left', zorder=4,
            fontname='Segoe UI Symbol', fontweight='bold')
    ax.text(x + 0.62, y + h - header_h/2, title.upper(),
            fontsize=title_size, fontweight='bold', color=WHITE,
            va='center', ha='left', zorder=4)

    # Vietnamese subtitle (under title bar)
    sub_y = y + h - header_h - 0.3
    ax.text(x + 0.2, sub_y,
            "",  # placeholder, override per block via sub_headers
            fontsize=9, fontweight='bold', color=accent,
            va='center', ha='left', zorder=4)

    # Bullets
    line_y = y + h - header_h - 0.2
    bullet_x = x + 0.2

    if sub_headers:
        # Block has sub-sections (e.g. Cá nhân vs B2B)
        for sub_title, items in sub_headers:
            line_y -= 0.32
            ax.text(bullet_x, line_y, sub_title,
                    fontsize=9, fontweight='bold', color=accent,
                    va='top', ha='left', zorder=4, style='italic')
            line_y -= 0.05
            for item in items:
                line_y -= 0.28
                ax.text(bullet_x + 0.08, line_y, '•',
                        fontsize=bullet_size + 1, color=accent,
                        va='top', ha='left', zorder=4, fontweight='bold')
                ax.text(bullet_x + 0.28, line_y, item,
                        fontsize=bullet_size, color=NAVY,
                        va='top', ha='left', zorder=4, wrap=True)
            line_y -= 0.05
    else:
        line_y -= 0.18
        for item in bullets:
            line_y -= 0.30
            ax.text(bullet_x + 0.05, line_y, '•',
                    fontsize=bullet_size + 1, color=accent,
                    va='top', ha='left', zorder=4, fontweight='bold')
            ax.text(bullet_x + 0.25, line_y, item,
                    fontsize=bullet_size, color=NAVY,
                    va='top', ha='left', zorder=4, wrap=True)


# ============================================================
# LAYOUT GRID
# ============================================================
# Top-row title area
TITLE_Y = 11.0
TITLE_H = 1.0

# 9-block area: y=0.3 to y=10.7 (height 10.4)
# Top row (Activities/Relationships): y=6.5-10.7 (h=4.2)
# Mid row (Resources/Channels): y=3.0-6.5 (h=3.5)
# Cost/Revenue bottom: y=0.3-2.8 (h=2.5)

# 5 columns of width 4 each = 20 total
# Partners: full height 0.3-10.7 (col 1)
# Activities: 6.5-10.7 (col 2 top)
# Resources: 3.0-6.5 (col 2 middle)
# VP: full height 0.3+2.5 to 10.7 (col 3) — extends OVER cost/revenue boundary
# Relationships: 6.5-10.7 (col 4 top)
# Channels: 3.0-6.5 (col 4 middle)
# Segments: full height 0.3+2.5 to 10.7 (col 5)

# Actually VP and Partners and Segments full-height = 3.0-10.7 (skip cost/revenue area)
# Cost: x=0-10, y=0.3-2.8
# Revenue: x=10-20, y=0.3-2.8

GAP = 0.1  # gap between blocks

# Block heights (without gaps, gap is INSIDE):
TOP_HALF_H   = 4.0   # Activities, Relationships
MID_HALF_H   = 3.6   # Resources, Channels
TALL_H       = 7.7   # Partners, VP, Segments (top + middle merged)
BOTTOM_H     = 2.5   # Cost, Revenue

# Y coordinates
BOTTOM_Y     = 0.3
MID_Y        = BOTTOM_Y + BOTTOM_H + GAP        # = 2.9
TOP_HALF_Y   = MID_Y + MID_HALF_H + GAP         # = 6.6
TALL_Y       = MID_Y                             # tall blocks start same as mid
TOP_END      = TOP_HALF_Y + TOP_HALF_H          # = 10.6

# X coordinates (5 columns of width 4)
COL_W = 4 - GAP
COLS = [0 + GAP/2, 4 + GAP/2, 8 + GAP/2, 12 + GAP/2, 16 + GAP/2]

# ============================================================
# 1. KEY PARTNERS — col 1, full height
# ============================================================
draw_block(ax, COLS[0], TALL_Y, COL_W, TALL_H,
           title="Key Partners",
           icon="◈",
           accent=PURPLE,
           bg_color=PURPLE_LITE,
           bullets=[
               "Khoa CNTT TDTU\n(mentor + beta tester)",
               "Supabase, Vercel\n(cloud infrastructure)",
               "Stripe / VNPay\n(payment gateway)",
               "OpenAI GPT-4o-mini\n(AI service)",
               "Google MediaPipe\n(BlazeFace open-source)",
               "Chrome Web Store\n(distribution)",
               "Trường ĐH & trung tâm\n(B2B Team)",
               "Cộng đồng productivity VN",
           ],
           bullet_size=8)

# ============================================================
# 2. KEY ACTIVITIES — col 2 top
# ============================================================
draw_block(ax, COLS[1], TOP_HALF_Y, COL_W, TOP_HALF_H,
           title="Key Activities",
           icon="⚙",
           accent=BLUE,
           bg_color=BLUE_LITE,
           bullets=[
               "Phát triển Chrome Extension (MV3)",
               "Tích hợp BlazeFace WASM (local AI)",
               "Phát triển Focus Score algorithm",
               "AI prompt engineering (GPT-4o-mini)",
               "Marketing content (Reddit, TikTok)",
               "Customer support email",
               "Phân tích & cải tiến sản phẩm",
           ],
           bullet_size=8.5)

# ============================================================
# 6. KEY RESOURCES — col 2 middle
# ============================================================
draw_block(ax, COLS[1], MID_Y, COL_W, MID_HALF_H,
           title="Key Resources",
           icon="▣",
           accent=BLUE,
           bg_color=BLUE_LITE,
           bullets=[
               "Cloud infra (Supabase + Vercel)",
               "Codebase v1.0 (184 tests pass)",
               "Focus Score algorithm (IP)",
               "Brand FocusProof + domain",
               "Năng lực Founder: Full-stack + AI + UI/UX",
               "Cộng đồng beta tester từ TDTU",
           ],
           bullet_size=8.5)

# ============================================================
# 3. VALUE PROPOSITIONS — col 3, FULL HEIGHT, HIGHLIGHTED
# ============================================================
draw_block(ax, COLS[2], TALL_Y, COL_W, TALL_H,
           title="Value Propositions",
           icon="◆",
           accent=TEAL,
           bg_color=TEAL_BG,
           highlight=True,
           sub_headers=[
               ("CÁ NHÂN:", [
                   "100% PRIVACY — AI local, không upload",
                   "Chứng chỉ PDF có QR + SHA-256 verify",
                   "3-Signal Detection khách quan",
                   "AI Coaching tiếng Việt cá nhân hóa",
                   "Giá rẻ nhất phân khúc (49K-99K)",
               ]),
               ("B2B (Trường / Doanh nghiệp):", [
                   "Dashboard quản lý nhóm",
                   "Báo cáo tổng hợp, export CSV",
                   "Custom Branding (logo + tên)",
                   "Compliance — không xâm phạm privacy",
               ]),
           ],
           bullet_size=8.5)

# ============================================================
# 4. CUSTOMER RELATIONSHIPS — col 4 top
# ============================================================
draw_block(ax, COLS[3], TOP_HALF_Y, COL_W, TOP_HALF_H,
           title="Customer Relationships",
           icon="♥",
           accent=PINK,
           bg_color=PINK_LITE,
           bullets=[
               "Self-service (cài extension xong dùng)",
               "Email support ≤24h (Pro), ≤4h (Team)",
               "Discord + Facebook Group community",
               "Gamification: Streak · Badges · Referral",
               "Trial Pro 7 ngày miễn phí",
               "Newsletter hàng tuần (insight + tips)",
           ],
           bullet_size=8.5)

# ============================================================
# 7. CHANNELS — col 4 middle
# ============================================================
draw_block(ax, COLS[3], MID_Y, COL_W, MID_HALF_H,
           title="Channels",
           icon="►",
           accent=PINK,
           bg_color=PINK_LITE,
           bullets=[
               "Chrome Web Store (kênh chính)",
               "Website focusproof.com",
               "Product Hunt launch",
               "Reddit (r/productivity, r/vietnam)",
               "TikTok / YouTube Shorts",
               "Referral viral (+20 Credit)",
               "Outreach B2B trực tiếp",
           ],
           bullet_size=8.5)

# ============================================================
# 5. CUSTOMER SEGMENTS — col 5, full height
# ============================================================
draw_block(ax, COLS[4], TALL_Y, COL_W, TALL_H,
           title="Customer Segments",
           icon="◉",
           accent=GREEN,
           bg_color=GREEN_BG,
           sub_headers=[
               ("CÁ NHÂN:", [
                   "Sinh viên 18-24t\n(học bổng, internship)",
                   "Người muốn cải thiện\nsự tập trung",
                   "Phụ huynh\n(yên tâm về con)",
                   "Freelancer & Remote\n(verify giờ cho khách)",
                   "Lập trình viên\n(tự đo năng suất)",
               ]),
               ("B2B:", [
                   "Trường ĐH, trung tâm\nđào tạo trực tuyến",
                   "SME có nhân viên remote",
               ]),
           ],
           bullet_size=8)

# ============================================================
# 8. COST STRUCTURE — bottom left wide
# ============================================================
COST_W = 10 - GAP
draw_block(ax, GAP/2, BOTTOM_Y, COST_W, BOTTOM_H,
           title="Cost Structure",
           icon="▼",
           accent=ORANGE,
           bg_color=ORANGE_BG,
           sub_headers=[
               ("Cố định:", [
                   "Domain $14/năm  ·  Chrome dev fee $5  ·  Tools/licenses",
               ]),
               ("Biến đổi:", [
                   "Phí thanh toán Stripe/VNPay (~2.5%)  ·  OpenAI ~$0.001/AI call  ·  Marketing $0-150/th",
               ]),
               ("Hosting:", [
                   "Supabase: $0 (≤50K MAU) → $25/th  ·  Vercel: $0 → $20/th",
               ]),
           ],
           bullet_size=8.5)

# Add highlight callout for "no GPU"
ax.text(COST_W/2 + GAP/2, BOTTOM_Y + 0.18,
        "★ KHÔNG có chi phí GPU server — AI chạy on-device   ·   "
        "NĂM 1: 46M ₫ (18% doanh thu)   ·   Margin 82%",
        fontsize=8.5, fontweight='bold', color=ORANGE,
        va='center', ha='center', zorder=5,
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                 edgecolor=ORANGE, linewidth=1.5))

# ============================================================
# 9. REVENUE STREAMS — bottom right wide
# ============================================================
REV_X = 10 + GAP/2
REV_W = 10 - GAP
draw_block(ax, REV_X, BOTTOM_Y, REV_W, BOTTOM_H,
           title="Revenue Streams",
           icon="▲",
           accent=GREEN,
           bg_color=GREEN_BG,
           sub_headers=[
               ("CÁ NHÂN (Freemium):", [
                   "Pro Sinh viên (.edu): 49K ₫/tháng   ·   Pro Cá nhân: 99K ₫/tháng   ·   Credit pack: 19K-99K one-time",
               ]),
               ("B2B:", [
                   "Team Plan: 79K ₫/người/tháng (min 5 user)   ·   Custom Branding bao gồm trong gói Team",
               ]),
           ],
           bullet_size=8.5)

# Revenue projection callout
ax.text(REV_X + REV_W/2, BOTTOM_Y + 0.18,
        "↑ Y1: 249M ₫   ·   Y2: 2.9 tỷ ₫   ·   Y3: 7.2 tỷ ₫   ·   "
        "ARPU 67K/tháng   ·   LTV/CAC ~40×",
        fontsize=8.5, fontweight='bold', color=GREEN,
        va='center', ha='center', zorder=5,
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                 edgecolor=GREEN, linewidth=1.5))

# ============================================================
# TITLE BAR
# ============================================================
ax.text(W/2, TITLE_Y + 0.55, 'BUSINESS MODEL CANVAS',
        fontsize=24, fontweight='bold', color=NAVY,
        ha='center', va='center')
ax.text(W/2, TITLE_Y + 0.05,
        'FocusProof — Tập trung Thông minh & Chứng minh   '
        '·   TECH STARTUP CHALLENGER 2026',
        fontsize=12, color='#475569', style='italic',
        ha='center', va='center')

# ============================================================
# SAVE
# ============================================================
plt.subplots_adjust(left=0.005, right=0.995, top=0.99, bottom=0.005)
plt.savefig(str(OUT), dpi=300, bbox_inches='tight',
            facecolor='white', pad_inches=0.2)
plt.close()

# Print summary
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print("=" * 70)
print("  FocusProof - Business Model Canvas Generated")
print("=" * 70)
print(f"  Output: {OUT}")
print(f"  Size: {OUT.stat().st_size // 1024} KB")
print("\n  9 blocks rendered:")
print("    1. Key Partners (purple)")
print("    2. Key Activities (blue)")
print("    3. Value Propositions (teal — HIGHLIGHTED)")
print("    4. Customer Relationships (pink)")
print("    5. Customer Segments (green)")
print("    6. Key Resources (blue)")
print("    7. Channels (pink)")
print("    8. Cost Structure (orange)")
print("    9. Revenue Streams (green)")
print("\n  Key fixes applied:")
print("    [FIX] Removed 'GPU server' from Cost Structure")
print("    [FIX] BlazeFace 'Tich hop' (not 'Toi uu')")
print("    [ADD] '100% Privacy' in Value Propositions")
print("    [ADD] 'Cert QR + SHA-256' in Value Propositions")
print("    [FIX] 'Nguoi muon cai thien tap trung' (not clinical)")
print("    [FIX] Removed 'doi ngu kinh doanh' (solo founder)")
print("=" * 70)
