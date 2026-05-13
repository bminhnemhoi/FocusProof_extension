# -*- coding: utf-8 -*-
"""
FocusProof - Poster Generator v3 (Clean Infographic style)
Phong cach "Vuon Minh" - Tech Startup Challenger 2026
A2 portrait (23.375 x 33.111 inch) -- Built on PosterTemplate.pptx

Design language:
  - Navy primary (#0F2A47), Slate-100 cards
  - Section title bars: full-width navy with number badge
  - Native shape icons (rounded squares + emoji)
  - Metric rows with bold % values
  - Dotted leader for metric rows
  - Numbered 01-02-03-04 process flow
  - Placeholder demo image boxes (user dán screenshot sau)
"""
from pathlib import Path
import qrcode
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).parent
DIAG = ROOT / "_diagrams"
TPL = ROOT / "PosterTemplate.pptx"
OUT = ROOT / "FocusProof_Poster.pptx"
LOGO = ROOT.parent.parent / "public" / "icons" / "icon128.png"
QR_OUT = DIAG / "qr_focusproof.png"

# ============================================================
# COLOR PALETTE — Clean Infographic (Navy + accents)
# ============================================================
NAVY       = RGBColor(0x0F, 0x2A, 0x47)
NAVY2      = RGBColor(0x1E, 0x3A, 0x5F)
NAVY3      = RGBColor(0x2C, 0x4A, 0x6E)
BLUE       = RGBColor(0x25, 0x63, 0xEB)
TEAL       = RGBColor(0x0E, 0xA5, 0xE9)
ORANGE     = RGBColor(0xF9, 0x73, 0x16)
GREEN      = RGBColor(0x10, 0xB9, 0x81)
RED        = RGBColor(0xEF, 0x44, 0x44)
AMBER      = RGBColor(0xF5, 0x9E, 0x0B)

DARK       = RGBColor(0x0F, 0x17, 0x2A)
SLATE_700  = RGBColor(0x33, 0x41, 0x55)
SLATE_600  = RGBColor(0x47, 0x55, 0x69)
SLATE_500  = RGBColor(0x64, 0x74, 0x8B)
SLATE_400  = RGBColor(0x94, 0xA3, 0xB8)
SLATE_300  = RGBColor(0xCB, 0xD5, 0xE1)
SLATE_200  = RGBColor(0xE2, 0xE8, 0xF0)
SLATE_100  = RGBColor(0xF1, 0xF5, 0xF9)
SLATE_50   = RGBColor(0xF8, 0xFA, 0xFC)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Inter"


# ============================================================
# QR generation
# ============================================================
def make_qr(target: str, out: Path) -> Path:
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=10, border=2)
    qr.add_data(target)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(0x0F, 0x2A, 0x47), back_color="white")
    img.save(out)
    return out


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


def add_textbox(slide, x, y, w, h, *, fill=None, anchor=None, mleft=0.1, mtop=0.05):
    tb = slide.shapes.add_textbox(x, y, w, h)
    if fill is not None:
        tb.fill.solid(); tb.fill.fore_color.rgb = fill
    else:
        tb.fill.background()
    tb.line.fill.background()
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(mleft); tf.margin_right = Inches(mleft)
    tf.margin_top = Inches(mtop); tf.margin_bottom = Inches(mtop)
    if anchor:
        tf.vertical_anchor = anchor
    return tb, tf


def add_para(tf, text, *, size, bold=False, color=DARK, align=PP_ALIGN.LEFT,
             space_after=4, first=False, italic=False, font=FONT):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_after = Pt(space_after)
    r = p.add_run()
    set_run(r, text, size=size, bold=bold, color=color, italic=italic, font=font)
    return p


def add_rect(slide, x, y, w, h, fill, *, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    return sh


def add_round_rect(slide, x, y, w, h, fill, *, radius=0.06,
                   line=None, line_w=0.75, shadow=False):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(line_w)
    sh.shadow.inherit = False
    try:
        sh.adjustments[0] = radius
    except Exception:
        pass
    return sh


def add_card(slide, x, y, w, h, *, fill=WHITE, border=SLATE_200,
             radius=0.04, drop_shadow=True):
    """Clean infographic card: white bg + subtle border + soft shadow."""
    if drop_shadow:
        sh_off = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            x + Emu(50000), y + Emu(70000), w, h)
        sh_off.fill.solid(); sh_off.fill.fore_color.rgb = SLATE_200
        sh_off.line.fill.background()
        sh_off.shadow.inherit = False
        try:
            sh_off.adjustments[0] = radius
        except Exception:
            pass
    return add_round_rect(slide, x, y, w, h, fill, radius=radius,
                          line=border, line_w=0.75)


def add_circle(slide, x, y, d, fill, *, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, d, d)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(2)
    sh.shadow.inherit = False
    return sh


def add_arrow(slide, x, y, w, h, fill=NAVY):
    sh = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def add_pill(slide, x, y, w, h, fill, text, *, size=12, color=WHITE, bold=True):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    sh.shadow.inherit = False
    try:
        sh.adjustments[0] = 0.5
    except Exception:
        pass
    tf = sh.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.12); tf.margin_right = Inches(0.12)
    tf.margin_top = Inches(0.02); tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    set_run(r, text, size=size, bold=bold, color=color)
    return sh


def add_icon_box(slide, x, y, d, fill, emoji, *, fg=WHITE, radius=0.18):
    """Rounded square containing a centered emoji glyph."""
    add_round_rect(slide, x, y, d, d, fill, radius=radius)
    tb, tf = add_textbox(slide, x, y, d, d, anchor=MSO_ANCHOR.MIDDLE,
                         mleft=0, mtop=0)
    add_para(tf, emoji, size=int(d.inches * 28), color=fg,
             align=PP_ALIGN.CENTER, first=True)


def add_section_header(slide, x, y, w, *, number, title, h_in=0.65,
                       bg=NAVY, accent=TEAL):
    """Full-width navy section title bar with number badge."""
    add_round_rect(slide, x, y, w, Inches(h_in), bg, radius=0.04)
    # Number badge (square accent on left)
    badge_d = Inches(h_in - 0.15)
    bx = x + Inches(0.18)
    by = y + (Inches(h_in) - badge_d) / 2
    add_round_rect(slide, bx, by, badge_d, badge_d, accent, radius=0.2)
    tb, tf = add_textbox(slide, bx, by, badge_d, badge_d,
                         anchor=MSO_ANCHOR.MIDDLE, mleft=0, mtop=0)
    add_para(tf, number, size=int(h_in * 24), bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True)
    # Title text
    tx = bx + badge_d + Inches(0.2)
    tb, tf = add_textbox(slide, tx, y, w - (tx - x) - Inches(0.2),
                         Inches(h_in), anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, title.upper(), size=int(h_in * 28), bold=True, color=WHITE,
             first=True)
    return y + Inches(h_in)


def add_image(slide, path: Path, x, y, w=None, h=None):
    if not path.exists():
        return None
    if w is not None:
        return slide.shapes.add_picture(str(path), x, y, width=w)
    return slide.shapes.add_picture(str(path), x, y, height=h)


def add_dashed_box(slide, x, y, w, h, *, label="[Screenshot]"):
    """Dashed-border placeholder for user to paste screenshots later."""
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = SLATE_50
    sh.line.color.rgb = SLATE_400
    sh.line.width = Pt(1.5)
    sh.line.dash_style = 7  # MSO_LINE_DASH_STYLE.DASH = 4? use raw enum
    sh.shadow.inherit = False
    try:
        sh.adjustments[0] = 0.04
    except Exception:
        pass
    # try to set proper dash
    try:
        from pptx.enum.dml import MSO_LINE_DASH_STYLE
        sh.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    except Exception:
        pass
    tb, tf = add_textbox(slide, x, y, w, h,
                         anchor=MSO_ANCHOR.MIDDLE, mleft=0.1, mtop=0.1)
    add_para(tf, "📷", size=36, color=SLATE_400,
             align=PP_ALIGN.CENTER, first=True, space_after=6)
    add_para(tf, label, size=12, bold=True, color=SLATE_500,
             align=PP_ALIGN.CENTER, space_after=2)
    add_para(tf, "Dán ảnh thật vào đây",
             size=10, italic=True, color=SLATE_400,
             align=PP_ALIGN.CENTER)


# ============================================================
# Replace template team-info text
# ============================================================
def replace_team_text(slide):
    for sh in slide.shapes:
        if not sh.has_text_frame:
            continue
        txt = sh.text_frame.text
        low = txt.lower()
        if "tên đội" in low or "lorem" in low:
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            set_run(r, "Tên đội: ", size=24, bold=True, color=DARK)
            r2 = p.add_run()
            set_run(r2, "FocusProof", size=30, bold=True, color=NAVY)
            r3 = p.add_run()
            set_run(r3, "  ·  Tập trung Thông minh & Chứng minh",
                    size=18, italic=True, color=SLATE_500)
        elif txt.strip().lower().startswith("thành viên"):
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            set_run(r, "Thành viên: ", size=18, bold=True, color=DARK)
            r2 = p.add_run()
            set_run(r2, "Ngô Bình Minh", size=20, bold=True, color=NAVY)
            r3 = p.add_run()
            set_run(r3, " — 524H0169",
                    size=16, color=SLATE_600)


# ============================================================
# § Title band
# ============================================================
def build_title_band(slide, x, y, w, h):
    add_card(slide, x, y, w, h, fill=WHITE, border=SLATE_200,
             radius=0.03, drop_shadow=True)
    # Logo on left
    if LOGO.exists():
        logo_d = h - Inches(0.32)
        add_image(slide, LOGO, x + Inches(0.25),
                  y + (h - logo_d) / 2, h=logo_d)
        text_x = x + Inches(0.25) + logo_d + Inches(0.25)
    else:
        text_x = x + Inches(0.4)

    # Title + tagline (vertically centered)
    tb, tf = add_textbox(slide, text_x, y,
                         w - (text_x - x) - Inches(3.6), h,
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, "FocusProof", size=38, bold=True, color=NAVY,
             first=True, space_after=2)
    add_para(tf, "TẬP TRUNG  ·  CHỨNG MINH  ·  CẢI THIỆN",
             size=15, bold=True, color=TEAL, space_after=0)

    # Right side pills (vertically centered)
    pill_x = x + w - Inches(3.3)
    pill_h = Inches(0.36)
    pill_y = y + (h - pill_h) / 2 - Inches(0.12)
    add_pill(slide, pill_x, pill_y,
             Inches(1.45), pill_h, NAVY, "MVP v1.0",
             size=13, color=WHITE)
    add_pill(slide, pill_x + Inches(1.55), pill_y,
             Inches(1.45), pill_h, TEAL, "FREEMIUM",
             size=13, color=WHITE)
    tb, tf = add_textbox(slide, pill_x - Inches(0.1),
                         pill_y + pill_h + Inches(0.02),
                         Inches(3.2), Inches(0.25))
    add_para(tf, "Chrome Extension + Web  ·  Privacy-first",
             size=11, italic=True, color=SLATE_500,
             align=PP_ALIGN.RIGHT, first=True)
    # Bottom bar accent
    add_rect(slide, x, y + h - Inches(0.08), w, Inches(0.08), TEAL)


# ============================================================
# § 1 — Focus Engine flow + Sub-cards + Pills
# ============================================================
def build_section_1(slide, x, y, w, total_h):
    inner_y = add_section_header(slide, x, y, w, number="1",
                                  title="Giới thiệu Mô hình — Focus Engine")
    # White card body
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y + Inches(0.1), w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    cy = inner_y + Inches(0.35)

    # Tagline
    tb, tf = add_textbox(slide, x + Inches(0.3), cy,
                         w - Inches(0.6), Inches(0.4))
    add_para(tf, "3 tín hiệu thời gian thực  →  Focus Engine  →  Focus Score 0–100  →  Chứng chỉ PDF",
             size=15, italic=True, color=SLATE_600,
             align=PP_ALIGN.CENTER, first=True)
    cy += Inches(0.45)

    # Icon flow row: [Camera] + [Activity] + [Tab] -> [Engine] -> [Score] -> [Cert]
    flow_h = Inches(1.55)
    box_w = Inches(1.85)
    box_h = Inches(1.55)
    arrow_w = Inches(0.45)
    arrow_h = Inches(0.5)
    plus_w = Inches(0.25)

    # Compute total width: 3 inputs + 2 plus signs + arrow + 3 stages
    # input1 + + + input2 + + + input3 + arrow + engine + arrow + score + arrow + cert
    seg_w = box_w * 6 + plus_w * 2 + arrow_w * 3
    fx = x + (w - seg_w) / 2
    by = cy + (flow_h - box_h) / 2

    inputs = [
        ("📷", "FACE\nBlazeFace", BLUE),
        ("🖱", "ACTIVITY\n10 events", TEAL),
        ("🌐", "TAB\nDomain · Goal", GREEN),
    ]

    cur_x = fx
    for i, (emo, label, col) in enumerate(inputs):
        # Card
        add_round_rect(slide, cur_x, by, box_w, box_h, WHITE,
                       radius=0.1, line=col, line_w=2.5)
        # icon box top
        ic_d = Inches(0.7)
        add_icon_box(slide, cur_x + (box_w - ic_d) / 2,
                     by + Inches(0.15), ic_d, col, emo)
        # Label
        tb, tf = add_textbox(slide, cur_x + Inches(0.1),
                             by + Inches(0.95),
                             box_w - Inches(0.2), Inches(0.55),
                             anchor=MSO_ANCHOR.TOP)
        head, sub = label.split("\n", 1)
        add_para(tf, head, size=13, bold=True, color=NAVY,
                 align=PP_ALIGN.CENTER, first=True, space_after=1)
        add_para(tf, sub, size=10, color=SLATE_600,
                 align=PP_ALIGN.CENTER)
        cur_x += box_w
        if i < 2:
            # Plus sign
            tb, tf = add_textbox(slide, cur_x, by, plus_w, box_h,
                                 anchor=MSO_ANCHOR.MIDDLE)
            add_para(tf, "+", size=36, bold=True, color=SLATE_400,
                     align=PP_ALIGN.CENTER, first=True)
            cur_x += plus_w

    # Arrow → Engine
    add_arrow(slide, cur_x + Inches(0.05),
              by + (box_h - arrow_h) / 2, arrow_w - Inches(0.1), arrow_h, NAVY)
    cur_x += arrow_w

    # Engine box
    add_round_rect(slide, cur_x, by, box_w, box_h, NAVY, radius=0.1)
    ic_d = Inches(0.7)
    add_icon_box(slide, cur_x + (box_w - ic_d) / 2,
                 by + Inches(0.15), ic_d, TEAL, "🧠")
    tb, tf = add_textbox(slide, cur_x + Inches(0.1),
                         by + Inches(0.95),
                         box_w - Inches(0.2), Inches(0.55),
                         anchor=MSO_ANCHOR.TOP)
    add_para(tf, "FOCUS ENGINE", size=13, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True, space_after=1)
    add_para(tf, "Real-time scoring", size=10, color=TEAL,
             align=PP_ALIGN.CENTER)
    cur_x += box_w

    # Arrow → Score
    add_arrow(slide, cur_x + Inches(0.05),
              by + (box_h - arrow_h) / 2, arrow_w - Inches(0.1), arrow_h, NAVY)
    cur_x += arrow_w

    # Score box
    add_round_rect(slide, cur_x, by, box_w, box_h, WHITE,
                   radius=0.1, line=ORANGE, line_w=2.5)
    ic_d = Inches(0.7)
    add_icon_box(slide, cur_x + (box_w - ic_d) / 2,
                 by + Inches(0.15), ic_d, ORANGE, "⭐")
    tb, tf = add_textbox(slide, cur_x + Inches(0.1),
                         by + Inches(0.95),
                         box_w - Inches(0.2), Inches(0.55),
                         anchor=MSO_ANCHOR.TOP)
    add_para(tf, "FOCUS SCORE", size=13, bold=True, color=NAVY,
             align=PP_ALIGN.CENTER, first=True, space_after=1)
    add_para(tf, "0 → 100", size=10, color=ORANGE,
             align=PP_ALIGN.CENTER, bold=True)
    cur_x += box_w

    # Arrow → Cert
    add_arrow(slide, cur_x + Inches(0.05),
              by + (box_h - arrow_h) / 2, arrow_w - Inches(0.1), arrow_h, NAVY)
    cur_x += arrow_w

    # Cert box
    add_round_rect(slide, cur_x, by, box_w, box_h, WHITE,
                   radius=0.1, line=GREEN, line_w=2.5)
    ic_d = Inches(0.7)
    add_icon_box(slide, cur_x + (box_w - ic_d) / 2,
                 by + Inches(0.15), ic_d, GREEN, "📜")
    tb, tf = add_textbox(slide, cur_x + Inches(0.1),
                         by + Inches(0.95),
                         box_w - Inches(0.2), Inches(0.55),
                         anchor=MSO_ANCHOR.TOP)
    add_para(tf, "CERTIFICATE", size=13, bold=True, color=NAVY,
             align=PP_ALIGN.CENTER, first=True, space_after=1)
    add_para(tf, "QR · SHA-256", size=10, color=GREEN,
             align=PP_ALIGN.CENTER, bold=True)

    cy += flow_h + Inches(0.3)

    # 5 sub-feature cards row
    subs = [
        ("👀", "Face Detection", "MediaPipe BlazeFace WASM, GPU→CPU fallback", BLUE),
        ("⌨", "Activity", "10 sự kiện: keydown/IME, click, scroll, paste…", TEAL),
        ("🌐", "Tab Tracking", "Realtime URL/domain, phát hiện rời Chrome", GREEN),
        ("🤖", "AI Insight", "GPT-4o-mini song ngữ Việt-Anh (opt-in)", ORANGE),
        ("📜", "Certificate", "PDF 2 trang + QR + chữ ký SHA-256", AMBER),
    ]
    sub_h = Inches(1.4)
    sub_w = (w - Inches(0.6) - Inches(0.4) * 4) / 5
    sx = x + Inches(0.3)
    for emo, name, desc, col in subs:
        add_card(slide, sx, cy, sub_w, sub_h, fill=WHITE,
                 border=SLATE_200, radius=0.06, drop_shadow=False)
        ic_d = Inches(0.55)
        add_icon_box(slide, sx + Inches(0.25), cy + Inches(0.2),
                     ic_d, col, emo)
        tb, tf = add_textbox(slide, sx + Inches(0.25), cy + Inches(0.78),
                             sub_w - Inches(0.5), sub_h - Inches(0.85))
        add_para(tf, name, size=13, bold=True, color=NAVY,
                 first=True, space_after=2)
        add_para(tf, desc, size=10, color=SLATE_600,
                 space_after=0)
        sx += sub_w + Inches(0.4)

    cy += sub_h + Inches(0.3)

    # 3 highlight pills (full-width band)
    pills = [
        "🔒  100% LOCAL — Không upload ảnh/video",
        "🤖  AI CÓ KIỂM SOÁT — Người dùng chủ động opt-in",
        "✅  CHỨNG CHỈ XÁC THỰC — QR + Hash SHA-256",
    ]
    pill_h = Inches(0.5)
    gap = Inches(0.3)
    pill_w = (w - Inches(0.6) - gap * 2) / 3
    px = x + Inches(0.3)
    for txt in pills:
        add_pill(slide, px, cy, pill_w, pill_h, NAVY, txt,
                 size=13, color=WHITE, bold=True)
        px += pill_w + gap


# ============================================================
# § 2 — Data & Process pipeline (left column)
# ============================================================
def build_section_2(slide, x, y, w, total_h):
    inner_y = add_section_header(slide, x, y, w, number="2",
                                  title="Dữ liệu & Quy trình")
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y + Inches(0.1), w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    cy = inner_y + Inches(0.3)

    # 5-step icon flow
    steps = [
        ("🎯", "Goal", BLUE),
        ("📡", "Track", TEAL),
        ("⭐", "Score", ORANGE),
        ("🤖", "AI", GREEN),
        ("📜", "Cert", NAVY),
    ]
    n = len(steps)
    cell_w = (w - Inches(0.6)) / n
    ic_d = Inches(0.85)
    fx = x + Inches(0.3)
    fy = cy + Inches(0.05)

    # connector line behind circles
    line_y = fy + ic_d / 2
    add_rect(slide, fx + cell_w / 2, line_y - Emu(20000),
             cell_w * (n - 1), Emu(40000), SLATE_300)

    for i, (emo, label, col) in enumerate(steps):
        cx = fx + cell_w * i + (cell_w - ic_d) / 2
        add_circle(slide, cx, fy, ic_d, col, line=WHITE)
        tb, tf = add_textbox(slide, cx, fy, ic_d, ic_d,
                             anchor=MSO_ANCHOR.MIDDLE, mleft=0, mtop=0)
        add_para(tf, emo, size=26, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        # Label below
        tb, tf = add_textbox(slide, fx + cell_w * i,
                             fy + ic_d + Inches(0.05),
                             cell_w, Inches(0.3))
        add_para(tf, label, size=13, bold=True, color=NAVY,
                 align=PP_ALIGN.CENTER, first=True)

    cy += ic_d + Inches(0.55)

    # Description
    tb, tf = add_textbox(slide, x + Inches(0.3), cy,
                         w - Inches(0.6), Inches(0.4))
    add_para(tf,
             "Khép kín 5 bước: chọn mục tiêu → theo dõi 3 tín hiệu → "
             "tính Score → AI phân tích → cấp Chứng chỉ.",
             size=12, italic=True, color=SLATE_600,
             align=PP_ALIGN.CENTER, first=True)
    cy += Inches(0.45)

    # 3 sub-cards
    items = [
        ("🎯", "4 chế độ mục tiêu",
         "Study · Work · Programming · Video Lecture", BLUE),
        ("🌐", "Custom Domain Whitelist",
         "Người dùng tự cấu hình domain hợp lệ", TEAL),
        ("⚖", "Goal-based Evaluation",
         "Strict Mode · Multi-Tab Guard · External app rule", GREEN),
    ]
    sub_h = Inches(0.95)
    sx = x + Inches(0.3)
    for emo, name, desc, col in items:
        add_card(slide, sx, cy, w - Inches(0.6), sub_h,
                 fill=WHITE, border=SLATE_200, radius=0.04,
                 drop_shadow=False)
        ic_d = Inches(0.55)
        add_icon_box(slide, sx + Inches(0.2), cy + Inches(0.2),
                     ic_d, col, emo)
        tb, tf = add_textbox(slide,
                             sx + Inches(0.2) + ic_d + Inches(0.2),
                             cy + Inches(0.13),
                             w - Inches(1.5), sub_h - Inches(0.25))
        add_para(tf, name, size=14, bold=True, color=NAVY,
                 first=True, space_after=2)
        add_para(tf, desc, size=11, color=SLATE_600)
        cy += sub_h + Inches(0.15)


# ============================================================
# § 3 — Evaluation metrics (right column)
# ============================================================
def build_section_3(slide, x, y, w, total_h):
    inner_y = add_section_header(slide, x, y, w, number="3",
                                  title="Đánh giá Kết quả")
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y + Inches(0.1), w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    cy = inner_y + Inches(0.35)

    # 4 metric rows
    metrics = [
        ("Unit Tests Coverage", "184 / 184 tests passed", "100%", GREEN),
        ("Privacy Data Leak", "0 byte uploaded — 100% local", "0", GREEN),
        ("Focus Score Accuracy", "trên dataset thử nghiệm", "92%", ORANGE),
        ("Cert Verification", "Hash + QR — kiểm chứng public", "SHA-256", NAVY),
    ]
    row_h = Inches(0.7)
    rx = x + Inches(0.3)
    rw = w - Inches(0.6)
    label_w = rw * 0.7
    val_w = rw - label_w
    for label, qual, val, col in metrics:
        # Underline at bottom
        add_rect(slide, rx, cy + row_h - Emu(20000),
                 rw, Emu(15000), SLATE_200)
        # Label left (label + qual on 2 lines)
        tb, tf = add_textbox(slide, rx, cy, label_w, row_h,
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, label, size=13, bold=True, color=NAVY,
                 first=True, space_after=2)
        add_para(tf, qual, size=10, italic=True, color=SLATE_500)
        # Value right (auto-shrink long text)
        tb, tf = add_textbox(slide, rx + label_w, cy, val_w, row_h,
                             anchor=MSO_ANCHOR.MIDDLE)
        val_size = 26 if len(val) <= 4 else 18
        add_para(tf, val, size=val_size, bold=True, color=col,
                 align=PP_ALIGN.RIGHT, first=True)
        cy += row_h + Inches(0.1)

    cy += Inches(0.1)

    # 3 outcome icon boxes
    outcomes = [
        ("📈", "Tăng tập trung",
         "Đo & nhắc kịp thời", TEAL),
        ("⚡", "Giảm xao nhãng",
         "Alert realtime 4 loại", ORANGE),
        ("✓", "Bằng chứng khách quan",
         "Cert PDF có thể verify", GREEN),
    ]
    out_h = Inches(1.05)
    sub_w = (w - Inches(0.6) - Inches(0.3) * 2) / 3
    sx = x + Inches(0.3)
    for emo, name, desc, col in outcomes:
        add_card(slide, sx, cy, sub_w, out_h, fill=WHITE,
                 border=SLATE_200, radius=0.06, drop_shadow=False)
        ic_d = Inches(0.55)
        add_icon_box(slide,
                     sx + (sub_w - ic_d) / 2, cy + Inches(0.12),
                     ic_d, col, emo)
        tb, tf = add_textbox(slide, sx, cy + Inches(0.7),
                             sub_w, out_h - Inches(0.75))
        add_para(tf, name, size=12, bold=True, color=NAVY,
                 align=PP_ALIGN.CENTER, first=True, space_after=1)
        add_para(tf, desc, size=10, color=SLATE_600,
                 align=PP_ALIGN.CENTER)
        sx += sub_w + Inches(0.3)


# ============================================================
# § 4 — Product process + demo placeholders
# ============================================================
def build_section_4(slide, x, y, w, total_h):
    inner_y = add_section_header(slide, x, y, w, number="4",
                                  title="Sản phẩm Ứng dụng — Quy trình 4 bước")
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y + Inches(0.1), w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    cy = inner_y + Inches(0.35)

    # 4-step numbered process
    steps = [
        ("01", "Setup Goal",
         "Chọn task · mode · thời gian · domain whitelist"),
        ("02", "Focus Session",
         "Engine chạy local · Widget realtime · 4 loại alert"),
        ("03", "Get Certificate",
         "PDF 2 trang · Score · QR + SHA-256 · AI Insight"),
        ("04", "Share & Verify",
         "Share Facebook/TikTok · Verify QR · Lưu lịch sử"),
    ]
    n = len(steps)
    cell_w = (w - Inches(0.6)) / n
    sx = x + Inches(0.3)
    sy = cy

    # connector line
    line_y = sy + Inches(0.45)
    add_rect(slide, sx + cell_w / 2, line_y - Emu(20000),
             cell_w * (n - 1), Emu(40000), SLATE_300)

    for i, (num, name, desc) in enumerate(steps):
        cx = sx + cell_w * i
        # Number circle
        d = Inches(0.9)
        add_circle(slide, cx + (cell_w - d) / 2, sy, d, NAVY)
        tb, tf = add_textbox(slide, cx + (cell_w - d) / 2, sy, d, d,
                             anchor=MSO_ANCHOR.MIDDLE, mleft=0, mtop=0)
        add_para(tf, num, size=22, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        # Name + desc below
        tb, tf = add_textbox(slide, cx, sy + d + Inches(0.1),
                             cell_w, Inches(1.0))
        add_para(tf, name, size=14, bold=True, color=NAVY,
                 align=PP_ALIGN.CENTER, first=True, space_after=3)
        add_para(tf, desc, size=10, color=SLATE_600,
                 align=PP_ALIGN.CENTER)

    cy += Inches(2.1)

    # Tagline
    tb, tf = add_textbox(slide, x + Inches(0.3), cy,
                         w - Inches(0.6), Inches(0.35))
    add_para(tf,
             "Khép kín trong một extension duy nhất  ·  Không cần tài khoản để bắt đầu",
             size=12, italic=True, color=SLATE_500,
             align=PP_ALIGN.CENTER, first=True)
    cy += Inches(0.4)

    # 3 demo placeholder boxes
    demo_h = card_h - (cy - inner_y - Inches(0.1)) - Inches(0.2)
    demo_w = (w - Inches(0.6) - Inches(0.3) * 2) / 3
    labels = [
        "Popup · Start Screen",
        "Certificate PDF",
        "History · Heatmap",
    ]
    dx = x + Inches(0.3)
    for lbl in labels:
        add_dashed_box(slide, dx, cy, demo_w, demo_h, label=lbl)
        dx += demo_w + Inches(0.3)


# ============================================================
# § 5+6 — Architecture + Pricing tiers (two columns)
# ============================================================
def build_section_5_6(slide, x, y, w, total_h):
    col_gap = Inches(0.4)
    col_w = (w - col_gap) / 2

    # § 5 — Architecture (left)
    inner_y_5 = add_section_header(slide, x, y, col_w, number="5",
                                    title="Kiến trúc Hệ thống")
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y_5 + Inches(0.1), col_w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)
    # Use existing architecture.png (rendered from v2). Fit by height.
    avail_w = col_w - Inches(0.4)
    avail_h = card_h - Inches(0.3)
    # diagram aspect ~ 2.1:1
    img_w = avail_w
    img_h = img_w / 2.1
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * 2.1
    img_x = x + (col_w - img_w) / 2
    img_y = inner_y_5 + Inches(0.2) + (avail_h - img_h) / 2
    add_image(slide, DIAG / "architecture.png", img_x, img_y, w=img_w)

    # § 6 — Pricing tiers (right)
    rx = x + col_w + col_gap
    inner_y_6 = add_section_header(slide, rx, y, col_w, number="6",
                                    title="Mô hình Kinh doanh — Freemium")
    add_card(slide, rx, inner_y_6 + Inches(0.1), col_w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    tier_y = inner_y_6 + Inches(0.25)
    tier_h = card_h - Inches(0.7)
    tiers = [
        ("FREE", "0 ₫",
         ["Session · Face · Activity · Tab",
          "Cert PDF cơ bản",
          "Trial 7 ngày + 100 Credit"], SLATE_500),
        ("PRO", "$4.99 / tháng",
         ["AI Unlimited · PDF nâng cao",
          "Export CSV · Priority Email",
          "+50 Credit / referral"], NAVY),
        ("TEAM", "$3.99 / người",
         ["Mọi tính năng Pro",
          "Team Dashboard · Báo cáo nhóm",
          "Custom Branding · Chat support"], TEAL),
    ]
    tw = (col_w - Inches(0.6) - Inches(0.2) * 2) / 3
    tx = rx + Inches(0.3)
    for name, price, feats, col in tiers:
        is_pro = name == "PRO"
        # Card
        sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                    tx, tier_y, tw, tier_h)
        sh.fill.solid(); sh.fill.fore_color.rgb = WHITE
        if is_pro:
            sh.line.color.rgb = col
            sh.line.width = Pt(3)
        else:
            sh.line.color.rgb = SLATE_300
            sh.line.width = Pt(0.75)
        sh.shadow.inherit = False
        try:
            sh.adjustments[0] = 0.06
        except Exception:
            pass
        # Header band
        add_round_rect(slide, tx, tier_y, tw, Inches(0.6), col, radius=0.12)
        tb, tf = add_textbox(slide, tx, tier_y, tw, Inches(0.6),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, name, size=18, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        # POPULAR badge for PRO
        if is_pro:
            pw, ph = Inches(1.2), Inches(0.32)
            add_pill(slide,
                     tx + (tw - pw) / 2,
                     tier_y - ph / 2,
                     pw, ph, ORANGE, "★ POPULAR",
                     size=10, color=WHITE, bold=True)
        # Price
        tb, tf = add_textbox(slide, tx, tier_y + Inches(0.7),
                             tw, Inches(0.5))
        add_para(tf, price, size=20, bold=True, color=NAVY,
                 align=PP_ALIGN.CENTER, first=True)
        # Features
        tb, tf = add_textbox(slide, tx + Inches(0.15),
                             tier_y + Inches(1.25),
                             tw - Inches(0.3), tier_h - Inches(1.3))
        first = True
        for line in feats:
            add_para(tf, "✓  " + line, size=11, color=SLATE_600,
                     space_after=4, first=first)
            first = False
        tx += tw + Inches(0.2)

    # Tagline at bottom of section card (inside, not overlapping)
    tag_y = tier_y + tier_h + Inches(0.1)
    tb, tf = add_textbox(slide, rx + Inches(0.3), tag_y,
                         col_w - Inches(0.6), Inches(0.3))
    add_para(tf,
             "Hòa vốn tháng 4–5  ·  Gross margin 85%  ·  LTV/CAC ≈ 40×",
             size=11, italic=True, color=SLATE_500, bold=True,
             align=PP_ALIGN.CENTER, first=True)


# ============================================================
# § 7 — Conclusion + Roadmap + CTA + QR
# ============================================================
def build_section_7(slide, x, y, w, total_h):
    inner_y = add_section_header(slide, x, y, w, number="7",
                                  title="Kết luận & Hướng phát triển")
    card_h = total_h - Inches(0.65) - Inches(0.1)
    add_card(slide, x, inner_y + Inches(0.1), w, card_h,
             fill=SLATE_50, border=SLATE_200, radius=0.02)

    cy = inner_y + Inches(0.3)
    # 3 sub-columns: Kết luận | Hướng phát triển | CTA + QR
    col_gap = Inches(0.3)
    col_w = (w - Inches(0.6) - col_gap * 2) / 3
    sx = x + Inches(0.3)
    bullet_h = Inches(0.55)

    # --- Col 1: Kết luận
    tb, tf = add_textbox(slide, sx, cy, col_w, Inches(0.35))
    add_para(tf, "KẾT LUẬN", size=14, bold=True, color=NAVY,
             first=True)
    cy_col = cy + Inches(0.42)
    bullets = [
        ("✓", "Sản phẩm v1.0 hoàn thiện",
         "Extension MV3 + 184/184 tests passed"),
        ("✓", "Privacy-first thực sự",
         "Không upload data — đối lập spyware"),
        ("✓", "Sẵn sàng thương mại hóa",
         "Roadmap v1.1 với Stripe + Supabase"),
    ]
    for emo, h, d in bullets:
        sh = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                    sx, cy_col + Inches(0.05),
                                    Inches(0.26), Inches(0.26))
        sh.fill.solid(); sh.fill.fore_color.rgb = GREEN
        sh.line.fill.background(); sh.shadow.inherit = False
        tb, tf = add_textbox(slide, sx, cy_col + Inches(0.05),
                             Inches(0.26), Inches(0.26),
                             anchor=MSO_ANCHOR.MIDDLE, mleft=0, mtop=0)
        add_para(tf, emo, size=11, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        tb, tf = add_textbox(slide, sx + Inches(0.36),
                             cy_col, col_w - Inches(0.36), bullet_h)
        add_para(tf, h, size=11.5, bold=True, color=NAVY,
                 first=True, space_after=1)
        add_para(tf, d, size=9.5, color=SLATE_600)
        cy_col += bullet_h

    # --- Col 2: Hướng phát triển
    sx2 = sx + col_w + col_gap
    tb, tf = add_textbox(slide, sx2, cy, col_w, Inches(0.35))
    add_para(tf, "HƯỚNG PHÁT TRIỂN", size=14, bold=True, color=NAVY,
             first=True)
    cy_col = cy + Inches(0.42)
    roadmap = [
        ("v1.1", "Monetization Edition",
         "Stripe + Supabase + Pricing Page"),
        ("v1.2", "Team Dashboard",
         "Quản lý nhóm + Báo cáo + Custom branding"),
        ("v2.0", "Mobile Companion",
         "App iOS/Android + Edge/Firefox"),
    ]
    for ver, h, d in roadmap:
        pw = Inches(0.6)
        add_pill(slide, sx2, cy_col + Inches(0.04), pw, Inches(0.28),
                 TEAL, ver, size=10, color=WHITE, bold=True)
        tb, tf = add_textbox(slide, sx2 + pw + Inches(0.1),
                             cy_col, col_w - pw - Inches(0.1), bullet_h)
        add_para(tf, h, size=11.5, bold=True, color=NAVY,
                 first=True, space_after=1)
        add_para(tf, d, size=9.5, color=SLATE_600)
        cy_col += bullet_h

    # --- Col 3: CTA + QR
    sx3 = sx2 + col_w + col_gap
    tb, tf = add_textbox(slide, sx3, cy, col_w, Inches(0.35))
    add_para(tf, "TRẢI NGHIỆM NGAY", size=14, bold=True, color=NAVY,
             first=True)
    cy_col = cy + Inches(0.42)
    qr_d = Inches(1.4)
    if QR_OUT.exists():
        add_image(slide, QR_OUT, sx3, cy_col, w=qr_d)
    info_x = sx3 + qr_d + Inches(0.15)
    info_w = col_w - qr_d - Inches(0.15)
    tb, tf = add_textbox(slide, info_x, cy_col,
                         info_w, qr_d)
    add_para(tf, "🌐 focusproof.com", size=12, bold=True, color=NAVY,
             first=True, space_after=2)
    add_para(tf, "📧 ngobinhminh2322006@gmail.com",
             size=9, color=SLATE_600, space_after=2)
    add_para(tf, "🎓 Khoa CNTT — TDTU",
             size=9, color=SLATE_600, space_after=2)
    add_para(tf, "👤 Ngô Bình Minh · 524H0169",
             size=9, color=SLATE_600)

    # (Slogan band removed — title band đã có tagline TẬP TRUNG · CHỨNG MINH · CẢI THIỆN)


# ============================================================
# Build content overlay
# ============================================================
def build_content(slide):
    W = Inches(23.375)
    SAFE_X = Inches(0.7)
    SAFE_W = W - Inches(1.4)

    # Layout y-coordinates
    title_y = Inches(7.30); title_h = Inches(1.05)   # 7.30 - 8.35
    sec1_y  = Inches(8.55); sec1_h = Inches(5.85)    # 8.55 - 14.40
    sec23_y = Inches(14.60); sec23_h = Inches(5.85)  # 14.60 - 20.45
    sec4_y  = Inches(20.65); sec4_h = Inches(5.40)   # 20.65 - 26.05
    sec56_y = Inches(26.25); sec56_h = Inches(3.50)  # 26.25 - 29.75
    sec7_y  = Inches(29.95); sec7_h = Inches(3.10)   # 29.95 - 33.05

    # Title band
    build_title_band(slide, SAFE_X, title_y, SAFE_W, title_h)

    # § 1
    build_section_1(slide, SAFE_X, sec1_y, SAFE_W, sec1_h)

    # § 2 + § 3 (two columns)
    col_gap = Inches(0.4)
    col_w = (SAFE_W - col_gap) / 2
    build_section_2(slide, SAFE_X, sec23_y, col_w, sec23_h)
    build_section_3(slide, SAFE_X + col_w + col_gap, sec23_y,
                    col_w, sec23_h)

    # § 4
    build_section_4(slide, SAFE_X, sec4_y, SAFE_W, sec4_h)

    # § 5 + § 6
    build_section_5_6(slide, SAFE_X, sec56_y, SAFE_W, sec56_h)

    # § 7
    build_section_7(slide, SAFE_X, sec7_y, SAFE_W, sec7_h)


# ============================================================
# Main
# ============================================================
def main():
    print("=" * 70)
    print("  FocusProof - Poster v3 (Clean Infographic — Vuon Minh style)")
    print("=" * 70)

    print("\n[1/2] Generate QR code -> focusproof.com ...")
    make_qr("https://focusproof.com", QR_OUT)
    print(f"   [OK] {QR_OUT.name} ({QR_OUT.stat().st_size // 1024} KB)")

    print(f"\n[2/2] Open template & build poster ...")
    prs = Presentation(str(TPL))
    slide = prs.slides[0]
    replace_team_text(slide)
    build_content(slide)
    prs.save(str(OUT))
    print(f"\n DONE!")
    print(f"   Output: {OUT}")
    print(f"   Size  : {OUT.stat().st_size // 1024} KB")
    print("=" * 70)


if __name__ == "__main__":
    main()
