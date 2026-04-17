"""
==============================================================================
FocusProof v1.1 — Generate Startup Pitch DOCX (FINAL)
TECH STARTUP CHALLENGER 2026 — Khoa CNTT, ĐH Tôn Đức Thắng
==============================================================================
Tac gia ho so: Ngo Binh Minh - MSSV 524H0169
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

# ============================================================================
BASE_DIR = Path(__file__).parent
TEMPLATE = BASE_DIR / "MauTrinhBayDuAn.docx"
OUTPUT = BASE_DIR / "FocusProof_Startup_Pitch_v1.1.docx"
IMG_DIR = BASE_DIR / "_diagrams"
IMG_DIR.mkdir(exist_ok=True)

# ============================================================================
# THONG TIN CA NHAN
# ============================================================================
INFO = {
    "project_name": "FocusProof",
    "project_subtitle": "Chung chi Tap trung Thong minh & Xac thuc",
    "author_name": "Ngo Binh Minh",
    "student_id": "524H0169",
    "khoa": "Cong nghe Thong tin",
    "year": "—",
    "phone": "—",
    "email": "—",
    "submit_date": "18/04/2026",
}

# ============================================================================
# 4 SO DO MERMAID (DON GIAN, SACH SE)
# ============================================================================
MERMAID_DIAGRAMS = {
    "user_flow": """flowchart TD
    A[Mo Extension] --> B{Da dang nhap?}
    B -- Chua --> C[Dang ky / Dang nhap]
    C --> D[Nhan 100 Credit + Trial 7 ngay]
    B -- Roi --> E[Chon Task & Goal Mode]
    D --> E
    E --> F[Bat dau Session]
    F --> G[Theo doi 3 tin hieu:<br/>Face + Activity + Tab]
    G --> H[Floating Widget realtime]
    H --> I[Ket thuc Session]
    I --> J[Result: Focus Score + Pie Chart]
    J --> K{AI Analysis?}
    K -- Co --> L[Goi GPT-4o-mini<br/>tru 20 Credit neu Free]
    K -- Khong --> M[Xuat PDF Certificate<br/>QR + SHA-256]
    L --> M
    M --> N[Luu lich su + Cap nhat Streak]

    classDef start fill:#1F4E79,color:#fff,stroke:#1F4E79
    classDef decision fill:#F59E0B,color:#fff,stroke:#F59E0B
    classDef action fill:#22C55E,color:#fff,stroke:#22C55E
    classDef output fill:#8B5CF6,color:#fff,stroke:#8B5CF6
    class A,F start
    class B,K decision
    class C,D,E,G,H,I,L action
    class J,M,N output
""",
    "architecture": """flowchart LR
    subgraph CLIENT[Chrome Extension MV3]
        UI[Popup React 19]
        WORKER[Background Worker]
        OFFSCREEN[Offscreen Camera<br/>MediaPipe WASM]
        STORE[(Local Storage)]
    end
    subgraph BACKEND[Supabase Backend]
        AUTH[Auth JWT]
        DB[(PostgreSQL + RLS)]
        EDGE[Edge Functions<br/>Credit / License / Webhook]
    end
    subgraph WEB[Web App - Next.js]
        LAND[Landing Page]
        PRICE[Pricing Page]
        DASH[Team Dashboard]
    end
    PAY[Stripe Payment]
    AI[OpenAI GPT-4o-mini]
    CLIENT -->|HTTPS + JWT| EDGE
    CLIENT -->|API Call| AI
    PRICE --> PAY
    PAY -->|Webhook| EDGE
    DASH --> EDGE
    LAND --> PRICE
    classDef ext fill:#1F4E79,color:#fff
    classDef back fill:#22C55E,color:#fff
    classDef web fill:#F59E0B,color:#fff
    classDef ext3 fill:#8B5CF6,color:#fff
    class UI,WORKER,OFFSCREEN,STORE ext
    class AUTH,DB,EDGE back
    class LAND,PRICE,DASH web
    class PAY,AI ext3
""",
    "business_model": """flowchart TB
    A[Nguoi dung tiem nang<br/>Sinh vien / Freelancer / Remote] --> B[Cai dat Free<br/>Trial 7 ngay + 100 Credit]
    B --> C{Het Trial / Het Credit?}
    C -- Chua --> B
    C -- Roi --> D[Popup: Mua / Moi ban / Tiep tuc Free]
    D --> E[Upgrade Pro $4.99/th]
    D --> F[Upgrade Team $3.99/seat]
    D --> G[Moi ban: +20 Credit<br/>Viral loop]
    G --> A
    E --> H[Doanh thu MRR<br/>Gross margin 85%]
    F --> H
    H --> I[Tai dau tu:<br/>Marketing + San pham]
    I --> A
    classDef user fill:#1F4E79,color:#fff
    classDef free fill:#22C55E,color:#fff
    classDef paid fill:#F59E0B,color:#fff
    classDef rev fill:#8B5CF6,color:#fff
    class A user
    class B,G free
    class E,F paid
    class H,I rev
""",
    "credit_flow": """sequenceDiagram
    autonumber
    participant U as User
    participant E as Extension
    participant S as Supabase Edge
    participant DB as PostgreSQL
    participant AI as OpenAI
    U->>E: Nhan AI Analysis (20 Credit)
    E->>S: POST /credits/deduct (JWT)
    S->>DB: Check plan + credits + trial
    alt Pro/Team hoac con Trial
        S-->>E: OK (free)
    else Du Credit
        S->>DB: Tru 20 Credit (atomic)
        S-->>E: OK (balance: 60)
    else Khong du
        S-->>E: ERROR INSUFFICIENT
        E->>U: Hien thi Popup mua/moi ban
    end
    E->>AI: Goi GPT-4o-mini
    AI-->>E: Ket qua phan tich
    E->>U: Hien thi + tao PDF
""",
}


# ============================================================================
# RENDER MERMAID -> PNG
# ============================================================================
def render_mermaid(name: str, code: str) -> Path:
    out = IMG_DIR / f"{name}.png"
    if out.exists() and out.stat().st_size > 5000:
        print(f"   [cache] {out.name}")
        return out

    encoded = base64.urlsafe_b64encode(code.encode("utf-8")).decode("ascii")
    urls = [
        f"https://mermaid.ink/img/{encoded}?type=png&bgColor=FFFFFF",
        f"https://mermaid.ink/img/{encoded}?type=png",
    ]
    for _ in range(3):
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
# VE BUSINESS MODEL CANVAS BANG PIL (DUNG CHUAN 9 KHOI THEO TEMPLATE)
# ============================================================================
def draw_bmc_canvas(out_path: Path):
    W, H = 2400, 1700
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    def get_font(size, bold=False):
        candidates = [
            "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        ]
        for p in candidates:
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
        return ImageFont.load_default()

    F_TITLE = get_font(36, bold=True)
    F_HEAD = get_font(24, bold=True)
    F_BODY = get_font(20)

    BORDER = (40, 40, 40)
    HEAD_BG = (31, 78, 121)
    HEAD_FG = (255, 255, 255)
    BODY_BG = (250, 250, 250)
    BODY_FG = (30, 30, 30)
    COST_BG = (254, 226, 226)
    REV_BG = (220, 252, 231)
    VP_BG = (217, 119, 6)

    title = "BUSINESS MODEL CANVAS — FOCUSPROOF v1.1"
    bbox = d.textbbox((0, 0), title, font=F_TITLE)
    d.text(((W - (bbox[2] - bbox[0])) // 2, 20), title, fill=HEAD_BG, font=F_TITLE)

    TOP = 90
    BOT = H - 30
    ROW3_H = 290
    ROW12_BOT = BOT - ROW3_H
    COL_W = W // 5
    cols = [0, COL_W, COL_W * 2, COL_W * 3, COL_W * 4, W]

    def draw_box(x1, y1, x2, y2, head, body, head_bg=HEAD_BG, body_bg=BODY_BG):
        head_h = 56
        d.rectangle([x1, y1, x2, y1 + head_h], fill=head_bg, outline=BORDER, width=2)
        bbox = d.textbbox((0, 0), head, font=F_HEAD)
        tw = bbox[2] - bbox[0]
        d.text((x1 + (x2 - x1 - tw) // 2, y1 + 14), head, fill=HEAD_FG, font=F_HEAD)
        d.rectangle([x1, y1 + head_h, x2, y2], fill=body_bg, outline=BORDER, width=2)
        ty = y1 + head_h + 12
        for ln in body.strip().split("\n"):
            d.text((x1 + 12, ty), ln, fill=BODY_FG, font=F_BODY)
            ty += 25
            if ty > y2 - 18:
                break

    BMC = {
        "KP": ("DOI TAC CHINH",
               "• Khoa CNTT - DH\n  Ton Duc Thang\n  (bao tro hoc thuat)\n"
               "• Supabase, Vercel\n  (ha tang free tier)\n"
               "• Stripe / LemonSqueezy\n  (thanh toan)\n"
               "• OpenAI (GPT-4o-mini)\n"
               "• Google MediaPipe\n  (face detection)\n"
               "• Cong dong\n  productivity VN"),
        "KA": ("HOAT DONG CHINH",
               "• Phat trien Chrome\n  Extension MV3\n"
               "• Van hanh Supabase\n  backend\n"
               "• Toi uu AI prompt\n"
               "• Marketing noi dung\n"
               "• Customer support\n"
               "• Anti-fraud monitor"),
        "KR": ("TAI NGUYEN CHINH",
               "• Codebase v1.0\n  hoan thien\n"
               "• Supabase + OpenAI\n"
               "• Domain\n  focusproof.com\n"
               "• Brand & cong dong\n"
               "• Founder fulltime"),
        "VP": ("GIAI PHAP GIA TRI",
               "• Do tap trung\n  KHACH QUAN qua\n"
               "  3 tin hieu:\n"
               "  Camera + Activity\n"
               "  + Tab\n"
               "\n"
               "• Chung chi PDF + QR\n"
               "  + SHA-256 XAC THUC\n"
               "  duy nhat thi truong\n"
               "\n"
               "• AI ca nhan hoa\n"
               "  qua GPT-4o-mini\n"
               "\n"
               "• 100% PRIVACY-FIRST\n"
               "  Xu ly local hoan toan\n"
               "\n"
               "• Pro $4.99/thang\n"
               "  (doi thu $9-14)"),
        "CR": ("QUAN HE KH",
               "• Self-service\n  (extension + web)\n"
               "• Email support (Pro)\n"
               "• Chat support (Team)\n"
               "• Discord / FB Group\n"
               "• Gamification\n  giu chan"),
        "CH": ("KENH PHAN PHOI",
               "• Chrome Web Store\n  (chinh)\n"
               "• Website\n  focusproof.com\n"
               "• Product Hunt\n"
               "• Reddit\n  r/productivity\n"
               "• TikTok / YouTube\n"
               "• Referral viral"),
        "CS": ("PHAN KHUC KHACH HANG",
               "• Sinh vien hoc online\n"
               "  (DH, Coursera,\n  Udemy)\n"
               "\n"
               "• Freelancer can\n  chung minh gio lam\n"
               "  (UpWork, Fiverr)\n"
               "\n"
               "• Lap trinh vien,\n  remote worker\n"
               "\n"
               "• To chuc giao duc\n"
               "  (truong DH,\n  trung tam)\n"
               "\n"
               "• Doanh nghiep SME\n  remote-first"),
        "COST": ("CAU TRUC CHI PHI",
                 "• OPEX: $6/thang (early)  ->  $310/thang (scale)              "
                 "• CAPEX: ~$67 one-time (domain $12, design $50, fee $5)\n"
                 "• Supabase $0-25/th     • Vercel $0-20/th     • OpenAI ~$5-60/th     "
                 "• Stripe 2.9% + $0.30/giao dich     • Marketing $0-150/th\n"
                 "• Tong chi phi nam 1: ~$1,525                                                  "
                 "• Gross margin: ~85%"),
        "REV": ("DONG DOANH THU",
                "• Pro Subscription: $4.99/thang  hoac  $49/nam (-18%)\n"
                "• Team Subscription: $3.99/seat/thang (toi thieu 5 seat)\n"
                "• Custom Branding cho Team (logo + ten to chuc tren PDF)\n"
                "• Nam 1 (base): $6,165 doanh thu - MRR cuoi nam $1,287\n"
                "• LTV/CAC ratio: ~40x  -  Hoa von thang 4 sau launch"),
    }

    draw_box(cols[0], TOP, cols[1], ROW12_BOT, *BMC["KP"])
    mid = (TOP + ROW12_BOT) // 2
    draw_box(cols[1], TOP, cols[2], mid, *BMC["KA"])
    draw_box(cols[1], mid, cols[2], ROW12_BOT, *BMC["KR"])
    draw_box(cols[2], TOP, cols[3], ROW12_BOT, *BMC["VP"], head_bg=VP_BG)
    draw_box(cols[3], TOP, cols[4], mid, *BMC["CR"])
    draw_box(cols[3], mid, cols[4], ROW12_BOT, *BMC["CH"])
    draw_box(cols[4], TOP, cols[5], ROW12_BOT, *BMC["CS"])

    split = W * 3 // 5
    draw_box(0, ROW12_BOT, split, BOT, *BMC["COST"], body_bg=COST_BG)
    draw_box(split, ROW12_BOT, W, BOT, *BMC["REV"], body_bg=REV_BG)

    img.save(out_path, "PNG", dpi=(200, 200))
    print(f"   [PIL    ] {out_path.name} ({out_path.stat().st_size//1024} KB)")
    return out_path


# ============================================================================
# DOCX HELPERS — TIMES NEW ROMAN 14pt
# ============================================================================
FONT_NAME = "Times New Roman"
FONT_SIZE = Pt(14)


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
    rFonts.set(qn("w:ascii"), FONT_NAME)
    rFonts.set(qn("w:hAnsi"), FONT_NAME)
    rFonts.set(qn("w:cs"), FONT_NAME)
    rFonts.set(qn("w:eastAsia"), FONT_NAME)


def add_para(doc, text, bold=False, italic=False, align=None, size=None):
    p = doc.add_paragraph()
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    _set_font(run, bold=bold, italic=italic, size=size or FONT_SIZE)
    return p


def add_heading(doc, text, level=1):
    sizes = {1: Pt(16), 2: Pt(15), 3: Pt(14)}
    p = doc.add_paragraph()
    run = p.add_run(text)
    _set_font(run, bold=True, size=sizes.get(level, Pt(14)),
              color=RGBColor(0x1F, 0x4E, 0x79))
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.6)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(f"•  {text}")
    _set_font(run)
    return p


def add_table(doc, headers, rows, col_widths_cm=None):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl_pr = t._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f"w:{edge}")
        b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "4")
        b.set(qn("w:color"), "000000")
        borders.append(b)
    tbl_pr.append(borders)
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(h)
        _set_font(run, bold=True, size=Pt(13), color=RGBColor(0xFF, 0xFF, 0xFF))
        tc_pr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "1F4E79")
        tc_pr.append(shd)
    for ri, row in enumerate(rows, start=1):
        for ci, val in enumerate(row):
            cell = t.rows[ri].cells[ci]
            cell.text = ""
            run = cell.paragraphs[0].add_run(str(val))
            _set_font(run, size=Pt(12))
    if col_widths_cm:
        for row in t.rows:
            for c, w in enumerate(col_widths_cm):
                if c < len(row.cells):
                    row.cells[c].width = Cm(w)
    return t


def add_image(doc, path: Path, width_cm=16, caption=None):
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Cm(width_cm))
    if caption:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cr = cp.add_run(caption)
        _set_font(cr, italic=True, size=Pt(12), color=RGBColor(0x55, 0x55, 0x55))


def fill_cell(cell, text, bold=False, size=Pt(12)):
    cell.text = ""
    run = cell.paragraphs[0].add_run(text)
    _set_font(run, bold=bold, size=size)


# ============================================================================
# MAIN
# ============================================================================
def main():
    print("=" * 70)
    print("  FocusProof v1.1 — Generate Startup Pitch DOCX (FINAL)")
    print(f"  Tac gia: {INFO['author_name']} - MSSV {INFO['student_id']}")
    print("=" * 70)

    print("\n[1/4] Render 4 so do Mermaid...")
    images = {n: render_mermaid(n, c) for n, c in MERMAID_DIAGRAMS.items()}

    print("\n[2/4] Ve Business Model Canvas (PIL, chuan 9 khoi)...")
    bmc_path = IMG_DIR / "bmc.png"
    draw_bmc_canvas(bmc_path)
    images["bmc"] = bmc_path

    print(f"\n[3/4] Mo template {TEMPLATE.name}...")
    if not TEMPLATE.exists():
        print(f"   [ERROR] Khong tim thay template: {TEMPLATE}")
        sys.exit(1)
    doc = Document(str(TEMPLATE))

    print("   - Dien thong tin ca nhan...")
    for p in doc.paragraphs:
        t = p.text
        if "Họ và tên trưởng nhóm:" in t or "Ho va ten truong nhom:" in t:
            p.text = ""
            run = p.add_run(f"Họ và tên: {INFO['author_name']}    "
                            f"MSSV: {INFO['student_id']}")
            _set_font(run, bold=True)
        elif "Khoa:" in t and ("Sinh viên năm thứ:" in t or "Sinh vien nam thu:" in t):
            p.text = ""
            run = p.add_run(f"Khoa: {INFO['khoa']}        Năm thứ: {INFO['year']}")
            _set_font(run)
        elif t.strip().startswith("Số điện thoại"):
            p.text = ""
            run = p.add_run(f"Số điện thoại liên hệ: {INFO['phone']}")
            _set_font(run)
        elif t.strip().startswith("Email"):
            p.text = ""
            run = p.add_run(f"Email: {INFO['email']}")
            _set_font(run)
        elif "Tên dự án" in t and ":" in t:
            p.text = ""
            run = p.add_run(f"Tên dự án: {INFO['project_name']} — "
                            f"{INFO['project_subtitle']}")
            _set_font(run, bold=True)

    if len(doc.tables) >= 2:
        print("   - Dien bang thanh vien (1 nguoi)...")
        members_tbl = doc.tables[1]
        if len(members_tbl.rows) >= 2:
            try:
                row = members_tbl.rows[1]
                fill_cell(row.cells[0], "1")
                fill_cell(row.cells[1], f"{INFO['author_name']} (Truong nhom)")
                fill_cell(row.cells[2], INFO["khoa"])
                fill_cell(row.cells[3], INFO["phone"])
                fill_cell(row.cells[4], INFO["year"])
            except IndexError:
                pass

    print("\n[4/4] Append noi dung chi tiet...")
    doc.add_page_break()

    # ===== TÓM TẮT DỰ ÁN =====
    add_heading(doc, "TÓM TẮT DỰ ÁN", 1)
    add_para(doc, "Ý tưởng chính:", bold=True)
    add_para(doc,
        "FocusProof là Chrome Extension đo lường mức độ tập trung khách quan qua 3 tín hiệu "
        "(Camera + Activity + Tab) và xuất chứng chỉ PDF có QR + hash SHA-256 xác thực được — "
        "công cụ duy nhất trên thị trường giúp người học và làm việc từ xa CHỨNG MINH sự tập trung "
        "của mình.", align="justify")
    add_para(doc, "Mô tả sản phẩm và giá trị mang lại:", bold=True)
    add_para(doc,
        "FocusProof gồm 3 thành phần: (1) Chrome Extension MV3 với Core Engine kết hợp MediaPipe "
        "BlazeFace cho phát hiện khuôn mặt, Activity Tracking cho bàn phím/chuột và Tab/Screen "
        "Tracking realtime cho trình duyệt, đánh giá theo mục tiêu cá nhân (study, work, programming, "
        "video-lecture); (2) Backend Supabase quản lý người dùng, Credit, License Key, chống gian lận "
        "qua device fingerprint; (3) Trang web bán hàng và Team Dashboard cho doanh nghiệp/giáo dục. "
        "Sản phẩm xuất chứng chỉ PDF 2 trang chuyên nghiệp với mã QR tự xác thực, phân tích AI cá "
        "nhân hóa (GPT-4o-mini) và biểu đồ trực quan. Toàn bộ dữ liệu phiên xử lý 100% cục bộ — đặt "
        "quyền riêng tư lên hàng đầu, đối lập với phần mềm theo dõi xâm phạm như Hubstaff hay Time "
        "Doctor. Mô hình Freemium minh bạch (Free 7 ngày trial + 100 Credit, Pro $4.99/tháng, Team "
        "$3.99/người/tháng) cho phép trải nghiệm đầy đủ trước khi nâng cấp.",
        align="justify")

    # ===== B. MÔ TẢ THÊM SẢN PHẨM =====
    add_heading(doc, "B. MÔ TẢ THÊM VỀ SẢN PHẨM, DỊCH VỤ", 1)

    add_heading(doc, "1. Tính cần thiết", 2)
    for b in [
        "Sau COVID, làm việc và học từ xa đã trở thành xu hướng không đảo ngược, nhưng người dùng "
        "không có cách đo khách quan và chứng minh sự tập trung của mình.",
        "Phần mềm theo dõi nhân viên hiện hành (Hubstaff, Time Doctor) xâm phạm quyền riêng tư "
        "(chụp màn hình, log keystroke), gây phản đối và mất niềm tin.",
        "Sinh viên học online cần chứng minh giờ học với giảng viên; freelancer cần chứng minh "
        "giờ làm với khách hàng quốc tế (UpWork, Fiverr) — chưa có công cụ chuẩn.",
        "FocusProof v1.0 đã có sản phẩm chạy được, ~36 unit test pass — v1.1 là giai đoạn "
        "kinh doanh hóa, không phải ý tưởng giấy.",
    ]:
        add_bullet(doc, b)

    add_heading(doc, "2. Tính khả thi", 2)
    for b in [
        "Sản phẩm v1.0 đã hoàn thiện và chạy được — khả thi sản xuất 100%.",
        "Stack công nghệ trưởng thành: Chrome Extension MV3, MediaPipe WASM, Supabase, "
        "GPT-4o-mini (rẻ hơn 100 lần GPT-4).",
        "Cơ cấu chi phí thấp: CAPEX ~$67 one-time, OPEX $6–310/tháng theo quy mô. Gross margin ~85%.",
        "Bảo trợ học thuật từ Khoa CNTT — ĐH Tôn Đức Thắng, có thể beta test với sinh viên thực tế.",
        "Lợi thế khác biệt: chứng chỉ PDF + QR + SHA-256 là DUY NHẤT, đối thủ khó copy ngắn hạn.",
    ]:
        add_bullet(doc, b)

    add_heading(doc, "3. Tính độc đáo, sáng tạo", 2)
    for b in [
        "Chưa từng có sản phẩm nào kết hợp 3 tín hiệu (Camera + Activity + Tab) để chấm điểm tập trung.",
        "Chứng chỉ PDF có QR + hash SHA-256 tự xác thực — XÁC THỰC ĐƯỢC, không thể giả mạo, "
        "duy nhất thị trường.",
        "100% xử lý cục bộ (local-first), không screenshot, không keylog — tôn trọng quyền riêng tư tuyệt đối.",
        "AI cá nhân hóa qua GPT-4o-mini: phân tích thói quen và đề xuất cải thiện theo từng phiên.",
        "Chi phí thấp nhờ MediaPipe WASM local + GPT-4o-mini → Pro $4.99/tháng (đối thủ $9–14).",
    ]:
        add_bullet(doc, b)

    # ===== C. KẾ HOẠCH SẢN XUẤT KINH DOANH =====
    add_heading(doc, "C. KẾ HOẠCH SẢN XUẤT, KINH DOANH", 1)
    add_para(doc, "Triển khai 6 phase trong 8–10 tuần (Q2–Q3/2026):", bold=True)
    add_table(doc,
        ["Phase", "Tuần", "Nội dung", "Deliverable"],
        [
            ("1", "1–2", "Supabase Backend + Auth + Credit", "Schema + 8 Edge Functions + RLS"),
            ("2", "3–4", "Extension Integration", "Auth, Credit UI, License, Device Fingerprint"),
            ("3", "5–6", "PDF + Pie Chart Upgrade", "Pie/Bar Chart + PDF v1.1 nâng cao"),
            ("4", "7", "Pricing Website (Next.js)", "Landing + Pricing 3 cột + Stripe"),
            ("5", "8", "Team Dashboard + Referral", "Web dashboard + viral referral system"),
            ("6", "9–10", "Testing, Polish, Launch", "Chrome Web Store, Product Hunt"),
        ],
        col_widths_cm=[1.2, 1.5, 5.5, 7.8])

    add_heading(doc, "Phân tích rủi ro chính", 2)
    add_table(doc,
        ["#", "Rủi ro", "Mức độ", "Giải pháp"],
        [
            ("1", "Bypass credit (hack client)", "Trung bình",
             "Credit deduction server-side bắt buộc, JWT, rate limit"),
            ("2", "License chia sẻ (1 mua, nhiều người dùng)", "Cao",
             "Device fingerprint Canvas + WebGL + UA, tối đa 3 thiết bị/license"),
            ("3", "Tạo nhiều account để lấy free credit", "Cao",
             "Email verification + device fingerprint + IP rate limit"),
            ("4", "Stripe webhook giả mạo / duplicate", "Trung bình",
             "Verify signature + idempotency key"),
            ("5", "Conversion Free → Pro thấp", "Cao",
             "Tối ưu trial UX, A/B test pricing, social proof"),
            ("6", "Chrome Web Store reject", "Thấp",
             "Tuân thủ policies, minimal permissions, privacy disclosure"),
        ],
        col_widths_cm=[0.8, 5, 2, 8.2])

    add_heading(doc, "Kênh phân phối hàng hóa", 2)
    for b in [
        "Chrome Web Store — kênh chính, ~30% installs.",
        "Website focusproof.com với Pricing Page và Stripe Checkout.",
        "Product Hunt launch — kỳ vọng 200–500 installs trong 24h.",
        "Reddit (r/productivity, r/freelance) — 100–300 installs/post.",
        "TikTok / YouTube Shorts — demo viral.",
        "Referral viral từ user (+20–50 Credit/referral thành công).",
        "B2B outbound: trường đại học, doanh nghiệp SME — gói Team.",
    ]:
        add_bullet(doc, b)

    add_heading(doc, "Phát triển và mở rộng thị trường", 2)
    for b in [
        "Năm 1: 5,000 active users, MRR $1,287, hòa vốn tháng 4.",
        "Năm 2: 30,000 active users, MRR $10,000, ra mắt Mobile companion.",
        "Năm 3: 100,000 active users, MRR $35,000, mở rộng Edge/Firefox + API enterprise.",
        "Mở rộng địa lý: Việt Nam → Đông Nam Á → toàn cầu.",
        "Mở rộng segment: B2C → B2B (Education → Enterprise).",
    ]:
        add_bullet(doc, b)

    # ===== D. KẾT QUẢ TIỀM NĂNG =====
    add_heading(doc, "D. KẾT QUẢ TIỀM NĂNG CỦA DỰ ÁN", 1)

    add_heading(doc, "1. Các nguồn thu chính", 2)
    for b in [
        "Pro Subscription — $4.99/tháng hoặc $49/năm (chính, ~70% doanh thu).",
        "Team Subscription — $3.99/người/tháng, tối thiểu 5 người (~30% doanh thu).",
        "Tương lai: API enterprise, custom branding, white-label cho trường học.",
    ]:
        add_bullet(doc, b)

    add_heading(doc, "2. Dự kiến doanh thu năm 1 (Base case)", 2)
    add_table(doc,
        ["Tháng", "Total Users", "Pro", "Team (seats)", "MRR ($)", "Cum. Revenue ($)"],
        [
            ("M1", "200", "5", "0", "25", "25"),
            ("M3", "700", "22", "0", "110", "195"),
            ("M6", "2,000", "65", "10", "364", "1,032"),
            ("M9", "3,500", "135", "18", "745", "2,874"),
            ("M12", "5,000", "230", "35", "1,287", "6,165"),
        ],
        col_widths_cm=[1.5, 2.5, 1.5, 2.5, 2, 3])
    add_para(doc,
        "Annualized Run Rate (ARR) cuối năm 1: $15,440. "
        "Best case: $3,200 MRR ($38,400 ARR). Worst case: $400 MRR ($4,800 ARR).",
        align="justify")

    add_heading(doc, "3. Cấu trúc chi phí", 2)
    add_table(doc,
        ["Khoản mục", "M1–M3", "M4–M9", "M10–M12"],
        [
            ("Supabase", "$0", "$0", "$25"),
            ("Vercel", "$0", "$0", "$20"),
            ("OpenAI API", "$5", "$20", "$60"),
            ("Stripe phí (2.9% + $0.30)", "$1", "$15", "$45"),
            ("Email service", "$0", "$0", "$10"),
            ("Marketing", "$0", "$50", "$150"),
            ("TỔNG OPEX/tháng", "$6", "$85", "$310"),
        ],
        col_widths_cm=[6, 2.5, 2.5, 2.5])
    add_para(doc, "CAPEX one-time: ~$67 (domain $12, design $50, Chrome dev fee $5). "
                  "Tổng chi phí năm 1: ~$1,525.", align="justify")

    add_heading(doc, "4. Khả năng hoàn vốn", 2)
    for b in [
        "Hòa vốn: tháng thứ 4 sau launch (cumulative revenue $389 > cost $170).",
        "Lợi nhuận ròng năm 1: $6,165 − $1,525 ≈ $4,640.",
        "Tỷ suất lợi nhuận: ~75%.",
        "LTV/CAC ratio: ~40× (rất tốt cho SaaS).",
        "Payback period: 0.3 tháng (CAC ~$1.50, ARPU $4.99).",
    ]:
        add_bullet(doc, b)

    add_heading(doc, "5. Tăng trưởng và tác động xã hội", 2)
    for b in [
        "Tăng trưởng dự kiến: 5,000 → 30,000 → 100,000 active users (Y1 → Y2 → Y3).",
        "Cải thiện năng suất hàng triệu remote worker, bảo vệ quyền riêng tư.",
        "Hỗ trợ giáo dục từ xa và freelancer Việt Nam làm việc với khách hàng quốc tế.",
        "Đặt chuẩn mới về 'productivity proof' không xâm phạm quyền riêng tư.",
    ]:
        add_bullet(doc, b)

    # ===== E. NGUỒN LỰC =====
    add_heading(doc, "E. NGUỒN LỰC THỰC HIỆN", 1)
    for b in [
        f"Cá nhân thực hiện: {INFO['author_name']} (MSSV {INFO['student_id']}) — "
        "fullstack, đảm nhận toàn bộ phát triển, vận hành và marketing.",
        "Bảo trợ chuyên môn: Khoa CNTT — ĐH Tôn Đức Thắng (đề xuất).",
        "Đối tác kỹ thuật: Supabase, Vercel, Stripe, OpenAI, Google MediaPipe.",
        "Cộng tác: 2–3 sinh viên CNTT TDTU làm beta tester (volunteer).",
        "Vốn cần thiết 6 tháng đầu: ~$582 (~14.5 triệu VND).",
        "Nguồn vốn: tự có (founder), giải thưởng cuộc thi (2–5 triệu nếu đạt giải), "
        "doanh thu sớm M1–M6 (~$1,000+).",
        "Chiến lược BOOTSTRAP: gross margin 85% + break-even tháng 4 → "
        "không cần vốn ngoài trong giai đoạn đầu.",
    ]:
        add_bullet(doc, b)

    # ===== F. TRUYỀN THÔNG =====
    add_heading(doc, "F. CÁC KÊNH TRUYỀN THÔNG", 1)
    add_table(doc,
        ["Kênh", "Chi phí", "Hiệu quả dự kiến", "Giai đoạn"],
        [
            ("Chrome Web Store SEO", "Free", "30% tổng installs", "Liên tục"),
            ("Product Hunt launch", "Free", "200–500 installs/24h", "Launch day"),
            ("Reddit (r/productivity, r/freelance)", "Free", "100–300 installs/post", "Tuần đầu"),
            ("TikTok / YouTube Shorts", "Low", "Viral potential", "Tháng 1–6"),
            ("Facebook Group sinh viên TDTU", "Free", "50–100 installs/group", "Tháng 1–3"),
            ("Influencer micro VN", "$50–200/post", "200–1,000 installs", "Tháng 2–6"),
            ("Content blog (Medium, Dev.to)", "Free (time)", "Long-tail SEO", "Liên tục"),
            ("Google Ads", "$100/tháng", "50 installs/tháng", "Tháng 4+"),
            ("Partnership trường đại học", "Free outreach", "Team accounts", "Tháng 6+"),
        ],
        col_widths_cm=[5, 2.5, 4.5, 2.5])

    add_heading(doc, "Giải pháp truyền thông độc đáo & khác biệt", 2)
    for b in [
        "PDF Certificate có watermark + footer link — mỗi PDF user share là quảng cáo miễn phí "
        "(viral marketing built-in).",
        "QR Code verification: user share QR trên LinkedIn/Twitter → click → landing page → install.",
        "Referral viral loop: free user tự giới thiệu để lấy credit, tăng trưởng cấp số nhân.",
        "Open source partial: open source phần Core Engine trên GitHub → developer trust + backlinks SEO.",
        "Tận dụng trend 'productivity proof' hậu COVID — content phù hợp TikTok/Reels.",
    ]:
        add_bullet(doc, b)

    # ===== PHỤ LỤC =====
    doc.add_page_break()
    add_heading(doc, "PHỤ LỤC: SƠ ĐỒ MINH HỌA", 1)

    add_heading(doc, "Sơ đồ 1: Luồng hoạt động (User Flow)", 2)
    add_image(doc, images["user_flow"], width_cm=15,
              caption="Hình 1: Luồng hoạt động đầy đủ của người dùng FocusProof v1.1")

    add_heading(doc, "Sơ đồ 2: Kiến trúc hệ thống (System Architecture)", 2)
    add_image(doc, images["architecture"], width_cm=16,
              caption="Hình 2: Kiến trúc tổng thể Extension + Supabase Backend + Web App")

    add_heading(doc, "Sơ đồ 3: Mô hình kinh doanh (Business Model Flow)", 2)
    add_image(doc, images["business_model"], width_cm=15,
              caption="Hình 3: Mô hình kinh doanh Freemium + Viral loop")

    add_heading(doc, "Sơ đồ 4: Business Model Canvas (chuẩn 9 khối)", 2)
    add_image(doc, images["bmc"], width_cm=17,
              caption="Hình 4: Business Model Canvas — chuẩn 9 khối Osterwalder")

    add_heading(doc, "Sơ đồ 5: Credit Flow — Sequence Diagram", 2)
    add_image(doc, images["credit_flow"], width_cm=15,
              caption="Hình 5: Sequence diagram trừ Credit khi gọi AI Analysis")

    # Footer ngày
    doc.add_paragraph()
    add_para(doc, f"TP. Hồ Chí Minh, ngày {INFO['submit_date']}",
             italic=True, align="right")
    add_para(doc, "Người thực hiện", bold=True, align="right")
    add_para(doc, "(Ký, ghi rõ họ tên)", italic=True, align="right")
    doc.add_paragraph(); doc.add_paragraph()
    add_para(doc, INFO["author_name"], bold=True, align="right")
    add_para(doc, f"MSSV: {INFO['student_id']}", align="right")

    doc.save(str(OUTPUT))
    print(f"\n✅ DONE! Output: {OUTPUT}")
    print(f"   File size: {OUTPUT.stat().st_size // 1024} KB")
    print("=" * 70)


if __name__ == "__main__":
    main()
