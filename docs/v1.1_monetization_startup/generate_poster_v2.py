# -*- coding: utf-8 -*-
"""
FocusProof - Poster Generator v2 (Chibi / Cartoon style)
A2 portrait (23.375 x 33.111 inch) -- Built on PosterTemplate.pptx

Design language:
  - Big rounded cards (chibi feel)
  - Gradient bands (purple -> cyan)
  - Emoji-led "mascot" circles
  - Bright pastel backgrounds, vivid accents
  - Concise, scannable text
  - All diagrams freshly drawn (Mermaid + native PPTX shapes)
"""
from pathlib import Path
import base64, time, zlib
import requests
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

# ============================================================
# CHIBI / CARTOON COLOR PALETTE
# ============================================================
PURPLE     = RGBColor(0x6D, 0x5D, 0xF6)  # vivid purple
INDIGO     = RGBColor(0x4F, 0x46, 0xE5)
CYAN       = RGBColor(0x22, 0xD3, 0xEE)
TEAL       = RGBColor(0x14, 0xB8, 0xA6)
PINK       = RGBColor(0xF4, 0x72, 0xB6)
HOT_PINK   = RGBColor(0xEC, 0x48, 0x99)
ORANGE     = RGBColor(0xFB, 0x92, 0x3C)
AMBER      = RGBColor(0xF5, 0x9E, 0x0B)
YELLOW     = RGBColor(0xFA, 0xCC, 0x15)
GREEN      = RGBColor(0x10, 0xB9, 0x81)
LIME       = RGBColor(0x84, 0xCC, 0x16)
RED        = RGBColor(0xEF, 0x44, 0x44)

DARK       = RGBColor(0x0F, 0x17, 0x2A)
DARK2      = RGBColor(0x1E, 0x29, 0x3B)
GRAY       = RGBColor(0x64, 0x74, 0x8B)
GRAY_LIGHT = RGBColor(0xCB, 0xD5, 0xE1)
SOFT_BG    = RGBColor(0xF8, 0xFA, 0xFC)
CREAM      = RGBColor(0xFE, 0xF3, 0xC7)
LAVENDER   = RGBColor(0xE0, 0xE7, 0xFF)
MINT       = RGBColor(0xD1, 0xFA, 0xE5)
PEACH      = RGBColor(0xFE, 0xD7, 0xAA)
BABY_PINK  = RGBColor(0xFC, 0xE7, 0xF3)
SKY        = RGBColor(0xBA, 0xE6, 0xFD)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Inter"


# ============================================================
# Mermaid render
# ============================================================
def mermaid_url(code: str) -> str:
    return ("https://mermaid.ink/img/" +
            base64.urlsafe_b64encode(code.encode()).decode() +
            "?type=png&bgColor=FFFFFF")


def kroki_url(code: str) -> str:
    deflated = zlib.compress(code.encode("utf-8"), 9)
    return ("https://kroki.io/mermaid/png/" +
            base64.urlsafe_b64encode(deflated).decode().rstrip("="))


def render_mermaid(name: str, code: str, force=True) -> Path:
    out = DIAG / f"{name}.png"
    if out.exists() and not force:
        return out
    for _ in range(3):
        try:
            r = requests.get(mermaid_url(code), timeout=30)
            if r.ok and r.content[:4] == b"\x89PNG":
                out.write_bytes(r.content)
                return out
        except Exception:
            pass
        time.sleep(1)
    try:
        r = requests.get(kroki_url(code), timeout=30)
        if r.ok:
            out.write_bytes(r.content)
    except Exception:
        pass
    return out


# ============================================================
# Mermaid diagrams - CHIBI STYLE
# ============================================================
DIAGRAM_THREE_SIGNALS = """flowchart LR
    classDef face fill:#FCE7F3,color:#9D174D,stroke:#EC4899,stroke-width:4px,font-size:22px,font-weight:bold;
    classDef act fill:#DBEAFE,color:#1E3A8A,stroke:#3B82F6,stroke-width:4px,font-size:22px,font-weight:bold;
    classDef tab fill:#D1FAE5,color:#064E3B,stroke:#10B981,stroke-width:4px,font-size:22px,font-weight:bold;
    classDef brain fill:#EDE9FE,color:#4C1D95,stroke:#8B5CF6,stroke-width:5px,font-size:26px,font-weight:bold;
    classDef out fill:#FEF3C7,color:#78350F,stroke:#F59E0B,stroke-width:5px,font-size:24px,font-weight:bold;

    F([👀<br/>FACE<br/>BlazeFace WASM]):::face --> M{{🧠<br/>Focus Engine<br/>Real-time}}:::brain
    A([🖱️<br/>ACTIVITY<br/>Mouse · Keyboard]):::act --> M
    T([🌐<br/>TAB<br/>Domain · Goal]):::tab --> M
    M --> S([⭐<br/>Focus Score<br/>0 → 100]):::out
    S --> P([📜<br/>Certificate<br/>QR + SHA-256]):::out
"""

DIAGRAM_JOURNEY = """flowchart LR
    classDef step fill:#EDE9FE,color:#4C1D95,stroke:#8B5CF6,stroke-width:4px,font-size:22px,font-weight:bold;
    classDef hot fill:#FFE4E6,color:#9F1239,stroke:#F43F5E,stroke-width:4px,font-size:22px,font-weight:bold;
    classDef done fill:#FEF3C7,color:#78350F,stroke:#F59E0B,stroke-width:5px,font-size:24px,font-weight:bold;

    A([😀<br/>Cài Extension<br/>Miễn phí]):::step --> B([🎯<br/>Đặt Mục tiêu<br/>Study · Work · Code]):::step
    B --> C([📷<br/>Bật Camera<br/>Tuỳ chọn]):::hot
    C --> D([💪<br/>Tập trung<br/>Engine chạy local]):::step
    D --> E([🤖<br/>AI Insight<br/>GPT-4o-mini]):::hot
    E --> F([🏆<br/>Chứng chỉ PDF<br/>Chia sẻ ngay]):::done
"""

DIAGRAM_ARCHITECTURE = """flowchart LR
    classDef ext fill:#EDE9FE,color:#4C1D95,stroke:#8B5CF6,stroke-width:3px,font-size:16px,font-weight:bold;
    classDef cloud fill:#CFFAFE,color:#155E75,stroke:#06B6D4,stroke-width:3px,font-size:16px,font-weight:bold;
    classDef pay fill:#FEF3C7,color:#78350F,stroke:#F59E0B,stroke-width:3px,font-size:16px,font-weight:bold;
    classDef ai fill:#FCE7F3,color:#9D174D,stroke:#EC4899,stroke-width:3px,font-size:16px,font-weight:bold;
    classDef web fill:#D1FAE5,color:#064E3B,stroke:#10B981,stroke-width:3px,font-size:16px,font-weight:bold;

    subgraph EXT["🧩 CHROME EXTENSION (MV3) · 100% LOCAL"]
        direction LR
        P[🎨 Popup<br/>React]:::ext
        BG[⚙️ Background<br/>Service Worker]:::ext
        OFF[📷 Offscreen<br/>MediaPipe WASM]:::ext
        ST[(💾 storage<br/>local cache)]:::ext
        P --- BG
        BG --- OFF
        BG --- ST
    end

    subgraph SB["☁️ SUPABASE — JWT · RLS · Edge Functions"]
        direction LR
        AUTH[🔐 Auth]:::cloud
        EF[⚡ Edge Fn]:::cloud
        DB[(🗄️ Postgres)]:::cloud
        AUTH --- EF --- DB
    end

    subgraph WEB["🌐 WEB APP · Next.js · Vercel"]
        direction LR
        LP[🏠 Landing]:::web
        PR[💰 Pricing]:::web
        TD[📊 Team Dashboard]:::web
    end

    AI([🤖 OpenAI<br/>GPT-4o-mini]):::ai
    PAY([💳 Stripe<br/>Checkout]):::pay

    EXT ==>|"JWT"| EF
    EXT -.->|"opt-in"| AI
    PAY ==>|"webhook"| EF
    WEB ==> PAY
    WEB ==> EF
"""

DIAGRAM_COMPARE = """flowchart LR
    classDef us fill:#EDE9FE,color:#4C1D95,stroke:#8B5CF6,stroke-width:5px,font-size:18px,font-weight:bold;
    classDef bad fill:#FEE2E2,color:#7F1D1D,stroke:#EF4444,stroke-width:3px,font-size:16px;
    classDef ok fill:#FEF3C7,color:#78350F,stroke:#F59E0B,stroke-width:3px,font-size:16px;
    classDef green fill:#D1FAE5,color:#064E3B,stroke:#10B981,stroke-width:3px,font-size:16px;

    F[🎯 <b>FocusProof</b><br/>3-Signal · Local AI<br/>QR + SHA-256<br/>💰 $4.99/tháng]:::us
    R[📊 RescueTime<br/>1 tín hiệu · Cloud<br/>❌ Không cert<br/>💰 $12/tháng]:::ok
    H[🕵️ Hubstaff<br/>Screenshot · Keylog<br/>❌ Xâm phạm privacy<br/>💰 $7-14/tháng]:::bad
    T[🌳 Forest<br/>📱 Mobile only<br/>❌ Không proof<br/>💰 $3.99 once]:::green

    F ~~~ R ~~~ H ~~~ T
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


def add_textbox(slide, x, y, w, h, *, fill=None, anchor=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    if fill is not None:
        tb.fill.solid(); tb.fill.fore_color.rgb = fill
    else:
        tb.fill.background()
    tb.line.fill.background()
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.12); tf.margin_right = Inches(0.12)
    tf.margin_top = Inches(0.06); tf.margin_bottom = Inches(0.06)
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


def add_runs(tf, runs, *, align=PP_ALIGN.LEFT, space_after=6, first=False):
    """runs = list of dicts {text, size, bold, color, italic}"""
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_after = Pt(space_after)
    for r_spec in runs:
        r = p.add_run()
        set_run(r, r_spec["text"],
                size=r_spec["size"],
                bold=r_spec.get("bold", False),
                color=r_spec.get("color", DARK),
                italic=r_spec.get("italic", False))
    return p


def add_round_card(slide, x, y, w, h, fill, *, radius=0.07,
                   shadow=True, line=None):
    """Soft rounded card with optional drop shadow."""
    if shadow:
        sh_off = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                        x + Emu(60000), y + Emu(80000), w, h)
        sh_off.fill.solid(); sh_off.fill.fore_color.rgb = GRAY_LIGHT
        sh_off.line.fill.background()
        sh_off.shadow.inherit = False
        try:
            sh_off.adjustments[0] = radius
        except Exception:
            pass
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(1.5)
    sh.shadow.inherit = False
    try:
        sh.adjustments[0] = radius
    except Exception:
        pass
    return sh


def add_pill(slide, x, y, w, h, fill, text, *, size=14, color=WHITE, bold=True):
    """Capsule/pill-shaped label."""
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
    tf.margin_left = Inches(0.1); tf.margin_right = Inches(0.1)
    tf.margin_top = Inches(0.03); tf.margin_bottom = Inches(0.03)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    set_run(r, text, size=size, bold=bold, color=color)
    return sh


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


def add_emoji_avatar(slide, cx_in, cy_in, d_in, emoji, fill, *, ring_color=None):
    """Big circular avatar with an emoji centered inside."""
    d = Inches(d_in)
    x = Inches(cx_in - d_in / 2)
    y = Inches(cy_in - d_in / 2)
    if ring_color is not None:
        ring = add_circle(slide, x - Emu(120000), y - Emu(120000),
                          d + Emu(240000), ring_color)
    add_circle(slide, x, y, d, fill)
    tb, tf = add_textbox(slide, x, y, d, d, anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, emoji, size=int(d_in * 60), align=PP_ALIGN.CENTER, first=True)


def add_gradient_band(slide, x, y, w, h, *, c1=PURPLE, c2=CYAN, angle=0):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.line.fill.background()
    sh.shadow.inherit = False
    spPr = sh._element.spPr
    for tag in ('a:noFill', 'a:solidFill', 'a:gradFill', 'a:blipFill', 'a:pattFill'):
        for el in spPr.findall(qn(tag)):
            spPr.remove(el)
    grad = etree.SubElement(spPr, qn('a:gradFill'),
                            {'flip': 'none', 'rotWithShape': '1'})
    gsLst = etree.SubElement(grad, qn('a:gsLst'))
    for pos, color in [(0, c1), (100000, c2)]:
        gs = etree.SubElement(gsLst, qn('a:gs'), {'pos': str(pos)})
        srgb = etree.SubElement(gs, qn('a:srgbClr'),
                                {'val': f'{color[0]:02X}{color[1]:02X}{color[2]:02X}'})
    etree.SubElement(grad, qn('a:lin'), {'ang': str(angle), 'scaled': '0'})
    return sh


def add_gradient_round(slide, x, y, w, h, *, c1=PURPLE, c2=CYAN,
                       radius=0.07, angle=0):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.line.fill.background()
    sh.shadow.inherit = False
    try:
        sh.adjustments[0] = radius
    except Exception:
        pass
    spPr = sh._element.spPr
    for tag in ('a:noFill', 'a:solidFill', 'a:gradFill', 'a:blipFill', 'a:pattFill'):
        for el in spPr.findall(qn(tag)):
            spPr.remove(el)
    grad = etree.SubElement(spPr, qn('a:gradFill'),
                            {'flip': 'none', 'rotWithShape': '1'})
    gsLst = etree.SubElement(grad, qn('a:gsLst'))
    for pos, color in [(0, c1), (100000, c2)]:
        gs = etree.SubElement(gsLst, qn('a:gs'), {'pos': str(pos)})
        srgb = etree.SubElement(gs, qn('a:srgbClr'),
                                {'val': f'{color[0]:02X}{color[1]:02X}{color[2]:02X}'})
    etree.SubElement(grad, qn('a:lin'), {'ang': str(angle), 'scaled': '0'})
    return sh


def add_image(slide, path: Path, x, y, w=None, h=None):
    if not path.exists():
        return None
    if w is not None:
        return slide.shapes.add_picture(str(path), x, y, width=w)
    return slide.shapes.add_picture(str(path), x, y, height=h)


def add_section_header(slide, x, y, w, *, number, title, accent=PURPLE,
                       emoji=""):
    """Chibi section header: big rounded number badge + title."""
    badge_d = Inches(0.95)
    add_circle(slide, x, y, badge_d, accent)
    tb, tf = add_textbox(slide, x, y, badge_d, badge_d,
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, number, size=30, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True)
    tb, tf = add_textbox(slide, x + badge_d + Inches(0.2), y + Inches(0.05),
                         w - badge_d - Inches(0.2), badge_d - Inches(0.1),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, f"{emoji}  {title}",
             size=28, bold=True, color=DARK, first=True)
    return y + badge_d + Inches(0.15)


# ============================================================
# Replace template team-info text
# ============================================================
def replace_team_text(slide):
    """Replace placeholder text from template with author info."""
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
            set_run(r2, "FocusProof", size=30, bold=True, color=PURPLE)
            r3 = p.add_run()
            set_run(r3, "  ·  Tập trung Thông minh & Chứng minh",
                    size=18, italic=True, color=GRAY)
        elif txt.strip().lower().startswith("thành viên"):
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            set_run(r, "Thành viên: ", size=18, bold=True, color=DARK)
            r2 = p.add_run()
            set_run(r2, "Ngô Bình Minh", size=20, bold=True, color=PURPLE)
            r3 = p.add_run()
            set_run(r3, " — 524H0169",
                    size=16, color=DARK2)


# ============================================================
# Build content overlay
# ============================================================
def build_content(slide):
    W = Inches(23.375)
    H = Inches(33.111)
    SAFE_X = Inches(0.7)
    SAFE_W = W - Inches(1.4)
    col_gap = Inches(0.4)
    col_w = (SAFE_W - col_gap) / 2

    # ============================================================
    # HERO BAND  (~7.3" - 9.55")
    # ============================================================
    hero_y = Inches(7.3)
    hero_h = Inches(2.25)
    add_gradient_round(slide, SAFE_X, hero_y, SAFE_W, hero_h,
                       c1=PURPLE, c2=CYAN, radius=0.05)
    # Decorative chibi circles on hero band
    add_circle(slide, SAFE_X + Inches(0.5), hero_y + Inches(0.3),
               Inches(1.0), WHITE)
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.5), hero_y + Inches(0.3),
                         Inches(1.0), Inches(1.0),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, "🎯", size=48, color=PURPLE,
             align=PP_ALIGN.CENTER, first=True)

    # decorative right
    add_circle(slide, SAFE_X + SAFE_W - Inches(1.5), hero_y + Inches(0.3),
               Inches(1.0), WHITE)
    tb, tf = add_textbox(slide, SAFE_X + SAFE_W - Inches(1.5),
                         hero_y + Inches(0.3),
                         Inches(1.0), Inches(1.0),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, "📜", size=44, color=PURPLE,
             align=PP_ALIGN.CENTER, first=True)

    tb, tf = add_textbox(slide, SAFE_X + Inches(1.7), hero_y + Inches(0.25),
                         SAFE_W - Inches(3.4), Inches(1.0),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf, "FocusProof", size=68, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True, space_after=2)

    tb, tf = add_textbox(slide, SAFE_X + Inches(0.5), hero_y + Inches(1.25),
                         SAFE_W - Inches(1.0), Inches(0.55))
    add_para(tf, "TẬP TRUNG THÔNG MINH  ·  CHỨNG MINH BẰNG DỮ LIỆU",
             size=24, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True)

    # Small tagline pills
    tag_y = hero_y + Inches(1.85)
    pills = [
        ("🔒 100% Local", HOT_PINK),
        ("🤖 AI Coaching", AMBER),
        ("✅ Verified PDF", GREEN),
    ]
    pill_w = Inches(2.5); pill_h = Inches(0.5)
    total_w = pill_w * len(pills) + Inches(0.3) * (len(pills) - 1)
    pill_x = SAFE_X + (SAFE_W - total_w) / 2
    for txt, col in pills:
        add_pill(slide, pill_x, tag_y, pill_w, pill_h, WHITE, txt,
                 size=15, color=col, bold=True)
        pill_x += pill_w + Inches(0.3)

    # ============================================================
    # ROW 1  (~9.85" - 14.45")  --  Problem  |  Solution (3-Signal)
    # ============================================================
    row1_y = Inches(9.85)
    row1_h = Inches(4.6)

    # ----- LEFT: Vấn đề (Problem) -----
    px, py, pw = SAFE_X, row1_y, col_w
    add_round_card(slide, px, py, pw, row1_h, BABY_PINK, radius=0.06)
    inner_y = add_section_header(slide, px + Inches(0.4), py + Inches(0.25),
                                  pw - Inches(0.8),
                                  number="1", title="VẤN ĐỀ",
                                  accent=HOT_PINK, emoji="😩")

    # 3 problem chibi cards
    card_y = inner_y + Inches(0.15)
    items = [
        ("😵‍💫", "Khó đo khách quan",
         "Tự nhận tập trung — không có dữ liệu",
         HOT_PINK),
        ("🤔", "Khó chứng minh",
         "Không có gì cho GV / sếp / khách",
         ORANGE),
        ("🕵️", "Spyware xâm phạm",
         "Hubstaff/Time Doctor: screenshot, keylog",
         RED),
    ]
    item_h = (row1_h - Inches(1.7)) / 3
    for emo, title, desc, col in items:
        add_round_card(slide, px + Inches(0.4), card_y,
                       pw - Inches(0.8), item_h - Inches(0.15),
                       WHITE, radius=0.18, shadow=False)
        add_circle(slide, px + Inches(0.55), card_y + Inches(0.15),
                   Inches(0.9), col)
        tb, tf = add_textbox(slide, px + Inches(0.55), card_y + Inches(0.15),
                             Inches(0.9), Inches(0.9),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, emo, size=32, color=WHITE, align=PP_ALIGN.CENTER, first=True)
        tb, tf = add_textbox(slide, px + Inches(1.6), card_y + Inches(0.15),
                             pw - Inches(2.0), item_h - Inches(0.45),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, title, size=18, bold=True, color=DARK, first=True,
                 space_after=2)
        add_para(tf, desc, size=14, color=DARK2, space_after=0)
        card_y += item_h

    # ----- RIGHT: Giải pháp (3-Signal Detection) -----
    sx = SAFE_X + col_w + col_gap
    sy = row1_y
    add_round_card(slide, sx, sy, col_w, row1_h, LAVENDER, radius=0.06)
    inner_y = add_section_header(slide, sx + Inches(0.4), sy + Inches(0.25),
                                  col_w - Inches(0.8),
                                  number="2", title="GIẢI PHÁP",
                                  accent=PURPLE, emoji="✨")
    tb, tf = add_textbox(slide, sx + Inches(0.4), inner_y + Inches(0.05),
                         col_w - Inches(0.8), Inches(0.5))
    add_para(tf, "3-Signal Focus Detection — duy nhất trên thị trường",
             size=15, italic=True, color=PURPLE,
             align=PP_ALIGN.CENTER, bold=True, first=True)
    # Fit 3-signal diagram inside available area (avoid overflow)
    avail_w = col_w - Inches(0.8)
    avail_h = row1_h - (inner_y - sy) - Inches(0.85)
    # diagram aspect ~ 2.0 (w/h)
    img_w = avail_w
    img_h = img_w / 2.0
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * 2.0
    img_x = sx + (col_w - img_w) / 2
    img_y = inner_y + Inches(0.55) + (avail_h - img_h) / 2
    add_image(slide, DIAG / "three_signals.png", img_x, img_y, w=img_w)

    # ============================================================
    # ROW 2  (~14.65" - 18.55")  --  How it Works (User Journey)
    # ============================================================
    row2_y = Inches(14.65)
    row2_h = Inches(3.9)
    add_round_card(slide, SAFE_X, row2_y, SAFE_W, row2_h, MINT, radius=0.04)
    inner_y = add_section_header(slide, SAFE_X + Inches(0.5),
                                  row2_y + Inches(0.25),
                                  SAFE_W - Inches(1.0),
                                  number="3", title="CÁCH HOẠT ĐỘNG  ·  6 BƯỚC",
                                  accent=GREEN, emoji="🚀")
    # Journey image aspect ~ 7:1
    avail_w = SAFE_W - Inches(1.2)
    avail_h = row2_h - (inner_y - row2_y) - Inches(0.4)
    img_w = avail_w
    img_h = img_w / 7.0
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * 7.0
    img_x = SAFE_X + (SAFE_W - img_w) / 2
    img_y = inner_y + Inches(0.1) + (avail_h - img_h) / 2
    add_image(slide, DIAG / "journey.png", img_x, img_y, w=img_w)

    # ============================================================
    # ROW 3  (~18.85" - 23.25")  --  Features bento grid
    # ============================================================
    row3_y = Inches(18.85)
    row3_h = Inches(4.4)
    add_round_card(slide, SAFE_X, row3_y, SAFE_W, row3_h, SOFT_BG, radius=0.04)
    inner_y = add_section_header(slide, SAFE_X + Inches(0.5),
                                  row3_y + Inches(0.25),
                                  SAFE_W - Inches(1.0),
                                  number="4", title="ĐIỂM KHÁC BIỆT",
                                  accent=AMBER, emoji="💎")

    bento_y = inner_y + Inches(0.15)
    bento_h = row3_h - Inches(1.4)
    bento = [
        # row1
        [
            ("🔒", "100% LOCAL",
             "Camera & AI nhận diện chạy ngay trong trình duyệt — không upload ảnh/video.",
             PURPLE, LAVENDER),
            ("📜", "VERIFIED CERT",
             "Chứng chỉ PDF có QR + chữ ký SHA-256 — không thể giả mạo.",
             GREEN, MINT),
            ("🤖", "AI COACHING",
             "GPT-4o phân tích pattern song ngữ Việt-Anh, gợi ý cải thiện.",
             HOT_PINK, BABY_PINK),
        ],
        # row2
        [
            ("🎯", "GOAL-BASED",
             "4 mode (Study/Work/Code/Lecture) + custom domain whitelist.",
             AMBER, CREAM),
            ("🏅", "GAMIFICATION",
             "10 huy hiệu + streak + leaderboard giữ động lực mỗi ngày.",
             ORANGE, PEACH),
            ("💸", "GIÁ RẺ NHẤT",
             "$4.99/tháng — bằng 1/2 RescueTime, gấp đôi giá trị.",
             CYAN, SKY),
        ],
    ]
    cell_w = (SAFE_W - Inches(1.0) - Inches(0.6)) / 3
    cell_h = (bento_h - Inches(0.3)) / 2
    cy = bento_y
    for row in bento:
        cx = SAFE_X + Inches(0.5)
        for emo, title, desc, accent, bg in row:
            add_round_card(slide, cx, cy, cell_w, cell_h - Inches(0.1),
                           bg, radius=0.1, shadow=False)
            # left emoji circle
            add_circle(slide, cx + Inches(0.3), cy + Inches(0.3),
                       Inches(1.0), accent)
            tb, tf = add_textbox(slide, cx + Inches(0.3), cy + Inches(0.3),
                                 Inches(1.0), Inches(1.0),
                                 anchor=MSO_ANCHOR.MIDDLE)
            add_para(tf, emo, size=36, color=WHITE,
                     align=PP_ALIGN.CENTER, first=True)
            tb, tf = add_textbox(slide, cx + Inches(1.45), cy + Inches(0.3),
                                 cell_w - Inches(1.65), cell_h - Inches(0.5),
                                 anchor=MSO_ANCHOR.TOP)
            add_para(tf, title, size=18, bold=True, color=accent,
                     first=True, space_after=4)
            add_para(tf, desc, size=12, color=DARK2, space_after=2)
            cx += cell_w + Inches(0.3)
        cy += cell_h

    # ============================================================
    # ROW 4  (~23.55" - 28.05")  --  Pricing tiers + Architecture
    # ============================================================
    row4_y = Inches(23.55)
    row4_h = Inches(4.5)

    # ----- LEFT: PRICING -----
    add_round_card(slide, SAFE_X, row4_y, col_w, row4_h, CREAM, radius=0.06)
    inner_y = add_section_header(slide, SAFE_X + Inches(0.4),
                                  row4_y + Inches(0.25),
                                  col_w - Inches(0.8),
                                  number="5", title="MÔ HÌNH KINH DOANH",
                                  accent=AMBER, emoji="💰")
    tier_y = inner_y + Inches(0.1)
    tier_h = row4_h - Inches(1.5)
    tiers = [
        ("🆓 FREE", "0₫",
         ["✓ Session cơ bản",
          "✓ Face + Activity + Tab",
          "✓ Cert PDF cơ bản",
          "🎁 7-day trial Pro",
          "💎 100 Credit"], GRAY),
        ("⭐ PRO", "$4.99/tháng",
         ["✓ AI Unlimited",
          "✓ PDF nâng cao + Charts",
          "✓ Export CSV/Excel",
          "✓ Priority Email",
          "✓ +50 Credit/referral"], PURPLE),
        ("🏢 TEAM", "$3.99/người",
         ["✓ Mọi tính năng Pro",
          "✓ Team Dashboard",
          "✓ Báo cáo nhóm",
          "✓ Custom Branding",
          "✓ Chat support"], CYAN),
    ]
    tier_w = (col_w - Inches(1.0)) / 3
    tier_x = SAFE_X + Inches(0.4)
    for name, price, feats, col in tiers:
        is_pro = "PRO" in name
        # White card body
        card_sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                         tier_x, tier_y, tier_w, tier_h)
        card_sh.fill.solid(); card_sh.fill.fore_color.rgb = WHITE
        if is_pro:
            card_sh.line.color.rgb = col
            card_sh.line.width = Pt(3.5)
        else:
            card_sh.line.color.rgb = GRAY_LIGHT
            card_sh.line.width = Pt(0.75)
        card_sh.shadow.inherit = False
        try:
            card_sh.adjustments[0] = 0.1
        except Exception:
            pass
        # header band
        add_gradient_round(slide, tier_x, tier_y,
                           tier_w, Inches(0.65),
                           c1=col, c2=col, radius=0.18)
        tb, tf = add_textbox(slide, tier_x, tier_y, tier_w, Inches(0.65),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, name, size=17, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        # "POPULAR" pill on PRO
        if is_pro:
            pill_w = Inches(1.1); pill_h = Inches(0.32)
            add_pill(slide,
                     tier_x + (tier_w - pill_w) / 2,
                     tier_y - pill_h / 2,
                     pill_w, pill_h, AMBER, "★ POPULAR",
                     size=10, color=WHITE, bold=True)
        # price
        tb, tf = add_textbox(slide, tier_x + Inches(0.05),
                             tier_y + Inches(0.78),
                             tier_w - Inches(0.1), Inches(0.5))
        add_para(tf, price, size=18, bold=True, color=DARK,
                 align=PP_ALIGN.CENTER, first=True)
        # features
        tb, tf = add_textbox(slide, tier_x + Inches(0.15),
                             tier_y + Inches(1.3),
                             tier_w - Inches(0.3), tier_h - Inches(1.4))
        first = True
        for line in feats:
            add_para(tf, line, size=10.5, color=DARK2,
                     space_after=2, first=first)
            first = False
        tier_x += tier_w + Inches(0.2)

    # tagline below tiers
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4),
                         row4_y + row4_h - Inches(0.5),
                         col_w - Inches(0.8), Inches(0.3))
    add_para(tf,
             "Hòa vốn tháng 4-5  ·  Gross margin 85%  ·  LTV/CAC ≈ 40×",
             size=12, italic=True, color=GRAY,
             align=PP_ALIGN.CENTER, first=True, bold=True)

    # ----- RIGHT: ARCHITECTURE -----
    ax = SAFE_X + col_w + col_gap
    add_round_card(slide, ax, row4_y, col_w, row4_h, SKY, radius=0.06)
    inner_y = add_section_header(slide, ax + Inches(0.4),
                                  row4_y + Inches(0.25),
                                  col_w - Inches(0.8),
                                  number="6", title="KIẾN TRÚC HỆ THỐNG",
                                  accent=CYAN, emoji="🏗️")
    # Architecture aspect ~ 1.7:1 (wide). Fit by height.
    avail_w = col_w - Inches(0.6)
    avail_h = row4_h - (inner_y - row4_y) - Inches(0.4)
    img_w = avail_w
    img_h = img_w / 1.7
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * 1.7
    img_x = ax + (col_w - img_w) / 2
    img_y = inner_y + Inches(0.1) + (avail_h - img_h) / 2
    add_image(slide, DIAG / "architecture.png", img_x, img_y, w=img_w)

    # ============================================================
    # ROW 5  (~28.35" - 31.45")  --  Compete vs others + Tech stack
    # ============================================================
    row5_y = Inches(28.35)
    row5_h = Inches(3.1)

    # LEFT: comparison
    add_round_card(slide, SAFE_X, row5_y, col_w, row5_h, BABY_PINK, radius=0.06)
    inner_y = add_section_header(slide, SAFE_X + Inches(0.4),
                                  row5_y + Inches(0.25),
                                  col_w - Inches(0.8),
                                  number="7", title="VS ĐỐI THỦ",
                                  accent=HOT_PINK, emoji="⚔️")
    # Compare aspect ~ 4:1 (wide horizontal layout)
    avail_w = col_w - Inches(0.6)
    avail_h = row5_h - (inner_y - row5_y) - Inches(0.3)
    img_w = avail_w
    img_h = img_w / 4.0
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * 4.0
    img_x = SAFE_X + (col_w - img_w) / 2
    img_y = inner_y + Inches(0.05) + (avail_h - img_h) / 2
    add_image(slide, DIAG / "compare.png", img_x, img_y, w=img_w)

    # RIGHT: tech stack
    tx = SAFE_X + col_w + col_gap
    add_round_card(slide, tx, row5_y, col_w, row5_h, MINT, radius=0.06)
    inner_y = add_section_header(slide, tx + Inches(0.4),
                                  row5_y + Inches(0.25),
                                  col_w - Inches(0.8),
                                  number="8", title="CÔNG NGHỆ",
                                  accent=GREEN, emoji="⚙️")
    techs = [
        ("⚛️", "React 19 + TS",   PURPLE),
        ("🧩", "Chrome MV3",      INDIGO),
        ("👁️", "MediaPipe BlazeFace", HOT_PINK),
        ("🤖", "GPT-4o-mini",     AMBER),
        ("☁️", "Supabase + RLS",  CYAN),
        ("💳", "Stripe Checkout", GREEN),
    ]
    grid_x = tx + Inches(0.4)
    grid_y = inner_y + Inches(0.05)
    grid_w = col_w - Inches(0.8)
    cell_w_t = (grid_w - Inches(0.3)) / 3
    cell_h_t = (row5_h - Inches(1.3)) / 2
    for i, (emo, name, col) in enumerate(techs):
        cx = grid_x + (cell_w_t + Inches(0.15)) * (i % 3)
        cy = grid_y + (cell_h_t + Inches(0.1)) * (i // 3)
        add_round_card(slide, cx, cy, cell_w_t, cell_h_t,
                       WHITE, radius=0.18, shadow=False)
        add_circle(slide, cx + Inches(0.15), cy + Inches(0.1),
                   cell_h_t - Inches(0.2), col)
        tb, tf = add_textbox(slide, cx + Inches(0.15), cy + Inches(0.1),
                             cell_h_t - Inches(0.2),
                             cell_h_t - Inches(0.2),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, emo, size=22, color=WHITE,
                 align=PP_ALIGN.CENTER, first=True)
        tb, tf = add_textbox(slide,
                             cx + cell_h_t - Inches(0.05),
                             cy + Inches(0.05),
                             cell_w_t - cell_h_t + Inches(0.1),
                             cell_h_t - Inches(0.1),
                             anchor=MSO_ANCHOR.MIDDLE)
        add_para(tf, name, size=12.5, bold=True, color=DARK,
                 first=True)

    # ============================================================
    # FOOTER BAND  (~31.55" - 32.95")
    # ============================================================
    foot_y = Inches(31.55)
    foot_h = Inches(1.4)
    add_gradient_round(slide, SAFE_X, foot_y, SAFE_W, foot_h,
                       c1=CYAN, c2=PURPLE, radius=0.06)
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4),
                         foot_y + Inches(0.15),
                         SAFE_W - Inches(0.8), Inches(0.7),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf,
             "✦  TẬP TRUNG  ·  CHỨNG MINH  ·  TIẾN BỘ THẬT  ✦",
             size=38, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, first=True)
    tb, tf = add_textbox(slide, SAFE_X + Inches(0.4),
                         foot_y + Inches(0.85),
                         SAFE_W - Inches(0.8), Inches(0.5),
                         anchor=MSO_ANCHOR.MIDDLE)
    add_para(tf,
             "Ngô Bình Minh  ·  524H0169  ·  Khoa CNTT TDTU  ·  "
             "TECH STARTUP CHALLENGER 2026  ·  focusproof.com",
             size=14, color=WHITE, italic=True,
             align=PP_ALIGN.CENTER, first=True)


# ============================================================
# Main
# ============================================================
def main():
    print("=" * 70)
    print("  FocusProof - Poster v2 (Chibi / Cartoon)")
    print("=" * 70)

    diagrams = [
        ("three_signals", DIAGRAM_THREE_SIGNALS),
        ("journey",       DIAGRAM_JOURNEY),
        ("architecture",  DIAGRAM_ARCHITECTURE),
        ("compare",       DIAGRAM_COMPARE),
    ]
    for i, (name, code) in enumerate(diagrams, 1):
        print(f"\n[{i}/{len(diagrams)+1}] Render '{name}.png' ...")
        p = render_mermaid(name, code, force=True)
        if p.exists():
            print(f"   [OK] {p.name} ({p.stat().st_size // 1024} KB)")
        else:
            print(f"   [FAIL] {name}")

    print(f"\n[{len(diagrams)+1}/{len(diagrams)+1}] Open template & build poster ...")
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
