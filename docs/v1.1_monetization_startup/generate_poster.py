# -*- coding: utf-8 -*-
"""
FocusProof - Generate Poster (PPTX) from PosterTemplate.pptx
TECH STARTUP CHALLENGER 2026 - Khoa CNTT, DH Ton Duc Thang
Tac gia: Ngo Binh Minh - MSSV 524H0169

Layout (A2 portrait 23.375 x 33.111 inch):
  - Header (KEEP from template): logo TDTU + title + banner
  - Team / member info (REPLACE in-place)
  - Hero band: big gradient title + slogan
  - Section 1: Gioi thieu + Cong nghe icons
  - Section 2: User Flow diagram + System Architecture diagram
  - Section 3: Tinh kha thi + Tinh doc dao
  - Section 4: Mo hinh kinh doanh + BMC + Credit Flow
  - Footer: Slogan band
"""
from pathlib import Path
import urllib.parse, base64, hashlib, time
import requests
from copy import deepcopy
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).parent
DIAG = ROOT / "_diagrams"
DIAG.mkdir(exist_ok=True)
TPL = ROOT / "PosterTemplate.pptx"
OUT = ROOT / "FocusProof_Poster.pptx"

# === COLOR PALETTE (tim-xanh gradient #6366F1 -> #22D3EE) ===
PURPLE = RGBColor(0x63, 0x66, 0xF1)   # Indigo-500
CYAN = RGBColor(0x22, 0xD3, 0xEE)     # Cyan-400
DARK = RGBColor(0x0F, 0x17, 0x2A)     # Slate-900
DARK2 = RGBColor(0x1E, 0x29, 0x3B)    # Slate-800
GRAY = RGBColor(0x64, 0x74, 0x8B)     # Slate-500
LIGHT = RGBColor(0xF8, 0xFA, 0xFC)    # Slate-50
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0xF5, 0x9E, 0x0B)   # Amber-500
GREEN = RGBColor(0x10, 0xB9, 0x81)
PINK = RGBColor(0xEC, 0x48, 0x99)

FONT = "Inter"   # modern sans-serif. Falls back to Calibri if missing.
FONT_FALLBACK = "Calibri"


# ============================================================
# Mermaid render (with cache + kroki fallback)
# ============================================================
def mermaid_url(code: str) -> str:
    return "https://mermaid.ink/img/" + base64.urlsafe_b64encode(
        code.encode()).decode() + "?type=png&bgColor=FFFFFF"


def kroki_url(code: str) -> str:
    import zlib
    deflated = zlib.compress(code.encode("utf-8"), 9)
    return "https://kroki.io/mermaid/png/" + base64.urlsafe_b64encode(
        deflated).decode().rstrip("=")


def render_mermaid(name: str, code: str, force=False) -> Path:
    out = DIAG / f"{name}.png"
    if out.exists() and not force:
        return out
    for attempt in range(3):
        try:
            r = requests.get(mermaid_url(code), timeout=30)
            if r.ok and r.content[:4] == b"\x89PNG":
                out.write_bytes(r.content); return out
        except Exception:
            pass
        time.sleep(1)
    r = requests.get(kroki_url(code), timeout=30)
    if r.ok:
        out.write_bytes(r.content)
    return out


# Only User Flow needs to be created new. Others already exist.
USER_FLOW = """flowchart LR
    classDef start fill:#22D3EE,color:#0F172A,stroke:#0891B2,stroke-width:2px,font-weight:bold;
    classDef act fill:#6366F1,color:#FFFFFF,stroke:#4338CA,stroke-width:2px,font-weight:bold;
    classDef end1 fill:#F59E0B,color:#0F172A,stroke:#B45309,stroke-width:2px,font-weight:bold;
    classDef share fill:#10B981,color:#FFFFFF,stroke:#047857,stroke-width:2px,font-weight:bold;

    A([Cài Extension<br/>FocusProof]):::start --> B[Đặt mục tiêu<br/>phiên học]:::act
    B --> C[Cấp quyền<br/>Camera]:::act
    C --> D[Bắt đầu phiên<br/>Focus Engine chạy]:::act
    D --> E{{3-Signal<br/>Detection}}:::act
    E --> F[Focus Score<br/>cập nhật mỗi 5s]:::act
    F --> G[Kết thúc phiên<br/>AI Insight]:::end1
    G --> H[(Cấp Chứng chỉ<br/>PDF + QR + SHA-256)]:::end1
    H --> I([Chia sẻ<br/>cha mẹ / GV / NTD]):::share
"""


# ============================================================
# Helpers
# ============================================================
def set_run(run, text, *, size, bold=False, color=DARK, italic=False, font=FONT):
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color


def add_textbox(slide, x, y, w, h, *, fill=None, line=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    if fill is not None:
        tb.fill.solid(); tb.fill.fore_color.rgb = fill
    else:
        tb.fill.background()
    if line is None:
        tb.line.fill.background()
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.15); tf.margin_right = Inches(0.15)
    tf.margin_top = Inches(0.1); tf.margin_bottom = Inches(0.1)
    return tb, tf


def add_para(tf, text, *, size, bold=False, color=DARK, align=PP_ALIGN.LEFT,
             space_after=4, first=False, italic=False, font=FONT):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_after = Pt(space_after)
    r = p.add_run()
    set_run(r, text, size=size, bold=bold, color=color, italic=italic, font=font)
    return p


def add_rect(slide, x, y, w, h, fill, *, line=None, shadow=False):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(0.75)
    if not shadow:
        sh.shadow.inherit = False
    return sh


def add_round_rect(slide, x, y, w, h, fill, *, radius=0.04):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    sh.shadow.inherit = False
    # set corner radius via adjustments
    try:
        sh.adjustments[0] = radius
    except Exception:
        pass
    return sh


def add_section_card(slide, x, y, w, h, *, title, accent=PURPLE):
    """White card with colored top bar + title."""
    # Shadow rect (offset)
    add_rect(slide, x + Emu(40000), y + Emu(40000), w, h, RGBColor(0xCB, 0xD5, 0xE1))
    # Main card white
    add_rect(slide, x, y, w, h, WHITE)
    # Accent top bar
    add_rect(slide, x, y, w, Inches(0.55), accent)
    # Title text
    tb, tf = add_textbox(slide, x + Inches(0.25), y + Inches(0.05),
                         w - Inches(0.5), Inches(0.5))
    add_para(tf, title, size=22, bold=True, color=WHITE, first=True)
    return x, y + Inches(0.55), w, h - Inches(0.55)  # inner area


def add_gradient_band(slide, x, y, w, h, *, c1=PURPLE, c2=CYAN):
    """Approximate gradient band using a real PowerPoint gradient fill."""
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.line.fill.background()
    sh.shadow.inherit = False
    spPr = sh.fill._xPr.find(qn('p:spPr')) if False else sh._element.spPr
    # remove any existing fill
    for tag in ('a:noFill', 'a:solidFill', 'a:gradFill', 'a:blipFill', 'a:pattFill'):
        for el in spPr.findall(qn(tag)):
            spPr.remove(el)
    grad = etree.SubElement(spPr, qn('a:gradFill'),
                            {'flip': 'none', 'rotWithShape': '1'})
    gsLst = etree.SubElement(grad, qn('a:gsLst'))
    for pos, color in [(0, c1), (100000, c2)]:
        gs = etree.SubElement(gsLst, qn('a:gs'), {'pos': str(pos * 1000)})
        srgb = etree.SubElement(gs, qn('a:srgbClr'),
                                {'val': f'{color[0]:02X}{color[1]:02X}{color[2]:02X}'})
    lin = etree.SubElement(grad, qn('a:lin'),
                           {'ang': '0', 'scaled': '0'})
    # Move shape behind text by re-adding to back? We'll add this BEFORE text overlays.
    return sh


def add_image(slide, path: Path, x, y, w=None, h=None):
    if not path.exists():
        return None
    if w is not None:
        return slide.shapes.add_picture(str(path), x, y, width=w)
    return slide.shapes.add_picture(str(path), x, y, height=h)


# ============================================================
# Replace in-place text on template
# ============================================================
def replace_team_member(slide):
    for sh in slide.shapes:
        if not sh.has_text_frame:
            continue
        txt = sh.text_frame.text
        if "Tên đội" in txt or "LOREM" in txt:
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            set_run(r, "Tên đội: ", size=24, bold=True, color=DARK)
            r2 = p.add_run()
            set_run(r2, "FocusProof", size=28, bold=True, color=PURPLE)
            r3 = p.add_run()
            set_run(r3, "  ·  Tập trung Thông minh & Chứng minh", size=18,
                    bold=False, color=GRAY, italic=True)
        elif txt.strip().startswith("Thành viên"):
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            set_run(r, "Thành viên: ", size=20, bold=True, color=DARK)
            r2 = p.add_run()
            set_run(r2, "Ngô Bình Minh ", size=20, bold=True, color=PURPLE)
            r3 = p.add_run()
            set_run(r3, "(MSSV 524H0169)  ·  Tham gia một mình",
                    size=18, color=DARK2)


# ============================================================
# Build content overlay
# ============================================================
def build_content(slide):
    # Slide dims
    W = Inches(23.375)
    H = Inches(33.111)
    SAFE_X = Inches(0.7)
    SAFE_W = W - Inches(1.4)

    # ============ HERO BAND (y ~ 6.9" - 8.6") ============
    hero_y = Inches(6.95)
    add_gradient_band(slide, SAFE_X, hero_y, SAFE_W, Inches(1.85),
                      c1=PURPLE, c2=CYAN)
    # Title
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4), hero_y + Inches(0.15),
                         SAFE_W - Inches(0.8), Inches(1.0))
    add_para(tf, "FocusProof – Tập trung Thông minh & Chứng minh",
             size=44, bold=True, color=WHITE, align=PP_ALIGN.CENTER, first=True)
    # Subtitle
    tb2, tf2 = add_textbox(slide, SAFE_X + Inches(0.4), hero_y + Inches(1.15),
                           SAFE_W - Inches(0.8), Inches(0.6))
    add_para(tf2, "Chrome Extension + Web đo lường & xác thực mức độ tập trung "
                  "qua 3 tín hiệu: Face Detection · Activity · Tab Tracking",
             size=18, color=WHITE, align=PP_ALIGN.CENTER, first=True, italic=True)

    # ============ ROW 1 (y ~ 9.0" - 15.0") ============
    row1_y = Inches(9.05)
    row1_h = Inches(6.0)
    col_gap = Inches(0.4)
    col_w = (SAFE_W - col_gap) / 2

    # --- Left: Gioi thieu tong quan + Cong nghe ---
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, SAFE_X, row1_y, col_w, Inches(3.5),
        title="01.  GIỚI THIỆU TỔNG QUAN", accent=PURPLE)
    tb, tf = add_textbox(slide, inner_x + Inches(0.3), inner_y + Inches(0.15),
                         inner_w - Inches(0.6), inner_h - Inches(0.3))
    add_para(tf,
             "FocusProof là một Chrome Extension kết hợp Web App giúp người dùng "
             "ĐO LƯỜNG, GHI NHẬN và CHỨNG MINH mức độ tập trung trong mỗi phiên "
             "học/làm việc một cách khách quan.",
             size=14, color=DARK, first=True, space_after=10)
    add_para(tf, "▸  Lõi công nghệ 3-Signal Detection:",
             size=14, bold=True, color=PURPLE, space_after=4)
    for line in [
        "Face Detection — phát hiện khuôn mặt qua webcam (BlazeFace, on-device).",
        "Activity Tracking — chuột & bàn phím để loại trừ idle giả tập trung.",
        "Tab Tracking — phân loại tab học vs giải trí theo mục tiêu phiên.",
    ]:
        add_para(tf, "    •  " + line, size=13, color=DARK2, space_after=3)
    add_para(tf,
             "Cuối phiên: Focus Score 0–100 + AI Insight tiếng Việt + "
             "Chứng chỉ PDF có QR & chữ ký SHA-256.",
             size=13, color=DARK, space_after=2, italic=True)

    # --- Cong nghe card (below intro) ---
    tech_y = row1_y + Inches(3.7)
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, SAFE_X, tech_y, col_w, Inches(2.3),
        title="02.  CÔNG NGHỆ SỬ DỤNG", accent=CYAN)
    techs = [
        ("⚙", "Chrome MV3", PURPLE),
        ("👁", "MediaPipe BlazeFace", CYAN),
        ("⚛", "React 19 + Tailwind", PURPLE),
        ("🗄", "Supabase + Edge Fn", CYAN),
        ("📄", "jsPDF + Canvas QR", PURPLE),
        ("✨", "Framer Motion", CYAN),
    ]
    pad_x = inner_x + Inches(0.3)
    pad_y = inner_y + Inches(0.2)
    cell_w = (inner_w - Inches(0.6)) / 3
    cell_h = (inner_h - Inches(0.4)) / 2
    for i, (icon, name, col) in enumerate(techs):
        cx = pad_x + cell_w * (i % 3)
        cy = pad_y + cell_h * (i // 3)
        add_round_rect(slide, cx + Inches(0.05), cy + Inches(0.05),
                       cell_w - Inches(0.1), cell_h - Inches(0.1), LIGHT)
        # Icon circle
        ic = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                    cx + Inches(0.15), cy + Inches(0.15),
                                    Inches(0.55), Inches(0.55))
        ic.fill.solid(); ic.fill.fore_color.rgb = col
        ic.line.fill.background(); ic.shadow.inherit = False
        tb, tf = add_textbox(slide, cx + Inches(0.15), cy + Inches(0.15),
                             Inches(0.55), Inches(0.55))
        add_para(tf, icon, size=22, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tb, tf = add_textbox(slide, cx + Inches(0.8), cy + Inches(0.18),
                             cell_w - Inches(0.95), Inches(0.5))
        add_para(tf, name, size=13, bold=True, color=DARK, first=True)

    # --- Right: User Flow diagram ---
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, SAFE_X + col_w + col_gap, row1_y, col_w, row1_h,
        title="03.  USER FLOW – HÀNH TRÌNH NGƯỜI DÙNG", accent=PURPLE)
    add_image(slide, DIAG / "user_flow.png",
              inner_x + Inches(0.3), inner_y + Inches(0.25),
              w=inner_w - Inches(0.6))
    # Caption
    tb, tf = add_textbox(slide, inner_x + Inches(0.3),
                         inner_y + inner_h - Inches(0.5),
                         inner_w - Inches(0.6), Inches(0.4))
    add_para(tf, "9 bước từ cài Extension đến chia sẻ Chứng chỉ – mọi dữ liệu sinh trắc xử lý LOCAL.",
             size=11, color=GRAY, align=PP_ALIGN.CENTER, italic=True, first=True)

    # ============ ROW 2 (y ~ 15.3" - 21.5") ============
    row2_y = Inches(15.25)
    row2_h = Inches(6.4)

    # --- Left: System Architecture ---
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, SAFE_X, row2_y, col_w, row2_h,
        title="04.  SYSTEM ARCHITECTURE", accent=CYAN)
    add_image(slide, DIAG / "architecture.png",
              inner_x + Inches(0.3), inner_y + Inches(0.25),
              w=inner_w - Inches(0.6))
    tb, tf = add_textbox(slide, inner_x + Inches(0.3),
                         inner_y + inner_h - Inches(0.5),
                         inner_w - Inches(0.6), Inches(0.4))
    add_para(tf, "Chrome Extension MV3 · Supabase Edge Functions · Stripe · OpenAI GPT-4o.",
             size=11, color=GRAY, align=PP_ALIGN.CENTER, italic=True, first=True)

    # --- Right: Tinh kha thi + Tinh doc dao ---
    rx = SAFE_X + col_w + col_gap
    half_h = (row2_h - Inches(0.3)) / 2

    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, rx, row2_y, col_w, half_h,
        title="05.  TÍNH KHẢ THI", accent=GREEN)
    tb, tf = add_textbox(slide, inner_x + Inches(0.3), inner_y + Inches(0.15),
                         inner_w - Inches(0.6), inner_h - Inches(0.3))
    items = [
        ("✓", "v1.0 đã hoàn thành", "Extension + Web đầy đủ tính năng."),
        ("✓", "36+ Unit tests", "Vitest, coverage cốt lõi đạt 100%."),
        ("✓", "Chứng chỉ PDF + QR", "Có chữ ký SHA-256, xác thực public."),
        ("✓", "Sẵn sàng beta", "Onboarding, payment Stripe, dashboard người dùng."),
        ("✓", "Chi phí biên ≈ 0", "AI on-device, Supabase free tier đến 50K user."),
    ]
    first = True
    for ic, title, desc in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(8)
        r = p.add_run(); set_run(r, ic + "  ", size=16, bold=True, color=GREEN)
        r2 = p.add_run(); set_run(r2, title + "  ", size=14, bold=True, color=DARK)
        r3 = p.add_run(); set_run(r3, desc, size=13, color=DARK2)

    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, rx, row2_y + half_h + Inches(0.3), col_w, half_h,
        title="06.  TÍNH ĐỘC ĐÁO & SÁNG TẠO", accent=PINK)
    tb, tf = add_textbox(slide, inner_x + Inches(0.3), inner_y + Inches(0.15),
                         inner_w - Inches(0.6), inner_h - Inches(0.3))
    items = [
        ("★", "Local-first Privacy", "KHÔNG lưu ảnh/video — AI chạy ngay trong trình duyệt."),
        ("★", "Verifiable Certificate", "Chứng chỉ PDF có QR + SHA-256 — không thể giả mạo."),
        ("★", "AI Coaching tiếng Việt", "GPT-4o phân tích & gợi ý cải thiện cá nhân hóa."),
        ("★", "3-Signal Detection", "Kết hợp 3 nguồn dữ liệu — duy nhất trên thị trường."),
        ("★", "Gamification + Social", "Streak, leaderboard, chia sẻ cert lên mạng xã hội."),
    ]
    first = True
    for ic, title, desc in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(8)
        r = p.add_run(); set_run(r, ic + "  ", size=16, bold=True, color=PINK)
        r2 = p.add_run(); set_run(r2, title + "  ", size=14, bold=True, color=DARK)
        r3 = p.add_run(); set_run(r3, desc, size=13, color=DARK2)

    # ============ ROW 3 (y ~ 21.9" - 28.5") ============
    row3_y = Inches(21.85)
    row3_h = Inches(6.6)

    # --- Left: Mo hinh kinh doanh + Business Model diagram ---
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, SAFE_X, row3_y, col_w, row3_h,
        title="07.  MÔ HÌNH KINH DOANH", accent=PURPLE)
    # Top: pricing tiers (3 cards)
    tier_y = inner_y + Inches(0.2)
    tier_h = Inches(1.7)
    tier_w = (inner_w - Inches(0.8)) / 3
    tiers = [
        ("FREE", "0₫", "100 Credit trial · Focus Engine cơ bản · Chứng chỉ 3/tháng",
         GRAY),
        ("PRO", "$4.99 / tháng", "Unlimited Credit · AI Insight · Chứng chỉ không giới hạn · Lịch sử đầy đủ",
         PURPLE),
        ("TEAM / EDU", "$3.99 / người / tháng", "Min 5 user · Dashboard nhóm · Báo cáo cho GV/HR · API",
         CYAN),
    ]
    for i, (name, price, desc, col) in enumerate(tiers):
        tx = inner_x + Inches(0.2) + (tier_w + Inches(0.2)) * i
        add_round_rect(slide, tx, tier_y, tier_w, tier_h, LIGHT)
        add_rect(slide, tx, tier_y, tier_w, Inches(0.45), col)
        tb, tf = add_textbox(slide, tx, tier_y, tier_w, Inches(0.45))
        add_para(tf, name, size=14, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tb, tf = add_textbox(slide, tx + Inches(0.1), tier_y + Inches(0.55),
                             tier_w - Inches(0.2), Inches(1.1))
        add_para(tf, price, size=18, bold=True, color=DARK,
                 align=PP_ALIGN.CENTER, first=True, space_after=4)
        add_para(tf, desc, size=10, color=DARK2,
                 align=PP_ALIGN.CENTER, space_after=2)

    # Below tiers: Business Model diagram
    bm_y = tier_y + tier_h + Inches(0.25)
    bm_h = inner_y + inner_h - bm_y - Inches(0.2)
    add_image(slide, DIAG / "monetization.png",
              inner_x + Inches(0.4), bm_y,
              w=inner_w - Inches(0.8))
    # Revenue note
    tb, tf = add_textbox(slide, inner_x + Inches(0.3),
                         inner_y + inner_h - Inches(0.45),
                         inner_w - Inches(0.6), Inches(0.4))
    add_para(tf, "Nguồn thu: Subscription Pro/Team + Credit pack bổ sung (19K – 99K).",
             size=11, color=GRAY, align=PP_ALIGN.CENTER, italic=True, first=True)

    # --- Right: BMC + Credit Flow ---
    bmc_h = Inches(3.6)
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, rx, row3_y, col_w, bmc_h,
        title="08.  BUSINESS MODEL CANVAS", accent=ACCENT)
    add_image(slide, DIAG / "bmc.png",
              inner_x + Inches(0.2), inner_y + Inches(0.15),
              w=inner_w - Inches(0.4))

    cf_y = row3_y + bmc_h + Inches(0.3)
    cf_h = row3_h - bmc_h - Inches(0.3)
    inner_x, inner_y, inner_w, inner_h = add_section_card(
        slide, rx, cf_y, col_w, cf_h,
        title="09.  CREDIT FLOW – CHỐNG GIAN LẬN", accent=CYAN)
    add_image(slide, DIAG / "credit_sequence.png",
              inner_x + Inches(0.3), inner_y + Inches(0.15),
              w=inner_w - Inches(0.6))

    # ============ FOOTER SLOGAN BAND (y ~ 28.8" - 30.5") ============
    foot_y = Inches(28.7)
    add_gradient_band(slide, SAFE_X, foot_y, SAFE_W, Inches(1.7),
                      c1=CYAN, c2=PURPLE)
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4), foot_y + Inches(0.2),
                         SAFE_W - Inches(0.8), Inches(0.7))
    add_para(tf, "✦  TẬP TRUNG  ·  CHỨNG MINH  ·  HIỆU QUẢ THỰC SỰ  ✦",
             size=42, bold=True, color=WHITE, align=PP_ALIGN.CENTER, first=True)
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4), foot_y + Inches(1.05),
                         SAFE_W - Inches(0.8), Inches(0.5))
    add_para(tf, "FocusProof  ·  TECH STARTUP CHALLENGER 2026  ·  Khoa CNTT, ĐH Tôn Đức Thắng",
             size=16, color=WHITE, align=PP_ALIGN.CENTER, italic=True, first=True)

    # Contact tag
    tb, tf = add_textbox(slide, SAFE_X, Inches(30.6), SAFE_W, Inches(0.5))
    add_para(tf,
             "Liên hệ:  Ngô Bình Minh  ·  MSSV 524H0169  ·  Khoa CNTT – TDTU  ·  04/2026",
             size=14, bold=True, color=DARK, align=PP_ALIGN.CENTER, first=True)


# ============================================================
# Main
# ============================================================
def main():
    print("=" * 70)
    print("  FocusProof - Generate Poster (PPTX)")
    print("=" * 70)

    print("\n[1/3] Render User Flow diagram...")
    p = render_mermaid("user_flow", USER_FLOW, force=True)
    print(f"   [OK] {p.name} ({p.stat().st_size // 1024} KB)")

    print("\n[2/3] Verify other diagrams (architecture / monetization / bmc / credit_sequence)...")
    for d in ["architecture", "monetization", "bmc", "credit_sequence"]:
        f = DIAG / f"{d}.png"
        ok = "OK" if f.exists() else "MISSING"
        print(f"   [{ok}] {f.name}")

    print(f"\n[3/3] Open template & build poster...")
    prs = Presentation(str(TPL))
    slide = prs.slides[0]
    replace_team_member(slide)
    build_content(slide)
    prs.save(str(OUT))
    print(f"\n DONE!")
    print(f"   Output: {OUT}")
    print(f"   Size  : {OUT.stat().st_size // 1024} KB")
    print("=" * 70)


if __name__ == "__main__":
    main()
