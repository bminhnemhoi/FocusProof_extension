# -*- coding: utf-8 -*-
"""
==============================================================================
FocusProof v1.1 - Generate Startup Pitch DOCX (FINAL - Template-driven)
TECH STARTUP CHALLENGER 2026 - Khoa CNTT, DH Ton Duc Thang
Tac gia: Ngo Binh Minh - MSSV 524H0169
==============================================================================
Cach lam:
  1. Render 4 so do Mermaid -> PNG (mermaid.ink + kroki fallback)
  2. Ve Business Model Canvas bang PIL (chuan 9 khoi)
  3. Mo MauTrinhBayDuAn.docx, dien truc tiep:
       - Trang bia (Table 0)
       - Thong tin ca nhan (P004-P008)
       - Bang thanh vien (Table 1)
       - BMC table (Table 2) - dien 9 o
       - Tom tat du an (P014, P015)
       - Thay TUNG bullet placeholder bang noi dung chi tiet
       - Chen bang phu (rui ro, tai chinh, marketing) sau cac section
  4. Phu luc cuoi: 4 so do Mermaid + BMC PNG
==============================================================================
"""
from __future__ import annotations
import base64
import sys
import time
import zlib
from pathlib import Path

import requests
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).parent
TEMPLATE = BASE_DIR / "MauTrinhBayDuAn.docx"
OUTPUT = BASE_DIR / "FocusProof_Startup_Pitch_v1.1.docx"
IMG_DIR = BASE_DIR / "_diagrams"
IMG_DIR.mkdir(exist_ok=True)

INFO = {
    "project_name": "FocusProof - Chứng chỉ Tập trung Thông minh & Xác thực",
    "field": "Công nghệ Thông tin / SaaS / Productivity Tools",
    "author_name": "Ngô Bình Minh",
    "student_id": "524H0169",
    "khoa": "Công nghệ Thông tin",
    "year": "—",
    "phone": "—",
    "email": "—",
    "submit_month": "04",
    "submit_year": "2026",
    "submit_date": "18/04/2026",
}

FONT_NAME = "Times New Roman"
FONT_SIZE = Pt(13)
PRIMARY = RGBColor(0x1F, 0x4E, 0x79)

# ============================================================================
# 4 SO DO MERMAID - thiet ke chuyen biet cho FocusProof
# ============================================================================
MERMAID_DIAGRAMS = {
    # 1. Kien truc he thong v1.1 day du
    "architecture": """flowchart LR
    subgraph EXT["Chrome Extension MV3"]
        POPUP["Popup React 19<br/>(StartScreen / Running / Result / History)"]
        BG["Background<br/>Service Worker"]
        OFF["Offscreen Document<br/>Camera + MediaPipe BlazeFace WASM"]
        CS["Content Script<br/>Floating Widget"]
        STG[("chrome.storage.local<br/>session, plan, credit cache")]
    end
    subgraph SB["Supabase Backend"]
        AUTH["Auth - JWT + Email"]
        DB[("PostgreSQL<br/>users, credits, license,<br/>referrals, sessions<br/>+ Row Level Security")]
        EDGE["Edge Functions<br/>/credits, /license,<br/>/referral, /webhook"]
    end
    subgraph WEB["Web App - Next.js 14 + Vercel"]
        LAND["Landing Page"]
        PRICE["Pricing Page<br/>(3 cot)"]
        DASH["Team Dashboard"]
    end
    PAY["Stripe / LemonSqueezy"]
    AI["OpenAI GPT-4o-mini"]
    USER(["Người dùng cuối"]) --> POPUP
    POPUP <--> BG
    BG <--> OFF
    BG <--> CS
    BG <--> STG
    BG -- "HTTPS + JWT" --> EDGE
    BG -- "REST" --> AI
    EDGE <--> DB
    EDGE <--> AUTH
    USER --> LAND
    LAND --> PRICE
    PRICE --> PAY
    PAY -- "Webhook signed" --> EDGE
    USER --> DASH
    DASH --> EDGE
    classDef ext fill:#1F4E79,color:#fff,stroke:#0F2E59
    classDef back fill:#22C55E,color:#fff,stroke:#15803D
    classDef web fill:#F59E0B,color:#fff,stroke:#B45309
    classDef ext3 fill:#8B5CF6,color:#fff,stroke:#6D28D9
    class POPUP,BG,OFF,CS,STG ext
    class AUTH,DB,EDGE back
    class LAND,PRICE,DASH web
    class PAY,AI,USER ext3
""",
    # 2. Core Engine - 3-Signal Focus Detection (USP)
    "focus_engine": """flowchart TB
    SES(["Session bắt đầu"]) --> COL["Thu thập 3 tín hiệu<br/>mỗi 1 giây (sample)"]
    COL --> S1["Tín hiệu 1 - FACE<br/>MediaPipe BlazeFace<br/>(local, không upload)"]
    COL --> S2["Tín hiệu 2 - ACTIVITY<br/>Keyboard + Mouse<br/>(IME-aware)"]
    COL --> S3["Tín hiệu 3 - TAB<br/>chrome.tabs.onActivated<br/>+ allowed domains"]
    S1 --> EVAL["Goal Evaluator<br/>theo task mode<br/>(study / work / coding /<br/>video-lecture)"]
    S2 --> EVAL
    S3 --> EVAL
    EVAL --> SCORE["Focus Score 0-100<br/>+ Compliance<br/>(Focused / Partial / Off)"]
    SCORE --> RES["Result Screen<br/>+ Pie Chart"]
    RES --> AI{"User chọn<br/>AI Analysis?"}
    AI -- "Có" --> GPT["Gọi GPT-4o-mini<br/>tóm tắt + đề xuất<br/>(20 Credit nếu Free)"]
    AI -- "Không" --> PDF
    GPT --> PDF["PDF Certificate 2 trang<br/>+ QR + SHA-256 hash"]
    PDF --> SAVE[("Lưu lịch sử<br/>Streak +1")]
    classDef start fill:#1F4E79,color:#fff
    classDef sig fill:#22C55E,color:#fff
    classDef proc fill:#F59E0B,color:#fff
    classDef out fill:#8B5CF6,color:#fff
    class SES,COL start
    class S1,S2,S3 sig
    class EVAL,SCORE,GPT proc
    class RES,PDF,SAVE,AI out
""",
    # 3. User Journey + Monetization Funnel
    "monetization": """flowchart TB
    A(["Người dùng tiềm năng<br/>SV / Freelancer / Remote worker"]) --> B["Cài Extension<br/>từ Chrome Web Store"]
    B --> C["Đăng ký<br/>(+100 Credit, Trial 7 ngày<br/>full Pro features)"]
    C --> D["Sử dụng đầy đủ<br/>(7 ngày)"]
    D --> E{"Hết Trial?"}
    E -- "Chưa" --> D
    E -- "Rồi" --> F["Tự động về Free<br/>còn ~80 Credit"]
    F --> G["Dùng AI = -20 Credit<br/>Trend = -50 Credit"]
    G --> H{"Hết Credit?"}
    H -- "Chưa" --> G
    H -- "Rồi" --> I["Popup CREDIT EXHAUSTED<br/>3 lựa chọn"]
    I --> J["Mời bạn<br/>+20 Credit/người<br/>(viral loop)"]
    I --> K["Nâng cấp Pro<br/>$4.99/tháng"]
    I --> L["Nâng cấp Team<br/>$3.99/seat (≥5)"]
    J --> A
    K --> M["MRR<br/>Gross margin 85%"]
    L --> M
    M --> N["Tái đầu tư:<br/>Marketing + Product + Hosting"]
    N --> A
    classDef user fill:#1F4E79,color:#fff
    classDef free fill:#22C55E,color:#fff
    classDef warn fill:#F59E0B,color:#fff
    classDef paid fill:#EF4444,color:#fff
    classDef rev fill:#8B5CF6,color:#fff
    class A,B,C user
    class D,F,G free
    class E,H,I warn
    class J,K,L paid
    class M,N rev
""",
    # 4. Credit Deduction Sequence (server-side, anti-fraud)
    "credit_sequence": """sequenceDiagram
    autonumber
    actor U as Người dùng
    participant E as Extension
    participant S as Supabase Edge Function
    participant DB as PostgreSQL
    participant AI as OpenAI GPT-4o-mini
    U->>E: Nhấn "AI Analysis (20 Credit)"
    E->>E: Hiện dialog xác nhận
    U->>E: Xác nhận
    E->>S: POST /credits/deduct<br/>(JWT + idempotency_key)
    S->>S: Verify JWT
    S->>DB: SELECT plan, credits, trial_end
    alt Pro / Team
        S-->>E: OK (free, không trừ)
    else Free + còn Trial
        S-->>E: OK (free, không trừ)
    else Free + đủ Credit
        S->>DB: BEGIN TX<br/>UPDATE credits = credits - 20<br/>INSERT credit_transactions<br/>COMMIT
        S-->>E: OK (balance: 60)
    else Free + thiếu Credit
        S-->>E: 402 INSUFFICIENT_CREDITS
        E->>U: Hiện popup mua / mời bạn
    end
    E->>AI: POST /v1/chat/completions
    AI-->>E: Phân tích + đề xuất
    E->>U: Hiển thị + tạo PDF + cập nhật history
""",
}


# ============================================================================
# RENDER MERMAID -> PNG
# ============================================================================
def render_mermaid(name: str, code: str) -> Path:
    out = IMG_DIR / f"{name}.png"
    if out.exists() and out.stat().st_size > 5000:
        print(f"   [cache ] {out.name}")
        return out
    encoded = base64.urlsafe_b64encode(code.encode("utf-8")).decode("ascii")
    urls = [
        f"https://mermaid.ink/img/{encoded}?type=png&bgColor=FFFFFF",
        f"https://mermaid.ink/img/{encoded}?type=png",
    ]
    for attempt in range(3):
        for url in urls:
            try:
                r = requests.get(url, timeout=30)
                if r.status_code == 200 and len(r.content) > 5000:
                    out.write_bytes(r.content)
                    print(f"   [mermaid] {out.name} ({len(r.content)//1024} KB)")
                    return out
            except Exception:
                pass
        time.sleep(2)
    # Kroki fallback
    try:
        comp = zlib.compress(code.encode("utf-8"), 9)
        kenc = base64.urlsafe_b64encode(comp).decode("ascii")
        r = requests.get(f"https://kroki.io/mermaid/png/{kenc}", timeout=30)
        if r.status_code == 200 and len(r.content) > 1000:
            out.write_bytes(r.content)
            print(f"   [kroki  ] {out.name} ({len(r.content)//1024} KB)")
            return out
    except Exception as e:
        print(f"   [kroki fail] {e}")
    raise RuntimeError(f"Khong render duoc diagram: {name}")


# ============================================================================
# VE BUSINESS MODEL CANVAS BANG PIL (CHUAN 9 KHOI - PHU LUC)
# ============================================================================
def draw_bmc_canvas(out_path: Path):
    W, H = 2400, 1700
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    def font(sz, bold=False):
        for p in [
            "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
            "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        ]:
            try:
                return ImageFont.truetype(p, sz)
            except Exception:
                continue
        return ImageFont.load_default()

    F_TITLE = font(38, True)
    F_HEAD = font(22, True)
    F_BODY = font(18)

    BORDER = (40, 40, 40)
    HEAD_BG = (31, 78, 121)
    HEAD_FG = (255, 255, 255)
    BODY_BG = (250, 250, 250)
    BODY_FG = (30, 30, 30)
    COST_BG = (254, 226, 226)
    REV_BG = (220, 252, 231)
    VP_BG = (217, 119, 6)

    title = "BUSINESS MODEL CANVAS - FOCUSPROOF v1.1"
    bb = d.textbbox((0, 0), title, font=F_TITLE)
    d.text(((W - (bb[2] - bb[0])) // 2, 18), title, fill=HEAD_BG, font=F_TITLE)

    TOP = 95
    BOT = H - 25
    ROW3_H = 300
    ROW12_BOT = BOT - ROW3_H
    COL_W = W // 5
    cols = [0, COL_W, COL_W * 2, COL_W * 3, COL_W * 4, W]

    def box(x1, y1, x2, y2, head, body, head_bg=HEAD_BG, body_bg=BODY_BG):
        head_h = 54
        d.rectangle([x1, y1, x2, y1 + head_h], fill=head_bg, outline=BORDER, width=2)
        bb = d.textbbox((0, 0), head, font=F_HEAD)
        d.text((x1 + (x2 - x1 - (bb[2] - bb[0])) // 2, y1 + 14), head,
               fill=HEAD_FG, font=F_HEAD)
        d.rectangle([x1, y1 + head_h, x2, y2], fill=body_bg, outline=BORDER, width=2)
        ty = y1 + head_h + 10
        for ln in body.strip().split("\n"):
            d.text((x1 + 12, ty), ln, fill=BODY_FG, font=F_BODY)
            ty += 24
            if ty > y2 - 18:
                break

    BMC = {
        "KP": ("KEY PARTNERS",
               "- Khoa CNTT - DH\n  Ton Duc Thang\n  (bao tro hoc thuat)\n"
               "- Supabase, Vercel\n  (ha tang free tier)\n"
               "- Stripe / LemonSqueezy\n  (thanh toan)\n"
               "- OpenAI (GPT-4o-mini)\n"
               "- Google MediaPipe\n  (face detection)\n"
               "- Cong dong\n  productivity Viet Nam"),
        "KA": ("KEY ACTIVITIES",
               "- Phat trien Chrome\n  Extension MV3\n"
               "- Van hanh Supabase\n  backend + Edge Fn\n"
               "- Toi uu AI prompt\n"
               "- Marketing noi dung\n"
               "- Customer support\n"
               "- Anti-fraud monitoring"),
        "KR": ("KEY RESOURCES",
               "- Codebase v1.0\n  hoan thien (TS+React)\n"
               "- Supabase + OpenAI\n  account\n"
               "- Domain\n  focusproof.com\n"
               "- Brand & cong dong\n"
               "- Founder fulltime"),
        "VP": ("VALUE PROPOSITIONS",
               "- Do tap trung KHACH QUAN\n"
               "  qua 3 tin hieu:\n"
               "  Camera + Activity + Tab\n"
               "\n"
               "- Chung chi PDF + QR\n"
               "  + SHA-256 XAC THUC\n"
               "  duy nhat thi truong\n"
               "\n"
               "- AI ca nhan hoa\n"
               "  qua GPT-4o-mini\n"
               "\n"
               "- 100% PRIVACY-FIRST\n"
               "  Xu ly local hoan toan\n"
               "  (khong screenshot,\n  khong keylog)\n"
               "\n"
               "- Pro $4.99/thang\n"
               "  (doi thu $9-14)"),
        "CR": ("CUSTOMER RELATIONSHIPS",
               "- Self-service\n  (extension + web)\n"
               "- Email support (Pro)\n"
               "- Chat support (Team)\n"
               "- Discord / FB Group\n"
               "- Gamification\n  (streak + badge)"),
        "CH": ("CHANNELS",
               "- Chrome Web Store\n  (kenh chinh)\n"
               "- Website\n  focusproof.com\n"
               "- Product Hunt launch\n"
               "- Reddit r/productivity\n"
               "- TikTok / YouTube\n"
               "- Referral viral loop"),
        "CS": ("CUSTOMER SEGMENTS",
               "- Sinh vien hoc online\n  (DH, Coursera, Udemy)\n"
               "\n"
               "- Freelancer can chung minh\n  gio lam (UpWork, Fiverr)\n"
               "\n"
               "- Lap trinh vien,\n  remote worker\n"
               "\n"
               "- To chuc giao duc\n  (truong DH, trung tam)\n"
               "\n"
               "- Doanh nghiep SME\n  remote-first"),
        "COST": ("COST STRUCTURE",
                 "- CAPEX one-time: ~$67 (domain $12, design $50, Chrome dev fee $5)\n"
                 "- OPEX: $6/thang (early) -> $310/thang (scale M10-M12)\n"
                 "- Supabase $0-25/th  -  Vercel $0-20/th  -  OpenAI ~$5-60/th\n"
                 "- Stripe phi 2.9% + $0.30/giao dich  -  Marketing $0-150/th\n"
                 "- Tong chi phi nam 1: ~$1,525  -  Gross margin: ~85%"),
        "REV": ("REVENUE STREAMS",
                "- Pro Subscription: $4.99/thang HOAC $49/nam (-18%)\n"
                "- Team Subscription: $3.99/seat/thang (toi thieu 5 seat)\n"
                "- Custom Branding cho Team (logo + ten to chuc tren PDF)\n"
                "- Nam 1: $6,165 doanh thu - MRR cuoi nam $1,287\n"
                "- LTV/CAC ~40x  -  Hoa von thang 4 sau launch"),
    }

    box(cols[0], TOP, cols[1], ROW12_BOT, *BMC["KP"])
    mid = (TOP + ROW12_BOT) // 2
    box(cols[1], TOP, cols[2], mid, *BMC["KA"])
    box(cols[1], mid, cols[2], ROW12_BOT, *BMC["KR"])
    box(cols[2], TOP, cols[3], ROW12_BOT, *BMC["VP"], head_bg=VP_BG)
    box(cols[3], TOP, cols[4], mid, *BMC["CR"])
    box(cols[3], mid, cols[4], ROW12_BOT, *BMC["CH"])
    box(cols[4], TOP, cols[5], ROW12_BOT, *BMC["CS"])

    split = W * 3 // 5
    box(0, ROW12_BOT, split, BOT, *BMC["COST"], body_bg=COST_BG)
    box(split, ROW12_BOT, W, BOT, *BMC["REV"], body_bg=REV_BG)

    img.save(out_path, "PNG", dpi=(200, 200))
    print(f"   [PIL    ] {out_path.name} ({out_path.stat().st_size//1024} KB)")
    return out_path


# ============================================================================
# DOCX HELPERS
# ============================================================================
def _set_font(run, bold=False, size=FONT_SIZE, italic=False, color=None):
    run.font.name = FONT_NAME
    run.font.size = size
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    for k in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(k), FONT_NAME)


def clear_paragraph(p):
    """Xoa toan bo content cua paragraph (giu nguyen pPr)."""
    for child in list(p._element):
        if child.tag != qn("w:pPr"):
            p._element.remove(child)


def set_para_text(p, text, bold=False, italic=False, size=None, color=None,
                  align=None):
    clear_paragraph(p)
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    elif align == "left":
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    _set_font(run, bold=bold, italic=italic, size=size or FONT_SIZE, color=color)
    return p


def insert_paragraph_after(ref_para, text="", bold=False, italic=False,
                           size=None, color=None, align=None,
                           indent_cm=0, space_after=Pt(4)):
    """Chen mot paragraph moi NGAY SAU ref_para."""
    new_p = OxmlElement("w:p")
    ref_para._element.addnext(new_p)
    from docx.text.paragraph import Paragraph
    para = Paragraph(new_p, ref_para._parent)
    set_para_text(para, text, bold=bold, italic=italic, size=size, color=color,
                  align=align)
    if indent_cm:
        para.paragraph_format.left_indent = Cm(indent_cm)
    para.paragraph_format.space_after = space_after
    return para


def insert_paragraphs_after(ref_para, items):
    """Chen list cac paragraph sau ref_para. items = list of (text, kwargs)."""
    last = ref_para
    for text, kw in items:
        last = insert_paragraph_after(last, text, **kw)
    return last


def insert_table_after(ref_para, headers, rows, col_widths_cm=None):
    """Chen 1 table sau ref_para. Co border, header xanh, font Times 12pt."""
    from docx.text.paragraph import Paragraph
    # Tao spacer paragraph rong truoc table
    spacer = OxmlElement("w:p")
    ref_para._element.addnext(spacer)
    # Tao table XML
    tbl = OxmlElement("w:tbl")
    spacer.addnext(tbl)
    # tblPr
    tblPr = OxmlElement("w:tblPr")
    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), "5000"); tblW.set(qn("w:type"), "pct")
    tblPr.append(tblW)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f"w:{edge}")
        b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "4")
        b.set(qn("w:color"), "000000")
        borders.append(b)
    tblPr.append(borders)
    tbl.append(tblPr)
    # tblGrid
    tblGrid = OxmlElement("w:tblGrid")
    for _ in headers:
        gc = OxmlElement("w:gridCol"); tblGrid.append(gc)
    tbl.append(tblGrid)
    # Wrap into Table object
    from docx.table import Table
    table = Table(tbl, ref_para._parent)
    # Add header row
    hr = table.add_row()
    for i, h in enumerate(headers):
        cell = hr.cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(str(h))
        _set_font(run, bold=True, size=Pt(12), color=RGBColor(0xFF, 0xFF, 0xFF))
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "1F4E79")
        tcPr.append(shd)
    # Data rows
    for row_data in rows:
        rr = table.add_row()
        for i, val in enumerate(row_data):
            cell = rr.cells[i]
            cell.text = ""
            run = cell.paragraphs[0].add_run(str(val))
            _set_font(run, size=Pt(12))
    # Apply widths
    if col_widths_cm:
        for r in table.rows:
            for ci, w in enumerate(col_widths_cm):
                if ci < len(r.cells):
                    r.cells[ci].width = Cm(w)
    # Spacer after table
    after_spacer = OxmlElement("w:p")
    tbl.addnext(after_spacer)
    return Paragraph(after_spacer, ref_para._parent)


def fill_cell(cell, text, bold=False, size=Pt(12), align=None, fill=None,
              color=None):
    cell.text = ""
    p = cell.paragraphs[0]
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "left":
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    _set_font(run, bold=bold, size=size, color=color)
    if fill:
        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), fill)
        tcPr.append(shd)


def fill_cell_lines(cell, header, body_lines, fill=None, header_color="1F4E79"):
    """Cell co dong tieu de bold mau xanh + cac dong body normal."""
    cell.text = ""
    # Header
    p0 = cell.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r0 = p0.add_run(header)
    _set_font(r0, bold=True, size=Pt(11),
              color=RGBColor.from_string(header_color))
    # Body lines
    for line in body_lines:
        p = cell.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(line)
        _set_font(run, size=Pt(10))
    if fill:
        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), fill)
        tcPr.append(shd)


def add_image_after(ref_para, path: Path, width_cm=16, caption=None):
    """Chen 1 anh sau ref_para, can giua, kem caption italic."""
    img_para = insert_paragraph_after(ref_para, "", align="center")
    img_para.add_run().add_picture(str(path), width=Cm(width_cm))
    last = img_para
    if caption:
        last = insert_paragraph_after(img_para, caption, italic=True,
                                      size=Pt(11),
                                      color=RGBColor(0x55, 0x55, 0x55),
                                      align="center")
    return last


def find_para_by_text(doc, contains: str):
    """Tra ve paragraph dau tien co text chua chuoi."""
    for p in doc.paragraphs:
        if contains in p.text:
            return p
    return None


# ============================================================================
# MAIN
# ============================================================================
def main():
    print("=" * 70)
    print("  FocusProof v1.1 - Generate Startup Pitch DOCX")
    print(f"  Tac gia: {INFO['author_name']} - MSSV {INFO['student_id']}")
    print("=" * 70)

    # Step 1: Render Mermaid diagrams
    print("\n[1/4] Render 4 so do Mermaid...")
    images = {n: render_mermaid(n, code) for n, code in MERMAID_DIAGRAMS.items()}

    # Step 2: Draw BMC PNG (appendix)
    print("\n[2/4] Ve Business Model Canvas (PIL, 9 khoi)...")
    bmc_path = IMG_DIR / "bmc.png"
    draw_bmc_canvas(bmc_path)
    images["bmc"] = bmc_path

    # Step 3: Open template
    print(f"\n[3/4] Mo template {TEMPLATE.name}...")
    if not TEMPLATE.exists():
        print(f"   [ERROR] Khong tim thay {TEMPLATE}")
        sys.exit(1)
    doc = Document(str(TEMPLATE))

    # ------------------------------------------------------------------
    # 3.1 - Trang bia (Table 0)
    # ------------------------------------------------------------------
    print("   - Dien trang bia (Table 0)...")
    cover_tbl = doc.tables[0]
    cover_cell = cover_tbl.rows[0].cells[0]
    cover_cell.text = ""
    lines = [
        ("CUỘC THI Ý TƯỞNG KHỞI NGHIỆP", True, Pt(16), PRIMARY),
        ("TRONG LĨNH VỰC CÔNG NGHỆ THÔNG TIN", True, Pt(15), PRIMARY),
        ("\u201CTECH STARTUP CHALLENGER 2026\u201D", True, Pt(15), PRIMARY),
        ("", False, Pt(13), None),
        ("", False, Pt(13), None),
        (f"Tên dự án: {INFO['project_name']}", True, Pt(15),
            RGBColor(0xC0, 0x39, 0x2B)),
        (f"Thuộc lĩnh vực: {INFO['field']}", False, Pt(13), None),
        ("", False, Pt(13), None),
        (f"CÁ NHÂN THỰC HIỆN: {INFO['author_name'].upper()} "
            f"- MSSV {INFO['student_id']}", True, Pt(14), None),
        ("", False, Pt(13), None),
        ("", False, Pt(13), None),
        (f"TP. Hồ Chí Minh, tháng {INFO['submit_month']}/{INFO['submit_year']}",
            True, Pt(13), None),
    ]
    first = True
    for txt, bold, sz, color in lines:
        p = cover_cell.paragraphs[0] if first else cover_cell.add_paragraph()
        first = False
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(4)
        if txt:
            r = p.add_run(txt)
            _set_font(r, bold=bold, size=sz, color=color)

    # ------------------------------------------------------------------
    # 3.2 - Thong tin ca nhan (P004-P008)
    # ------------------------------------------------------------------
    print("   - Dien thong tin ca nhan...")
    for p in doc.paragraphs:
        t = p.text
        if "Họ và tên trưởng nhóm" in t:
            set_para_text(p, f"Họ và tên: {INFO['author_name']}    "
                          f"MSSV: {INFO['student_id']}", bold=True)
        elif "Khoa:" in t and "Sinh viên năm" in t:
            set_para_text(p, f"Khoa: {INFO['khoa']}        "
                          f"Sinh viên năm thứ: {INFO['year']}")
        elif t.strip().startswith("Số điện thoại"):
            set_para_text(p, f"Số điện thoại liên hệ: {INFO['phone']}")
        elif t.strip().startswith("Email"):
            set_para_text(p, f"Email: {INFO['email']}")

    # ------------------------------------------------------------------
    # 3.3 - Bang thanh vien (Table 1) - chi 1 nguoi
    # ------------------------------------------------------------------
    print("   - Dien bang thanh vien (1 nguoi - solo)...")
    if len(doc.tables) >= 2:
        mtbl = doc.tables[1]
        # Header row da co. Dien row 1, xoa rong cac row 2-4
        if len(mtbl.rows) >= 2:
            r1 = mtbl.rows[1]
            fill_cell(r1.cells[0], "1", align="center")
            fill_cell(r1.cells[1],
                      f"{INFO['author_name']} (Cá nhân thực hiện)", bold=True)
            fill_cell(r1.cells[2], INFO["khoa"])
            fill_cell(r1.cells[3], INFO["phone"], align="center")
            fill_cell(r1.cells[4], INFO["year"], align="center")
        # Cac row 2,3,4 - clear noi dung mau
        for ri in range(2, len(mtbl.rows)):
            for c in mtbl.rows[ri].cells:
                fill_cell(c, "")

    # ------------------------------------------------------------------
    # 3.4 - Tom tat du an (P014, P015)
    # ------------------------------------------------------------------
    print("   - Dien Tom tat du an (Y tuong + Mo ta)...")
    p_idea = find_para_by_text(doc, "Ý tưởng chính của dự án")
    if p_idea:
        set_para_text(p_idea, "Ý tưởng chính:", bold=True, color=PRIMARY)
        insert_paragraph_after(p_idea,
            "FocusProof là Chrome Extension đo lường mức độ tập trung khách quan "
            "qua 3 tín hiệu (Camera + Activity + Tab) và xuất chứng chỉ PDF có "
            "QR + hash SHA-256 xác thực được — sản phẩm DUY NHẤT trên thị trường "
            "giúp người học và làm việc từ xa CHỨNG MINH sự tập trung của mình.",
            align="justify")
    p_desc = find_para_by_text(doc, "Mô tả sản phẩm")
    if p_desc:
        set_para_text(p_desc, "Mô tả sản phẩm/dịch vụ và giá trị:",
                      bold=True, color=PRIMARY)
        insert_paragraph_after(p_desc,
            "FocusProof gồm 3 thành phần: (1) Chrome Extension MV3 tích hợp Core "
            "Engine kết hợp MediaPipe BlazeFace cho phát hiện khuôn mặt, Activity "
            "Tracking cho bàn phím/chuột (IME-aware) và Tab/Screen Tracking "
            "realtime cho trình duyệt, đánh giá theo mục tiêu cá nhân (study, "
            "work, programming, video-lecture); (2) Backend Supabase quản lý "
            "người dùng, hệ thống Credit, License Key, chống gian lận qua device "
            "fingerprint; (3) Trang web bán hàng (Pricing 3 cột) và Team "
            "Dashboard cho doanh nghiệp/giáo dục. Sản phẩm xuất chứng chỉ PDF 2 "
            "trang chuyên nghiệp với mã QR tự xác thực, phân tích AI cá nhân hóa "
            "(GPT-4o-mini) và biểu đồ trực quan. Toàn bộ dữ liệu phiên xử lý "
            "100% cục bộ — đặt quyền riêng tư lên hàng đầu, đối lập với phần "
            "mềm theo dõi xâm phạm như Hubstaff hay Time Doctor. Mô hình "
            "Freemium minh bạch (Free 7 ngày trial + 100 Credit, Pro $4.99/tháng, "
            "Team $3.99/seat/tháng) cho phép trải nghiệm đầy đủ trước khi nâng cấp.",
            align="justify")

    # ------------------------------------------------------------------
    # 3.5 - Business Model Canvas (Table 2) - dien 9 o
    # ------------------------------------------------------------------
    print("   - Dien Business Model Canvas (Table 2)...")
    if len(doc.tables) >= 3:
        bmc = doc.tables[2]
        # Layout sau khi merged:
        # R0C0=KP   R0C1=KA   R0C2=VP(merged 2x2) R0C4=CR   R0C5=CS
        # R1C0=KP'  R1C1=KR   (R1C2/3 = VP)        R1C4=CH   R1C5=CS'
        # R2C0=COST(merged C0-C2)                  R2C3=REV(merged C3-C5)

        fill_cell_lines(bmc.rows[0].cells[0],
            "ĐỐI TÁC CHÍNH (KEY PARTNERS)",
            ["• Khoa CNTT — ĐH Tôn Đức Thắng (bảo trợ học thuật, beta tester)",
             "• Supabase, Vercel (hạ tầng free tier)",
             "• Stripe / LemonSqueezy (thanh toán quốc tế)",
             "• OpenAI (GPT-4o-mini)",
             "• Google MediaPipe (face detection WASM)",
             "• Cộng đồng productivity Việt Nam"])
        fill_cell_lines(bmc.rows[0].cells[1],
            "HOẠT ĐỘNG CHÍNH (KEY ACTIVITIES)",
            ["• Phát triển Chrome Extension MV3 + web Next.js",
             "• Vận hành Supabase backend + Edge Functions",
             "• Tối ưu prompt AI",
             "• Marketing nội dung + cộng đồng",
             "• Customer support",
             "• Anti-fraud monitoring"])
        fill_cell_lines(bmc.rows[1].cells[1],
            "TÀI NGUYÊN CHÍNH (KEY RESOURCES)",
            ["• Codebase v1.0 hoàn thiện (TypeScript + React 19)",
             "• Tài khoản Supabase + OpenAI",
             "• Domain focusproof.com",
             "• Brand & cộng đồng",
             "• Founder làm fulltime"])
        fill_cell_lines(bmc.rows[0].cells[2],
            "GIẢI PHÁP GIÁ TRỊ (VALUE PROPOSITIONS)",
            ["• Đo tập trung KHÁCH QUAN qua 3 tín hiệu: Camera + Activity + Tab",
             "• Chứng chỉ PDF + QR + SHA-256 XÁC THỰC ĐƯỢC — DUY NHẤT thị trường",
             "• AI cá nhân hóa (GPT-4o-mini) — không chỉ thống kê mà đề xuất cải thiện",
             "• 100% PRIVACY-FIRST: xử lý local, không screenshot, không keylog",
             "• Goal-based Evaluation theo task mode (study/work/coding/video)",
             "• Pro $4.99/tháng — RẺ NHẤT phân khúc (đối thủ $9–14)"],
            fill="FFF4E6")
        fill_cell_lines(bmc.rows[0].cells[4],
            "QUAN HỆ KHÁCH HÀNG (CUSTOMER RELATIONSHIPS)",
            ["• Self-service (extension + website)",
             "• Email support cho Pro (≤24h)",
             "• Email + Chat support cho Team (≤4h)",
             "• Discord / Facebook Group cộng đồng",
             "• Gamification (streak + badges) giữ chân"])
        fill_cell_lines(bmc.rows[1].cells[4],
            "KÊNH PHÂN PHỐI (CHANNELS)",
            ["• Chrome Web Store (kênh chính)",
             "• Website focusproof.com",
             "• Product Hunt launch",
             "• Reddit r/productivity, r/freelance",
             "• TikTok / YouTube Shorts",
             "• Referral viral loop"])
        fill_cell_lines(bmc.rows[0].cells[5],
            "PHÂN KHÚC KHÁCH HÀNG (CUSTOMER SEGMENTS)",
            ["• Sinh viên học online (đại học, Coursera, Udemy)",
             "• Freelancer cần chứng minh giờ làm (UpWork, Fiverr)",
             "• Lập trình viên, remote worker",
             "• Tổ chức giáo dục (trường ĐH, trung tâm)",
             "• Doanh nghiệp SME remote-first"])
        fill_cell_lines(bmc.rows[2].cells[0],
            "CẤU TRÚC CHI PHÍ (COST STRUCTURE)",
            ["• CAPEX one-time: ~$67 (domain $12, design $50, Chrome dev fee $5)",
             "• OPEX: $6/tháng (early) → $310/tháng (scale M10–M12)",
             "• Supabase $0–25 • Vercel $0–20 • OpenAI ~$5–60 • Stripe 2.9% + $0.30",
             "• Marketing $0–150/tháng",
             "• Tổng năm 1: ~$1,525 — Gross margin ~85%"],
            fill="FEE2E2")
        fill_cell_lines(bmc.rows[2].cells[3],
            "DÒNG DOANH THU (REVENUE STREAMS)",
            ["• Pro Subscription: $4.99/tháng hoặc $49/năm (-18%)",
             "• Team Subscription: $3.99/seat/tháng (≥5 seat)",
             "• Custom Branding (logo + tên tổ chức trên PDF)",
             "• Năm 1: $6,165 doanh thu — MRR cuối năm $1,287",
             "• LTV/CAC ~40× — Hòa vốn tháng 4 sau launch"],
            fill="DCFCE7")

    # ------------------------------------------------------------------
    # 3.6 - Thay placeholder bullet bang noi dung chi tiet
    # ------------------------------------------------------------------
    print("   - Thay placeholder bullets bang noi dung chi tiet...")

    REPLACEMENTS = {
        # B. MO TA THEM SAN PHAM - Tinh can thiet
        "Dự án đã có sản phẩm dịch vụ hay mới":
            "• Trạng thái dự án: FocusProof v1.0 ĐÃ HOÀN THIỆN — Chrome Extension "
            "MV3 chạy được, Core Engine 3 tín hiệu hoạt động ổn định, ~36 unit "
            "test pass, PDF Certificate + QR + SHA-256 đã verify được. v1.1 là "
            "giai đoạn KINH DOANH HÓA (backend + pricing + team), KHÔNG phải ý "
            "tưởng giấy.",
        "Mục tiêu, giá trị, tầm nhìn":
            "• Mục tiêu: trở thành tiêu chuẩn de-facto cho \"productivity proof\" "
            "trong kỷ nguyên remote work. Tầm nhìn 3 năm: 100,000 active users, "
            "MRR $35,000, mở rộng Edge/Firefox + API enterprise. Giá trị mang lại "
            "cho: (1) Sinh viên học online — tự đo và chứng minh thời gian học; "
            "(2) Freelancer — chứng minh giờ làm với khách quốc tế; (3) Doanh "
            "nghiệp/trường học — đo lường nhẹ, không xâm phạm quyền riêng tư.",
        "Đối tượng khách hàng quan trọng":
            "• Khách hàng QUAN TRỌNG NHẤT là freelancer (UpWork/Fiverr) và sinh "
            "viên học online — hai nhóm có nhu cầu CHỨNG MINH giờ tập trung cấp "
            "thiết với khách hàng/giảng viên. Đây là phân khúc sẵn sàng trả phí "
            "vì chứng chỉ PDF có QR + hash SHA-256 mang lại lợi thế cạnh tranh "
            "trực tiếp (ví dụ: nhận dự án dễ hơn, được đánh giá cao hơn).",
        "Lý do khách hàng chọn sản phẩm":
            "• 5 lý do then chốt: (1) Chứng chỉ PDF + QR + SHA-256 XÁC THỰC ĐƯỢC "
            "— DUY NHẤT thị trường, không đối thủ nào có; (2) 3-Signal Detection "
            "(Camera + Activity + Tab) khách quan, không thể giả mạo bằng "
            "\"wiggle mouse\"; (3) 100% xử lý LOCAL — không spyware, không "
            "screenshot, không keylog (đối lập 180° Hubstaff/Time Doctor); "
            "(4) Giá Pro $4.99/tháng — RẺ NHẤT phân khúc (đối thủ $9–14); "
            "(5) AI cá nhân hóa qua GPT-4o-mini đề xuất cải thiện.",
        "Đánh giá về giá trị của sản phẩm dịch vụ mang lại cho cộng đồng":
            "• Giá trị xã hội: cải thiện năng suất hàng triệu remote worker, "
            "bảo vệ quyền riêng tư trong làm việc từ xa, đặt CHUẨN MỚI \"đo "
            "lường không xâm phạm\". Hỗ trợ giáo dục từ xa Việt Nam — sinh viên "
            "có thể chứng minh giờ học cho giảng viên một cách khách quan. "
            "Hỗ trợ freelancer Việt Nam tăng độ tin cậy với khách quốc tế. "
            "Bảo trợ học thuật từ Khoa CNTT — ĐH Tôn Đức Thắng (đề xuất).",
        # Tinh kha thi
        "Việc sản xuất sản phẩm là khả thi":
            "• Tính khả thi 100%: sản phẩm v1.0 ĐÃ chạy được trên Chrome thật; "
            "stack công nghệ đều TRƯỞNG THÀNH (Chrome MV3, MediaPipe WASM, "
            "Supabase, Stripe, GPT-4o-mini); thời gian triển khai v1.1 chỉ "
            "8–10 tuần (6 phase) cho 1 fullstack developer.",
        "Cơ cấu chi phí và giá thành hợp lý":
            "• CAPEX one-time chỉ ~$67 (domain $12, design $50, Chrome dev fee "
            "$5). OPEX khởi điểm $6/tháng (free tier Supabase + Vercel + "
            "OpenAI), scale lên ~$310/tháng tại tháng 12. Tổng chi phí năm 1 "
            "~$1,525. Doanh thu năm 1 base case $6,165 → lợi nhuận ròng ~$4,640. "
            "Gross margin ~85% — rất tốt cho mô hình SaaS.",
        "Nêu rõ những thuận lợi, khó khăn":
            "• THUẬN LỢI: nền tảng v1.0 sẵn sàng, codebase ổn định 36 test pass, "
            "stack quen thuộc, free tier đủ dùng đến 5,000 user, AI rẻ "
            "(GPT-4o-mini). KHÓ KHĂN: làm solo nên thời gian gấp; conversion "
            "Free→Pro thường thấp (1.5–4.6%); chống gian lận license phải "
            "chặt; cần marketing để vượt qua nhiễu của Chrome Web Store. "
            "GIẢI PHÁP: device fingerprint đa lớp, A/B test pricing, viral "
            "referral, partnership với TDTU.",
        "Sản phẩm có tính cạnh tranh":
            "• Bảng so sánh đối thủ (RescueTime, Forest, Hubstaff, Cold Turkey, "
            "Toggl) cho thấy FocusProof THẮNG ở 5/8 tiêu chí: Privacy, 3-Signal, "
            "Chứng chỉ xác thực, AI cá nhân hóa, Goal-based. Riêng \"Chứng chỉ "
            "PDF có QR + SHA-256\" là DUY NHẤT — không đối thủ nào có.",
        # Tinh doc dao, sang tao
        "Sản phẩm dịch vụ là hoàn toàn mới":
            "• ĐIỂM MỚI HOÀN TOÀN: chứng chỉ PDF có QR + SHA-256 tự xác thực — "
            "không sản phẩm nào khác trên thị trường có. Khác biệt KEY: 3-Signal "
            "detection (Camera + Activity + Tab) thay vì 1 tín hiệu như đối thủ; "
            "100% xử lý local — đối lập 180° với Hubstaff/Time Doctor (xâm phạm); "
            "AI cá nhân hóa qua GPT-4o-mini — không chỉ thống kê mà ĐỀ XUẤT.",
        "Tính khác biệt, tính độc đáo":
            "• Công nghệ KHÓ COPY ngắn hạn: (1) Pipeline tích hợp MediaPipe "
            "WASM + chrome.tabs API + Activity Tracker đồng bộ realtime trong "
            "Offscreen Document — đòi hỏi kiến thức Chrome Extension MV3 sâu; "
            "(2) Hệ thống QR + SHA-256 verify giấy chứng chỉ — đòi hỏi "
            "infrastructure backend riêng + giao thức xác thực; (3) Goal "
            "Evaluator với rules tùy chỉnh theo từng task mode — đã xây dựng "
            "qua nhiều iteration trong v1.0.",
        "Việc sản xuất sản phẩm được tạo ra bởi quá trình đổi mới sáng tạo":
            "• Đổi mới sáng tạo dẫn đến chi phí THẤP: dùng MediaPipe WASM "
            "(local, miễn phí) thay vì AWS Rekognition; dùng GPT-4o-mini "
            "(rẻ hơn 100× GPT-4); dùng Supabase free tier (50K MAU); dùng "
            "Vercel free tier. Kết quả: gross margin ~85% → có thể bán Pro "
            "$4.99/tháng (rẻ hơn đối thủ 2–3 lần) MÀ VẪN có lợi nhuận. Đây "
            "là lợi thế CHI PHÍ bền vững.",
        # C. KE HOACH SX KD
        "Có kế hoạch sản xuất hàng hóa dịch vụ rõ ràng":
            "• Triển khai 6 phase trong 8–10 tuần (xem bảng kế hoạch chi tiết "
            "ngay phía dưới). Mỗi phase có deliverable rõ ràng, có testing và "
            "review trước khi chuyển phase. Phase cuối (Week 9–10) dành riêng "
            "cho polish + marketing prep + Chrome Web Store submit.",
        "Phân tích và đánh giá rủi ro":
            "• Đã nhận diện 14 rủi ro chính: bypass credit, share license, "
            "tạo nhiều account abuse free credit, self-referral, Stripe webhook "
            "giả mạo/duplicate, conversion thấp, Chrome Web Store reject, đối "
            "thủ copy, OpenAI tăng giá... (xem bảng rủi ro chi tiết). Mỗi rủi "
            "ro đều có giải pháp mitigation cụ thể.",
        "Giải pháp xây dựng các kênh phân phối":
            "• 7 kênh phân phối: Chrome Web Store (chính, ~30% installs), "
            "website focusproof.com, Product Hunt launch (200–500 installs/24h), "
            "Reddit r/productivity (100–300/post), TikTok/YouTube Shorts (viral), "
            "Referral viral từ user (+20–50 Credit/người), B2B outbound trường "
            "đại học và doanh nghiệp SME.",
        "Phát triển, mở rộng thị trường":
            "• Roadmap 3 năm: Y1 — 5,000 active users, MRR $1,287, hòa vốn; "
            "Y2 — 30,000 users, MRR $10,000, ra mắt Mobile companion app; "
            "Y3 — 100,000 users, MRR $35,000, mở rộng Edge/Firefox + API "
            "enterprise. Mở rộng địa lý: Việt Nam → Đông Nam Á → toàn cầu. "
            "Mở rộng segment: B2C → B2B (Education → Enterprise).",
        # D. KET QUA TIEM NANG
        "Các nguồn thu chính":
            "• 3 nguồn thu: (1) Pro Subscription — $4.99/tháng hoặc $49/năm "
            "(chính, ~70% doanh thu); (2) Team/Education Subscription — "
            "$3.99/seat/tháng tối thiểu 5 seat (~30% doanh thu); (3) Tương lai: "
            "API enterprise, custom branding white-label cho trường học.",
        "Dự kiến doanh thu":
            "• Doanh thu năm 1 (base case): $6,165 — MRR cuối năm $1,287 — "
            "Annualized Run Rate $15,440. Best case: MRR $3,200 ($38,400 ARR). "
            "Worst case: MRR $400 ($4,800 ARR). Xem bảng doanh thu 12 tháng "
            "chi tiết phía dưới.",
        "Tính toán chi phí":
            "• CAPEX one-time ~$67. OPEX/tháng: M1–M3 ~$6, M4–M9 ~$85, M10–M12 "
            "~$310. Tổng chi phí năm 1: ~$1,525. Phân bổ: hosting 30%, AI API "
            "20%, Stripe phí 20%, marketing 25%, khác 5%. Xem bảng chi phí "
            "chi tiết phía dưới.",
        "Khả năng hoàn vốn":
            "• Hòa vốn (break-even) tại THÁNG 4 sau launch — cumulative revenue "
            "$389 vượt cumulative cost $170. Lợi nhuận ròng năm 1: ~$4,640 "
            "(75% lợi nhuận biên). LTV/CAC ratio: ~40× (rất tốt cho SaaS — "
            "ngưỡng tốt là ≥3×). Payback period: 0.3 tháng (CAC ~$1.50, "
            "ARPU $4.99).",
        "Khả năng tăng trưởng, tác động xã hội":
            "• Tăng trưởng dự kiến: 5,000 → 30,000 → 100,000 active users "
            "(Y1→Y2→Y3). Tác động xã hội: cải thiện năng suất hàng triệu remote "
            "worker, bảo vệ quyền riêng tư, hỗ trợ giáo dục từ xa và freelancer "
            "Việt Nam, đặt chuẩn mới về \"productivity proof\" không xâm phạm.",
        # E. NGUON LUC
        "Dự án đã có doanh nghiệp nào tư vấn hỗ trợ":
            "• Hiện chưa có doanh nghiệp tư vấn chính thức. ĐỀ XUẤT bảo trợ "
            "học thuật từ Khoa CNTT — ĐH Tôn Đức Thắng (giảng viên hướng dẫn + "
            "phòng lab). Đối tác kỹ thuật: Supabase, Vercel, Stripe, OpenAI, "
            "Google MediaPipe (sử dụng API/SDK của họ).",
        "Đánh giá nguồn nhân lực, tính sẵn sàng tham gia":
            f"• Nhân lực thực hiện: 1 người — {INFO['author_name']} "
            f"(MSSV {INFO['student_id']}, Khoa {INFO['khoa']}) làm fullstack "
            "đảm nhận TOÀN BỘ phát triển, vận hành và marketing. Tính sẵn sàng: "
            "100% — đã hoàn thiện v1.0, có codebase, có kinh nghiệm Chrome "
            "Extension MV3 + React + TypeScript + Supabase. Hỗ trợ: 2–3 sinh "
            "viên CNTT TDTU làm beta tester (volunteer).",
        "Cơ cấu tổ chức bộ máy nhân sự":
            "• Giai đoạn 1 (M1–M6): solo founder kiêm tất cả vai trò "
            "(developer, product, marketing, support). Giai đoạn 2 (M7–M12): "
            "khi MRR đạt $500+, thuê thêm 1 part-time marketing/UI designer "
            "(~$200/tháng). Giai đoạn 3 (Y2): full team 3 người (founder + "
            "1 dev + 1 marketing).",
        "Các đối tác chính hỗ trợ triển khai":
            "• Đối tác học thuật: Khoa CNTT — ĐH Tôn Đức Thắng. "
            "Đối tác kỹ thuật: Supabase (backend), Vercel (hosting web), "
            "Stripe/LemonSqueezy (thanh toán), OpenAI (AI), Google MediaPipe "
            "(face detection). Đối tác phân phối: Chrome Web Store, Product "
            "Hunt. Cộng đồng: Discord/Facebook Group productivity Việt Nam.",
        "Giải pháp huy động vốn":
            "• Vốn cần 6 tháng đầu: ~$582 (~14.5 triệu VND). Nguồn: (1) Vốn "
            "tự có — founder bootstrap; (2) Giải thưởng cuộc thi (2–5 triệu "
            "VND nếu đạt giải); (3) Doanh thu sớm M1–M6 (~$1,032). Chiến lược "
            "BOOTSTRAP — gross margin 85% + break-even tháng 4 → KHÔNG cần "
            "vốn ngoài trong giai đoạn đầu. Có thể gọi seed round sau Y1 nếu "
            "muốn scale nhanh.",
        # F. TRUYEN THONG
        "Lập kế hoạch truyền thông tổng thể":
            "• Kế hoạch 3 giai đoạn: Pre-launch (Week 7–9): teaser TikTok/IG, "
            "build email waitlist 500+, partner content với 2–3 Vietnamese "
            "productivity influencer; Launch week (Week 10): Product Hunt "
            "launch ngày 1, Reddit posts, content marketing đồng bộ; "
            "Post-launch (M2–M12): SEO content blog, YouTube tutorial hàng "
            "tuần, partnership với trường ĐH/cộng đồng freelancer.",
        "Xây dựng công cụ truyền thông":
            "• Công cụ: Landing page chuyên nghiệp focusproof.com, Pricing "
            "page kiểu GitHub Copilot, Demo video 60s, GIF tutorial, "
            "Press kit (logo + screenshot + 1-pager), tài khoản TikTok/YouTube/"
            "Twitter/Reddit, mailing list (Resend), Discord server cộng đồng.",
        "Giải pháp truyền thông độc đáo và khác biệt":
            "• Viral marketing BUILT-IN: mỗi PDF Certificate user xuất ra đều "
            "có watermark + footer link → user share LinkedIn/Twitter → quảng "
            "cáo MIỄN PHÍ. QR Code verification: user share QR → click → "
            "landing page → install. Referral viral loop: free user tự giới "
            "thiệu để lấy credit. Open source partial: open source Core Engine "
            "trên GitHub → developer trust + backlinks SEO.",
        "Dự kiến kênh truyền thông":
            "• 9 kênh chính (xem bảng dưới): Chrome Web Store SEO (Free, ~30% "
            "installs), Product Hunt launch (200–500/24h), Reddit r/productivity "
            "(100–300/post), TikTok/YouTube Shorts (Low cost, viral), Facebook "
            "Group sinh viên TDTU (50–100/group), Influencer micro VN ($50–200/"
            "post → 200–1000 installs), Content blog Medium/Dev.to (long-tail "
            "SEO), Google Ads ($100/tháng), Partnership trường đại học (Team).",
    }

    for needle, replacement in REPLACEMENTS.items():
        for p in doc.paragraphs:
            t = p.text
            if needle in t and t.strip().startswith("-"):
                set_para_text(p, replacement, align="justify")
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.left_indent = Cm(0.3)
                break

    # ------------------------------------------------------------------
    # 3.7 - Chen cac bang BO TRO sau cac section
    # ------------------------------------------------------------------
    print("   - Chen bang ho tro (ke hoach, rui ro, doanh thu, chi phi)...")

    # Bang ke hoach 6 phase - sau "Phát triển, mở rộng thị trường"
    p_anchor = find_para_by_text(doc, "Phát triển, mở rộng thị trường")
    if p_anchor:
        title_p = insert_paragraph_after(p_anchor,
            "Bảng 1 — Kế hoạch triển khai 6 Phase (8–10 tuần):",
            bold=True, color=PRIMARY, space_after=Pt(2))
        last = insert_table_after(title_p,
            ["Phase", "Tuần", "Nội dung chính", "Deliverable"],
            [
                ("1", "1–2", "Supabase Backend + Auth + Credit System",
                 "Schema + 8 Edge Functions + RLS + Stripe webhook"),
                ("2", "3–4", "Extension Integration (Auth, Credit UI, License)",
                 "Login modal + Credit display + Device fingerprint"),
                ("3", "5–6", "PDF + Pie Chart Upgrade",
                 "Pie/Bar Chart trong ResultScreen + PDF v1.1 nâng cao"),
                ("4", "7", "Pricing Website (Next.js 14)",
                 "Landing + Pricing 3 cột + Stripe Checkout"),
                ("5", "8", "Team Dashboard + Referral System",
                 "Web dashboard + viral referral + reports"),
                ("6", "9–10", "Testing, Polish, Marketing, Launch",
                 "Chrome Web Store submit + Product Hunt launch"),
            ],
            col_widths_cm=[1.2, 1.5, 5.5, 7.8])

        # Bang rui ro
        title2 = insert_paragraph_after(last,
            "Bảng 2 — Phân tích rủi ro chính & giải pháp:",
            bold=True, color=PRIMARY, space_after=Pt(2))
        last = insert_table_after(title2,
            ["#", "Rủi ro", "Mức độ", "Giải pháp mitigation"],
            [
                ("1", "Bypass credit (hack client)", "Trung bình",
                 "Credit deduction server-side bắt buộc + JWT verify + "
                 "rate limit 60 req/phút"),
                ("2", "Chia sẻ license (1 mua, nhiều người dùng)", "Cao",
                 "Device fingerprint Canvas + WebGL + UA hash, tối đa 3 "
                 "thiết bị/license"),
                ("3", "Tạo nhiều account abuse free credit", "Cao",
                 "Email verification + device fingerprint + IP rate limit; "
                 "referral chỉ award khi user mới hoàn thành ≥1 session ≥5 phút"),
                ("4", "Stripe webhook giả mạo / duplicate", "Trung bình",
                 "Verify signature stripe-signature + idempotency key + "
                 "UNIQUE constraint trên payment_intent_id"),
                ("5", "Conversion Free → Pro thấp", "Cao",
                 "Tối ưu trial UX + smart popup timing + A/B test pricing + "
                 "social proof"),
                ("6", "Chrome Web Store reject", "Thấp",
                 "Tuân thủ Chrome Extension Policies, minimal permissions, "
                 "privacy disclosure rõ ràng"),
                ("7", "OpenAI API tăng giá / down", "Thấp",
                 "Đa dạng provider (Claude, Gemini fallback), monitor "
                 "cost/request"),
                ("8", "Đối thủ copy nhanh", "Trung bình",
                 "Tốc độ ship + brand + cộng đồng. Patent USP \"Certificate "
                 "hash + QR\" nếu có thể"),
            ],
            col_widths_cm=[0.8, 4.5, 2, 8.7])

    # Bang doanh thu - sau "Dự kiến doanh thu"
    p_rev = find_para_by_text(doc, "Dự kiến doanh thu")
    # Phai re-find vi paragraph da bi replace text
    p_rev = None
    for p in doc.paragraphs:
        if "MRR cuối năm $1,287" in p.text:
            p_rev = p
            break
    if p_rev:
        t = insert_paragraph_after(p_rev,
            "Bảng 3 — Dự kiến doanh thu năm 1 (Base case):",
            bold=True, color=PRIMARY, space_after=Pt(2))
        last = insert_table_after(t,
            ["Tháng", "Total Users", "Pro Subs", "Team (seats)",
             "MRR ($)", "Cum. Revenue ($)"],
            [
                ("M1 (Launch)", "200", "5", "0", "25", "25"),
                ("M3", "700", "22", "0", "110", "195"),
                ("M6", "2,000", "65", "10", "364", "1,032"),
                ("M9", "3,500", "135", "18", "745", "2,874"),
                ("M12", "5,000", "230", "35", "1,287", "6,165"),
            ],
            col_widths_cm=[2.5, 2.5, 2, 2.5, 2, 3])
        insert_paragraph_after(last,
            "ARR (Annualized Run Rate) cuối năm 1: $1,287 × 12 ≈ $15,440. "
            "Best case: MRR $3,200 ($38,400 ARR). Worst case: MRR $400 "
            "($4,800 ARR).",
            italic=True, align="justify")

    # Bang chi phi - sau "Tính toán chi phí"
    p_cost = None
    for p in doc.paragraphs:
        if "Phân bổ: hosting" in p.text:
            p_cost = p
            break
    if p_cost:
        t = insert_paragraph_after(p_cost,
            "Bảng 4 — Cấu trúc chi phí theo giai đoạn (USD/tháng):",
            bold=True, color=PRIMARY, space_after=Pt(2))
        last = insert_table_after(t,
            ["Khoản mục", "M1–M3 (early)", "M4–M9 (growing)", "M10–M12 (scale)"],
            [
                ("Supabase", "$0 (free)", "$0 (free)", "$25 (Pro)"),
                ("Vercel", "$0 (free)", "$0 (free)", "$20 (Pro)"),
                ("OpenAI API (GPT-4o-mini)", "~$5", "~$20", "~$60"),
                ("Stripe phí (2.9% + $0.30)", "$1", "$15", "$45"),
                ("Email service", "$0", "$0", "$10"),
                ("Marketing (ads + content)", "$0", "$50", "$150"),
                ("TỔNG OPEX/tháng", "~$6", "~$85", "~$310"),
            ],
            col_widths_cm=[6, 2.7, 2.7, 2.7])
        insert_paragraph_after(last,
            "CAPEX one-time: ~$67 (domain $12 + design $50 + Chrome dev fee $5). "
            "Tổng chi phí năm 1: ~$1,525 → Lợi nhuận ròng ~$4,640 (75% biên).",
            italic=True, align="justify")

    # Bang truyen thong - sau "Dự kiến kênh truyền thông"
    p_mkt = None
    for p in doc.paragraphs:
        if "9 kênh chính" in p.text and "Chrome Web Store SEO" in p.text:
            p_mkt = p
            break
    if p_mkt:
        t = insert_paragraph_after(p_mkt,
            "Bảng 5 — Kênh truyền thông & dự báo hiệu quả:",
            bold=True, color=PRIMARY, space_after=Pt(2))
        last = insert_table_after(t,
            ["Kênh", "Chi phí", "Hiệu quả dự kiến", "Giai đoạn"],
            [
                ("Chrome Web Store SEO", "Free", "~30% tổng installs", "Liên tục"),
                ("Product Hunt launch", "Free", "200–500 installs/24h", "Launch day"),
                ("Reddit r/productivity, r/freelance", "Free",
                 "100–300 installs/post", "Tuần đầu"),
                ("TikTok / YouTube Shorts", "Low ($0–50)",
                 "Viral tiềm năng cao", "M1–M6"),
                ("Facebook Group sinh viên TDTU", "Free",
                 "50–100 installs/group", "M1–M3"),
                ("Influencer micro Việt Nam", "$50–200/post",
                 "200–1,000 installs", "M2–M6"),
                ("Content blog Medium / Dev.to", "Free (time)",
                 "Long-tail SEO", "Liên tục"),
                ("Google Ads", "$100/tháng", "~50 installs/tháng", "M4+"),
                ("Partnership trường đại học", "Free outreach",
                 "Team accounts", "M6+"),
            ],
            col_widths_cm=[5, 2.7, 4.3, 2.5])

    # ------------------------------------------------------------------
    # 3.8 - Phu luc cuoi: 4 so do Mermaid + BMC PNG + chu ky
    # ------------------------------------------------------------------
    print("   - Them phu luc so do + chu ky cuoi van ban...")

    # Tim paragraph cuoi cung de them phu luc
    last_p = doc.paragraphs[-1]

    # Page break truoc phu luc
    pb = OxmlElement("w:p")
    pPr = OxmlElement("w:pPr"); pb.append(pPr)
    r = OxmlElement("w:r"); pb.append(r)
    br = OxmlElement("w:br"); br.set(qn("w:type"), "page"); r.append(br)
    last_p._element.addnext(pb)
    from docx.text.paragraph import Paragraph
    last_p = Paragraph(pb, last_p._parent)

    # Tieu de phu luc
    last_p = insert_paragraph_after(last_p,
        "PHỤ LỤC: SƠ ĐỒ MINH HỌA",
        bold=True, size=Pt(16), color=PRIMARY, align="center")

    diagrams = [
        ("Sơ đồ 1 — Kiến trúc hệ thống FocusProof v1.1",
         "architecture", 16,
         "Hình 1: Kiến trúc tổng thể gồm Chrome Extension MV3 (Popup, Background, "
         "Offscreen Camera, Content Script), Supabase Backend (Auth, PostgreSQL "
         "với RLS, Edge Functions) và Web App Next.js (Landing, Pricing, Team "
         "Dashboard); tích hợp Stripe và OpenAI."),
        ("Sơ đồ 2 — Core Engine: 3-Signal Focus Detection (USP)",
         "focus_engine", 15,
         "Hình 2: Pipeline Core Engine — thu thập 3 tín hiệu (Face qua MediaPipe, "
         "Activity qua keyboard/mouse, Tab qua chrome.tabs API) → Goal Evaluator "
         "→ Focus Score → Tùy chọn AI Analysis → PDF Certificate có QR + SHA-256."),
        ("Sơ đồ 3 — User Journey & Monetization Funnel",
         "monetization", 15,
         "Hình 3: Hành trình người dùng từ cài đặt → trial 7 ngày → hết credit "
         "→ popup 3 lựa chọn (mời bạn / Pro / Team) → MRR → tái đầu tư. "
         "Vòng lặp viral loop được tích hợp sẵn."),
        ("Sơ đồ 4 — Sequence: Trừ Credit khi gọi AI (server-side)",
         "credit_sequence", 16,
         "Hình 4: Sequence diagram thể hiện logic trừ Credit ATOMIC server-side "
         "tại Supabase Edge Function — chống bypass client, xử lý các trường "
         "hợp Pro/Team/Trial/đủ Credit/thiếu Credit."),
        ("Sơ đồ 5 — Business Model Canvas (chuẩn 9 khối Osterwalder)",
         "bmc", 17,
         "Hình 5: Business Model Canvas chuẩn 9 khối — phiên bản mở rộng minh "
         "họa của Bảng BMC trong phần Tổng quan đề án phía trên."),
    ]
    for title, key, width, caption in diagrams:
        last_p = insert_paragraph_after(last_p, title,
            bold=True, size=Pt(13), color=PRIMARY, align="left")
        last_p.paragraph_format.space_before = Pt(10)
        last_p = add_image_after(last_p, images[key], width_cm=width,
                                 caption=caption)

    # Chu ky cuoi van ban
    last_p = insert_paragraph_after(last_p, "")
    last_p.paragraph_format.space_before = Pt(20)
    last_p = insert_paragraph_after(last_p,
        f"TP. Hồ Chí Minh, ngày {INFO['submit_date']}",
        italic=True, align="right")
    last_p = insert_paragraph_after(last_p,
        "NGƯỜI THỰC HIỆN", bold=True, align="right")
    last_p = insert_paragraph_after(last_p,
        "(Ký, ghi rõ họ tên)", italic=True, align="right")
    last_p = insert_paragraph_after(last_p, "")
    last_p = insert_paragraph_after(last_p, "")
    last_p = insert_paragraph_after(last_p, "")
    last_p = insert_paragraph_after(last_p,
        INFO["author_name"], bold=True, size=Pt(14), align="right")
    last_p = insert_paragraph_after(last_p,
        f"MSSV: {INFO['student_id']} - Khoa: {INFO['khoa']}",
        italic=True, align="right")

    # ------------------------------------------------------------------
    # Step 4 - Save
    # ------------------------------------------------------------------
    print(f"\n[4/4] Luu file...")
    doc.save(str(OUTPUT))
    print(f"\n DONE! Output: {OUTPUT}")
    print(f"   File size: {OUTPUT.stat().st_size // 1024} KB")
    print("=" * 70)


if __name__ == "__main__":
    main()
