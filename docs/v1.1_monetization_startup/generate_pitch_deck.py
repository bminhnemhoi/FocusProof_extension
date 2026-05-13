# -*- coding: utf-8 -*-
"""
FocusProof v1.1 - Generate Pitch Deck (PPTX) + Video Script (DOCX)
TECH STARTUP CHALLENGER 2026 - Khoa CNTT, DH Ton Duc Thang
Tac gia: Ngo Binh Minh - MSSV 524H0169

Theo "Goi y noi dung xay dung video gioi thieu du an":
  - Video toi da 3 phut, gom 5 phan:
    1. Gioi thieu nhom va thanh vien
    2. Cau chuyen truyen cam hung
    3. Trinh bay san pham
    4. Tinh kha thi trong kinh doanh
    5. Ket qua du kien + Ke hoach phat trien
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from docx import Document
from docx.shared import Pt as DPt, RGBColor as DRGB, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(__file__).parent
DIAG = ROOT / "_diagrams"
PPTX_OUT = ROOT / "FocusProof_Pitch_Deck.pptx"
SCRIPT_OUT = ROOT / "FocusProof_Video_Script.docx"

# Color palette (chuyen nghiep, tone xanh navy + cam nhan)
NAVY = RGBColor(0x0B, 0x2E, 0x4F)
TEAL = RGBColor(0x1F, 0x6F, 0x8B)
ORANGE = RGBColor(0xE8, 0x7A, 0x22)
BG_LIGHT = RGBColor(0xF4, 0xF7, 0xFA)
TEXT_DARK = RGBColor(0x1B, 0x1B, 0x1B)
TEXT_GRAY = RGBColor(0x55, 0x5B, 0x66)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Times New Roman"
FONT_BODY = "Times New Roman"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


# ---------- Helper functions ----------
def add_rect(slide, x, y, w, h, fill, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
    sh.shadow.inherit = False
    return sh


def add_text(slide, x, y, w, h, text, *, size=18, bold=False, color=TEXT_DARK,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font=FONT_BODY):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05)
    tf.margin_top = tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = anchor
    lines = text.split("\n") if isinstance(text, str) else list(text)
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = line
        r.font.name = font
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
    return tb


def add_bullets(slide, x, y, w, h, items, *, size=18, color=TEXT_DARK,
                bullet="•", spacing=6, font=FONT_BODY):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05)
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(spacing)
        r = p.add_run()
        r.text = f"{bullet}  {item}"
        r.font.name = font
        r.font.size = Pt(size)
        r.font.color.rgb = color
    return tb


def add_header(slide, title, subtitle=None):
    """Top accent bar + title."""
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.18), NAVY)
    add_rect(slide, 0, Inches(0.18), Inches(0.45), Inches(0.9), ORANGE)
    add_text(slide, Inches(0.6), Inches(0.25), Inches(11), Inches(0.7),
             title, size=30, bold=True, color=NAVY)
    if subtitle:
        add_text(slide, Inches(0.6), Inches(0.85), Inches(11), Inches(0.4),
                 subtitle, size=14, color=TEXT_GRAY)
    # divider
    add_rect(slide, Inches(0.6), Inches(1.25), Inches(12.1), Emu(15000), TEAL)


def add_footer(slide, page_num, total=12):
    add_text(slide, Inches(0.4), Inches(7.1), Inches(8), Inches(0.3),
             "FocusProof  |  Chứng chỉ Tập trung Thông minh & Xác thực  |  TECH STARTUP CHALLENGER 2026",
             size=10, color=TEXT_GRAY)
    add_text(slide, Inches(11.5), Inches(7.1), Inches(1.5), Inches(0.3),
             f"{page_num} / {total}", size=10, color=TEXT_GRAY, align=PP_ALIGN.RIGHT)


def new_slide(prs, layout_idx=6):
    return prs.slides.add_slide(prs.slide_layouts[layout_idx])  # 6 = blank


# ---------- Slides ----------
def slide_cover(prs):
    s = new_slide(prs)
    # background gradient feel (2 rectangles)
    add_rect(s, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    add_rect(s, 0, Inches(5.5), SLIDE_W, Inches(2.0), TEAL)
    add_rect(s, 0, Inches(5.5), SLIDE_W, Emu(20000), ORANGE)

    # Logo placeholder dot
    add_rect(s, Inches(0.7), Inches(0.7), Inches(0.6), Inches(0.6), ORANGE)
    add_text(s, Inches(1.45), Inches(0.7), Inches(6), Inches(0.6),
             "FocusProof", size=24, bold=True, color=WHITE)

    add_text(s, Inches(0.8), Inches(2.0), Inches(11.7), Inches(1.2),
             "FOCUSPROOF", size=60, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(3.0), Inches(11.7), Inches(0.9),
             "Chứng chỉ Tập trung Thông minh & Xác thực",
             size=30, bold=True, color=ORANGE)
    add_text(s, Inches(0.8), Inches(3.9), Inches(11.7), Inches(0.7),
             "Smart & Verifiable Focus Certificate",
             size=20, color=BG_LIGHT)
    add_text(s, Inches(0.8), Inches(4.6), Inches(11.7), Inches(0.6),
             "Biến mỗi giờ học thành một bằng chứng số có giá trị.",
             size=18, color=BG_LIGHT)

    add_text(s, Inches(0.8), Inches(5.9), Inches(11.7), Inches(0.5),
             "TECH STARTUP CHALLENGER 2026",
             size=16, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(6.35), Inches(11.7), Inches(0.4),
             "Tác giả: Ngô Bình Minh — MSSV 524H0169 — Khoa CNTT, ĐH Tôn Đức Thắng",
             size=14, color=BG_LIGHT)
    add_text(s, Inches(0.8), Inches(6.75), Inches(11.7), Inches(0.4),
             "TP. Hồ Chí Minh, tháng 04 / 2026",
             size=13, color=BG_LIGHT)


def slide_team(prs):
    s = new_slide(prs)
    add_header(s, "1.  Giới thiệu nhóm", "Solo Founder — TECH STARTUP CHALLENGER 2026")

    # Avatar block
    add_rect(s, Inches(0.8), Inches(1.7), Inches(3.2), Inches(4.6), BG_LIGHT)
    add_rect(s, Inches(0.8), Inches(1.7), Inches(3.2), Inches(0.4), NAVY)
    add_text(s, Inches(0.8), Inches(1.72), Inches(3.2), Inches(0.4),
             "FOUNDER", size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    # Avatar circle placeholder
    av = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.55), Inches(2.3),
                            Inches(1.7), Inches(1.7))
    av.fill.solid(); av.fill.fore_color.rgb = ORANGE
    av.line.color.rgb = NAVY
    add_text(s, Inches(1.55), Inches(2.3), Inches(1.7), Inches(1.7),
             "NBM", size=44, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    add_text(s, Inches(0.8), Inches(4.15), Inches(3.2), Inches(0.4),
             "Ngô Bình Minh", size=18, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.8), Inches(4.55), Inches(3.2), Inches(0.4),
             "MSSV 524H0169", size=13, color=TEXT_GRAY, align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.8), Inches(4.9), Inches(3.2), Inches(0.4),
             "SV năm 2 — CNTT — TDTU", size=13, color=TEXT_GRAY, align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.8), Inches(5.35), Inches(3.2), Inches(0.7),
             "Founder · Full-stack Dev\nUI/UX · AI Integrator",
             size=13, bold=True, color=TEAL, align=PP_ALIGN.CENTER)

    # Right side: roles & strengths
    add_text(s, Inches(4.4), Inches(1.7), Inches(8.3), Inches(0.5),
             "Vai trò trong dự án solo", size=20, bold=True, color=NAVY)
    add_bullets(s, Inches(4.5), Inches(2.25), Inches(8.3), Inches(2.6),
                [
                    "Product Owner — định hình ý tưởng, lộ trình và chiến lược kiếm tiền.",
                    "Full-stack Developer — Chrome Extension MV3, React, Supabase, Edge Functions.",
                    "AI/ML Engineer — tích hợp BlazeFace + GPT-4o cho Focus Score và phân tích.",
                    "UI/UX Designer — thiết kế popup, widget, trang chứng chỉ và landing.",
                    "Growth & Operations — viral loop, đối tác trường, hỗ trợ người dùng."
                ], size=15, spacing=4)

    add_text(s, Inches(4.4), Inches(4.95), Inches(8.3), Inches(0.5),
             "Lý do làm một mình", size=20, bold=True, color=NAVY)
    add_bullets(s, Inches(4.5), Inches(5.5), Inches(8.3), Inches(1.5),
                [
                    "Tốc độ: 1 người ra quyết định nhanh, không phụ thuộc lịch họp.",
                    "Toàn cảnh: nắm cả tech, sản phẩm và kinh doanh để hiểu user sâu nhất.",
                    "Sẵn sàng mở rộng team khi có doanh thu / nhà đầu tư đồng hành."
                ], size=15, spacing=4)

    add_footer(s, 2)


def slide_story(prs):
    s = new_slide(prs)
    add_header(s, "2.  Câu chuyện truyền cảm hứng",
               "Vì sao tôi xây FocusProof?")

    # Quote block
    add_rect(s, Inches(0.8), Inches(1.7), Inches(12), Inches(1.4), BG_LIGHT)
    add_rect(s, Inches(0.8), Inches(1.7), Inches(0.18), Inches(1.4), ORANGE)
    add_text(s, Inches(1.1), Inches(1.85), Inches(11.5), Inches(1.1),
             "“Tôi học 8 tiếng mỗi ngày, nhưng cha mẹ vẫn hỏi: con có thật sự học không?\n"
             "Tôi không có cách nào chứng minh — cho đến khi tự tay xây FocusProof.”",
             size=18, bold=True, color=NAVY)

    # 3-column story
    cols = [
        ("VẤN ĐỀ THẬT", ORANGE, [
            "85% sinh viên thừa nhận mất tập trung vì điện thoại & mạng xã hội.",
            "Cha mẹ, trường lớp, doanh nghiệp KHÔNG có công cụ kiểm chứng giờ học/làm thật.",
            "Pomodoro/Forest chỉ đếm thời gian — không xác thực được hành vi tập trung."
        ]),
        ("KHOẢNH KHẮC \"AHA\"", TEAL, [
            "Trong kỳ thi cuối năm, tôi muốn tự thưởng cho mình mỗi giờ tập trung thật sự.",
            "Tôi nhận ra: nếu có thể CHỨNG MINH giờ học, ta có thể đổi nó lấy phần thưởng / học bổng / việc làm.",
            "Tập trung phải trở thành một loại \"tài sản số\" có thể đo đếm và chia sẻ."
        ]),
        ("SỨ MỆNH", NAVY, [
            "Biến mỗi giờ tập trung thành một chứng chỉ số có thể xác thực.",
            "Giúp 5 triệu sinh viên & freelancer Việt Nam có \"hồ sơ kỷ luật\" minh bạch.",
            "Tạo nền kinh tế khen thưởng dựa trên dữ liệu tập trung thật."
        ]),
    ]
    x0 = Inches(0.8); y0 = Inches(3.4); cw = Inches(4.0); gap = Inches(0.1)
    for i, (title, color, items) in enumerate(cols):
        x = x0 + (cw + gap) * i
        add_rect(s, x, y0, cw, Inches(0.5), color)
        add_text(s, x, y0, cw, Inches(0.5), title,
                 size=14, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_rect(s, x, y0 + Inches(0.5), cw, Inches(3.0), BG_LIGHT)
        add_bullets(s, x + Inches(0.15), y0 + Inches(0.6), cw - Inches(0.3), Inches(2.9),
                    items, size=12, spacing=4, bullet="►")

    add_footer(s, 3)


def slide_problem_solution(prs):
    s = new_slide(prs)
    add_header(s, "3.  Sản phẩm — Vấn đề & Giải pháp")

    # Left: problem
    add_rect(s, Inches(0.8), Inches(1.6), Inches(5.9), Inches(5.3), BG_LIGHT)
    add_rect(s, Inches(0.8), Inches(1.6), Inches(5.9), Inches(0.55), ORANGE)
    add_text(s, Inches(0.8), Inches(1.6), Inches(5.9), Inches(0.55),
             "VẤN ĐỀ", size=18, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_bullets(s, Inches(1.0), Inches(2.3), Inches(5.5), Inches(4.5), [
        "Mất tập trung là \"đại dịch năng suất\" của Gen Z.",
        "Không có công cụ chứng minh việc học/làm thật cho cha mẹ, giáo viên, nhà tuyển dụng.",
        "Pomodoro/Forest: chỉ đếm giờ, dễ gian lận, không có dữ liệu hành vi.",
        "Học bổng & nội bộ doanh nghiệp thiếu cơ chế thưởng theo kỷ luật.",
        "Người dùng thiếu động lực dài hạn → bỏ app sau 1–2 tuần."
    ], size=14, spacing=6)

    # Right: solution
    add_rect(s, Inches(6.85), Inches(1.6), Inches(5.95), Inches(5.3), BG_LIGHT)
    add_rect(s, Inches(6.85), Inches(1.6), Inches(5.95), Inches(0.55), TEAL)
    add_text(s, Inches(6.85), Inches(1.6), Inches(5.95), Inches(0.55),
             "GIẢI PHÁP — FOCUSPROOF", size=18, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_bullets(s, Inches(7.05), Inches(2.3), Inches(5.55), Inches(4.5), [
        "Chrome Extension đo tập trung bằng 3 tín hiệu: Khuôn mặt + Hoạt động + Tab.",
        "Focus Score 0–100 chấm thật theo mục tiêu phiên học.",
        "Cấp Chứng chỉ PDF + QR xác thực online — chia sẻ với cha mẹ, giáo viên, nhà tuyển dụng.",
        "Gamification: streak, leaderboard, đổi điểm → tăng giữ chân.",
        "Freemium + Credit System + Pro/Team — kinh doanh bền vững."
    ], size=14, spacing=6)

    add_footer(s, 4)


def slide_engine(prs):
    s = new_slide(prs)
    add_header(s, "4.  Sản phẩm — Lõi công nghệ \"3-Signal Focus Engine\"",
               "USP — không đối thủ nào trên thị trường có cùng kiến trúc")

    img = DIAG / "focus_engine.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.6), Inches(1.5),
                             width=Inches(8.6))
    add_text(s, Inches(9.4), Inches(1.6), Inches(3.6), Inches(0.5),
             "3 tín hiệu", size=18, bold=True, color=NAVY)
    add_bullets(s, Inches(9.4), Inches(2.1), Inches(3.7), Inches(2.5), [
        "Khuôn mặt (BlazeFace) — tại chỗ trên trình duyệt, KHÔNG gửi ảnh.",
        "Hoạt động — chuột/bàn phím để loại idle giả tập trung.",
        "Tab/Domain — phân loại tab học vs giải trí theo mục tiêu."
    ], size=12, spacing=4)

    add_text(s, Inches(9.4), Inches(4.8), Inches(3.6), Inches(0.5),
             "Đầu ra", size=18, bold=True, color=NAVY)
    add_bullets(s, Inches(9.4), Inches(5.3), Inches(3.7), Inches(1.6), [
        "Focus Score 0–100 + biểu đồ.",
        "AI insight tiếng Việt (GPT-4o).",
        "PDF + QR xác thực chứng chỉ."
    ], size=12, spacing=4)

    add_footer(s, 5)


def slide_architecture(prs):
    s = new_slide(prs)
    add_header(s, "5.  Sản phẩm — Kiến trúc tổng thể",
               "Chrome Extension MV3 · Supabase · Web · Stripe · OpenAI")

    img = DIAG / "architecture.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.4), Inches(1.5),
                             width=Inches(9.2))

    add_text(s, Inches(9.8), Inches(1.6), Inches(3.3), Inches(0.5),
             "Tại sao kiến trúc này thắng?", size=15, bold=True, color=NAVY)
    add_bullets(s, Inches(9.8), Inches(2.1), Inches(3.3), Inches(5.0), [
        "Privacy-first: AI chạy ngay trên trình duyệt (BlazeFace).",
        "Server-side credit: chống gian lận, đếm AI/PDF chính xác.",
        "Supabase PostgreSQL: scale tới hàng trăm ngàn user với chi phí thấp.",
        "Stripe + Edge Function: thanh toán quốc tế ngay từ MVP.",
        "Tách biệt Free / Pro / Team — dễ thử nghiệm pricing."
    ], size=11, spacing=4)

    add_footer(s, 6)


def slide_demo(prs):
    s = new_slide(prs)
    add_header(s, "6.  Sản phẩm — Hành trình người dùng & Chứng chỉ")

    steps = [
        ("1", "Đặt mục tiêu", "User mở popup, chọn mục tiêu (vd: \"Học giải tích 60'\")."),
        ("2", "Bắt đầu phiên", "Cấp camera (chỉ tại chỗ) → Widget hiện điểm tập trung real-time."),
        ("3", "Engine chấm", "3-Signal Engine tính Focus Score mỗi 5s, cảnh báo khi mất tập trung."),
        ("4", "Kết thúc", "Báo cáo: điểm số, biểu đồ, AI insight, gợi ý cải thiện."),
        ("5", "Chứng chỉ", "PDF + QR — chia sẻ Facebook, gửi cha mẹ, dán vào CV."),
    ]
    y = Inches(1.6)
    for i, (n, title, desc) in enumerate(steps):
        x = Inches(0.6) + Inches(2.55) * i
        # circle number
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.95), y,
                               Inches(0.65), Inches(0.65))
        c.fill.solid(); c.fill.fore_color.rgb = ORANGE
        c.line.fill.background()
        add_text(s, x + Inches(0.95), y, Inches(0.65), Inches(0.65),
                 n, size=22, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_rect(s, x, y + Inches(0.85), Inches(2.45), Inches(2.5), BG_LIGHT)
        add_text(s, x + Inches(0.1), y + Inches(0.95), Inches(2.25), Inches(0.5),
                 title, size=14, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.1), y + Inches(1.45), Inches(2.25), Inches(1.9),
                 desc, size=11, color=TEXT_DARK, align=PP_ALIGN.CENTER)
        # arrow
        if i < len(steps) - 1:
            ar = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                    x + Inches(2.45), y + Inches(0.2),
                                    Inches(0.1), Inches(0.3))
            ar.fill.solid(); ar.fill.fore_color.rgb = TEAL
            ar.line.fill.background()

    # Bottom: certificate highlight
    add_rect(s, Inches(0.6), Inches(5.0), Inches(12.1), Inches(1.95), NAVY)
    add_text(s, Inches(0.8), Inches(5.1), Inches(11.7), Inches(0.5),
             "★  CHỨNG CHỈ FOCUSPROOF — \"BẰNG CHỨNG TẬP TRUNG\" CỦA BẠN",
             size=18, bold=True, color=ORANGE)
    add_bullets(s, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.4), [
        "Mỗi chứng chỉ có mã QR dẫn đến trang xác thực công khai (không thể giả mạo).",
        "Có thể chia sẻ với cha mẹ, giáo viên, nhà tuyển dụng, học bổng.",
        "Lưu vĩnh viễn trong tài khoản — tạo \"profile kỷ luật\" cá nhân."
    ], size=13, spacing=4, color=WHITE, bullet="►")

    add_footer(s, 7)


def slide_market(prs):
    s = new_slide(prs)
    add_header(s, "7.  Tính khả thi — Thị trường & Khách hàng",
               "Việt Nam là điểm khởi đầu, sản phẩm Born-Global ngay từ MVP")

    # TAM/SAM/SOM
    items = [
        ("TAM", "Toàn cầu", "≈ 1.6 tỷ học sinh – sinh viên + freelancer.\n≈ 50 tỷ USD ngành EdTech & năng suất.", ORANGE),
        ("SAM", "Đông Nam Á + VN", "≈ 30 triệu sinh viên & người làm tự do dùng Chrome.\n≈ 1.2 tỷ USD thị trường có thể tiếp cận.", TEAL),
        ("SOM", "3 năm đầu", "≈ 200.000 user trả phí khả thi.\n≈ 6 triệu USD doanh thu mục tiêu.", NAVY),
    ]
    for i, (k, sub, body, color) in enumerate(items):
        x = Inches(0.6) + Inches(4.25) * i
        add_rect(s, x, Inches(1.55), Inches(4.05), Inches(0.6), color)
        add_text(s, x, Inches(1.55), Inches(4.05), Inches(0.6),
                 f"{k} — {sub}", size=16, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_rect(s, x, Inches(2.15), Inches(4.05), Inches(2.0), BG_LIGHT)
        add_text(s, x + Inches(0.15), Inches(2.25), Inches(3.75), Inches(1.85),
                 body, size=13, color=TEXT_DARK, align=PP_ALIGN.LEFT)

    # Customer segments
    add_text(s, Inches(0.6), Inches(4.4), Inches(12.1), Inches(0.5),
             "Phân khúc khách hàng cốt lõi", size=18, bold=True, color=NAVY)
    segs = [
        ("Sinh viên\n18–24t", "Cá nhân Pro 49K/tháng. Cần chứng chỉ thật để xin học bổng, internship."),
        ("Phụ huynh\n& gia đình", "Mua Pro tặng con để theo dõi giờ học. Trả phí cho \"sự yên tâm\"."),
        ("Freelancer & Remote", "Cần báo cáo giờ làm cho khách hàng. Pro/Team 199K-499K/tháng."),
        ("Trường học\n& trung tâm", "Team plan. License theo lớp. Báo cáo nhóm cho giáo viên."),
    ]
    for i, (name, desc) in enumerate(segs):
        x = Inches(0.6) + Inches(3.05) * i
        add_rect(s, x, Inches(4.95), Inches(2.85), Inches(2.0), BG_LIGHT)
        add_rect(s, x, Inches(4.95), Inches(2.85), Inches(0.55), TEAL)
        add_text(s, x, Inches(4.95), Inches(2.85), Inches(0.55), name,
                 size=12, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_text(s, x + Inches(0.15), Inches(5.6), Inches(2.55), Inches(1.3),
                 desc, size=11, color=TEXT_DARK)

    add_footer(s, 8)


def slide_business(prs):
    s = new_slide(prs)
    add_header(s, "8.  Tính khả thi — Mô hình kinh doanh",
               "Freemium + Credit System + Pro/Team — không phụ thuộc quảng cáo")

    img = DIAG / "monetization.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.4), Inches(1.5),
                             width=Inches(7.2))

    add_text(s, Inches(7.8), Inches(1.55), Inches(5.3), Inches(0.5),
             "4 dòng tiền", size=18, bold=True, color=NAVY)
    add_bullets(s, Inches(7.85), Inches(2.05), Inches(5.3), Inches(2.0), [
        "Pro Cá nhân: 49.000 đ / tháng.",
        "Pro Team: 199.000 đ / tháng / 5 người.",
        "Trường & doanh nghiệp: từ 499.000 đ / tháng.",
        "Credit pack: 19K – 99K cho user thỉnh thoảng dùng AI/PDF."
    ], size=13, spacing=4)

    add_text(s, Inches(7.8), Inches(4.2), Inches(5.3), Inches(0.5),
             "Tại sao bền vững?", size=18, bold=True, color=NAVY)
    add_bullets(s, Inches(7.85), Inches(4.7), Inches(5.3), Inches(2.4), [
        "CAC ≤ 30K nhờ viral loop từ chứng chỉ chia sẻ.",
        "LTV ≈ 12 tháng × 49K = 588K → LTV/CAC ≈ 19×.",
        "Chi phí biên gần 0: AI on-device + Supabase free tier.",
        "Credit System chống gian lận, chống lạm dụng AI miễn phí."
    ], size=13, spacing=4)

    add_footer(s, 9)


def slide_bmc(prs):
    s = new_slide(prs)
    add_header(s, "9.  Tính khả thi — Business Model Canvas",
               "Theo chuẩn 9 khối Osterwalder")
    img = DIAG / "bmc.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.4), Inches(1.45),
                             width=Inches(12.5))
    add_footer(s, 10)


def slide_results_plan(prs):
    s = new_slide(prs)
    add_header(s, "10.  Kết quả dự kiến & Kế hoạch phát triển")

    # Left: 6-phase roadmap
    add_text(s, Inches(0.6), Inches(1.55), Inches(6), Inches(0.5),
             "Lộ trình 6 giai đoạn (8–10 tuần MVP, 12 tháng go-to-market)",
             size=15, bold=True, color=NAVY)

    phases = [
        ("Tuần 1–2", "Foundation + Engine MVP", TEAL),
        ("Tuần 3–4", "Gamification + Chứng chỉ + QR", TEAL),
        ("Tuần 5–6", "Freemium + Credit + Stripe", ORANGE),
        ("Tuần 7–8", "AI Insight + Diagnostic", ORANGE),
        ("Tuần 9–10", "Beta 100 user + Tối ưu", NAVY),
        ("Tháng 4–12", "Scale Việt Nam → Đông Nam Á", NAVY),
    ]
    y = Inches(2.1)
    for i, (when, what, color) in enumerate(phases):
        yy = y + Inches(0.65) * i
        add_rect(s, Inches(0.6), yy, Inches(1.5), Inches(0.5), color)
        add_text(s, Inches(0.6), yy, Inches(1.5), Inches(0.5), when,
                 size=12, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_rect(s, Inches(2.1), yy, Inches(4.5), Inches(0.5), BG_LIGHT)
        add_text(s, Inches(2.25), yy, Inches(4.4), Inches(0.5), what,
                 size=12, color=TEXT_DARK,
                 anchor=MSO_ANCHOR.MIDDLE)

    # Right: KPI
    add_text(s, Inches(7.0), Inches(1.55), Inches(5.7), Inches(0.5),
             "KPI 12 tháng đầu", size=15, bold=True, color=NAVY)
    kpis = [
        ("10.000", "Người dùng cài đặt"),
        ("1.500", "Người dùng trả phí (Pro+Team)"),
        ("≥ 30%", "Tỉ lệ giữ chân tháng 2"),
        ("≈ 880 tr đ", "Doanh thu năm 1 (~36.000 USD)"),
        ("LTV/CAC ≈ 19×", "Đơn vị kinh tế lành mạnh"),
        ("Hoà vốn", "Tháng thứ 8–9"),
    ]
    y2 = Inches(2.1)
    for i, (num, label) in enumerate(kpis):
        col = i % 2
        row = i // 2
        x = Inches(7.0) + Inches(2.9) * col
        yy = y2 + Inches(1.4) * row
        add_rect(s, x, yy, Inches(2.75), Inches(1.25), BG_LIGHT)
        add_rect(s, x, yy, Inches(0.12), Inches(1.25), ORANGE)
        add_text(s, x + Inches(0.2), yy + Inches(0.1), Inches(2.5), Inches(0.6),
                 num, size=22, bold=True, color=NAVY)
        add_text(s, x + Inches(0.2), yy + Inches(0.7), Inches(2.5), Inches(0.5),
                 label, size=11, color=TEXT_GRAY)

    add_footer(s, 11)


def slide_cta(prs):
    s = new_slide(prs)
    add_rect(s, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    add_rect(s, 0, Inches(6.0), SLIDE_W, Inches(1.5), TEAL)
    add_rect(s, 0, Inches(6.0), SLIDE_W, Emu(20000), ORANGE)

    add_text(s, Inches(0.8), Inches(1.5), Inches(11.7), Inches(1.0),
             "FOCUSPROOF", size=54, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(2.4), Inches(11.7), Inches(0.8),
             "Tập trung không còn là cảm giác — mà là một bằng chứng có thể xác thực.",
             size=22, bold=True, color=ORANGE)

    add_text(s, Inches(0.8), Inches(3.6), Inches(11.7), Inches(0.5),
             "Lời kêu gọi", size=18, bold=True, color=BG_LIGHT)
    add_bullets(s, Inches(0.8), Inches(4.1), Inches(11.7), Inches(1.8), [
        "Đồng hành cùng FocusProof để biến mỗi giờ học của 5 triệu sinh viên Việt Nam thành tài sản số.",
        "Tìm Mentor & Đối tác trường — thử nghiệm Team plan miễn phí cho 3 lớp đầu tiên.",
        "Gọi vốn hạt giống 500 triệu đồng để mở rộng đội ngũ và go-to-market Đông Nam Á."
    ], size=15, spacing=8, color=BG_LIGHT, bullet="►")

    add_text(s, Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.5),
             "Liên hệ", size=14, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(6.6), Inches(11.7), Inches(0.5),
             "Ngô Bình Minh — MSSV 524H0169 — Khoa CNTT — ĐH Tôn Đức Thắng",
             size=14, color=WHITE)
    add_text(s, Inches(0.8), Inches(6.95), Inches(11.7), Inches(0.4),
             "Email: [điền email] · SĐT: [điền số] · Website: focusproof.app (dự kiến)",
             size=12, color=BG_LIGHT)


# ---------- Build PPTX ----------
def build_pptx():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_cover(prs)
    slide_team(prs)
    slide_story(prs)
    slide_problem_solution(prs)
    slide_engine(prs)
    slide_architecture(prs)
    slide_demo(prs)
    slide_market(prs)
    slide_business(prs)
    slide_bmc(prs)
    slide_results_plan(prs)
    slide_cta(prs)

    prs.save(PPTX_OUT)
    print(f"   [OK] {PPTX_OUT.name} ({PPTX_OUT.stat().st_size // 1024} KB, {len(prs.slides)} slides)")


# ---------- Build Script DOCX ----------
SCRIPT_SECTIONS = [
    {
        "time": "0:00 — 0:15",
        "slide": "Slide 1 — Trang bìa",
        "title": "MỞ ĐẦU — HOOK",
        "stage": "Đứng trước camera, nhìn thẳng, nói chậm và rõ. Nền: logo FocusProof.",
        "speech": (
            "Xin chào ban giám khảo TECH STARTUP CHALLENGER 2026. "
            "Tôi là Ngô Bình Minh — MSSV 524H0169. "
            "Hôm nay tôi xin giới thiệu FocusProof — Chứng chỉ Tập trung Thông minh & Xác thực — "
            "một sản phẩm biến mỗi giờ học của bạn thành một bằng chứng số có giá trị thật."
        )
    },
    {
        "time": "0:15 — 0:30",
        "slide": "Slide 2 — Giới thiệu nhóm",
        "title": "1. GIỚI THIỆU NHÓM",
        "stage": "Đổi sang slide \"Founder\". Hiện avatar + 5 vai trò. Giọng tự tin.",
        "speech": (
            "FocusProof là dự án solo. Tôi đảm nhận cả vai trò sản phẩm, "
            "lập trình full-stack Chrome Extension và backend Supabase, tích hợp AI GPT-4o, "
            "thiết kế UI/UX, và vận hành tăng trưởng. "
            "Một mình giúp tôi ra quyết định nhanh — và tôi sẵn sàng mở rộng đội khi có doanh thu."
        )
    },
    {
        "time": "0:30 — 0:50",
        "slide": "Slide 3 — Câu chuyện cảm hứng",
        "title": "2. CÂU CHUYỆN TRUYỀN CẢM HỨNG",
        "stage": "Slide với câu trích dẫn. Giảm nhịp lại, kể chuyện chân thật.",
        "speech": (
            "Năm hai đại học, tôi học 8 tiếng mỗi ngày — nhưng cha mẹ vẫn hỏi: "
            "“Con có thật sự học không?”. Tôi không có cách nào chứng minh. "
            "Khoảng 85% sinh viên cũng chia sẻ cảm giác mất tập trung và bị nghi ngờ y như vậy. "
            "Vì thế tôi tự xây FocusProof — để mỗi giờ tập trung của tôi, và của hàng triệu bạn trẻ Việt Nam, "
            "trở thành một tài sản số có thể đo đếm và chia sẻ."
        )
    },
    {
        "time": "0:50 — 1:25",
        "slide": "Slide 4–6 — Sản phẩm: vấn đề/giải pháp, 3-Signal Engine, kiến trúc",
        "title": "3. TRÌNH BÀY SẢN PHẨM",
        "stage": "Chuyển nhanh 3 slide. Khi nói tới 3-Signal, dùng tay gạch 3 ngón.",
        "speech": (
            "FocusProof là một Chrome Extension. Lõi công nghệ là 3-Signal Focus Engine — "
            "kết hợp ba tín hiệu: nhận diện khuôn mặt bằng BlazeFace ngay trên trình duyệt, "
            "hoạt động chuột-bàn phím, và phân loại tab theo mục tiêu phiên học. "
            "Hệ thống chấm Focus Score 0–100 mỗi 5 giây, sau đó GPT-4o tóm tắt buổi học bằng tiếng Việt "
            "và xuất chứng chỉ PDF kèm mã QR xác thực công khai. "
            "Toàn bộ AI khuôn mặt chạy tại chỗ — chúng tôi KHÔNG gửi ảnh ra server, đảm bảo quyền riêng tư."
        )
    },
    {
        "time": "1:25 — 1:50",
        "slide": "Slide 6 — User journey & Chứng chỉ",
        "title": "ĐIỂM KHÁC BIỆT — CHỨNG CHỈ",
        "stage": "Phóng to slide chứng chỉ. Nhấn mạnh \"verifiable\".",
        "speech": (
            "Khác Pomodoro hay Forest — vốn chỉ đếm thời gian — FocusProof CẤP một chứng chỉ thật. "
            "Mỗi chứng chỉ có mã QR dẫn tới trang xác thực công khai, không thể giả mạo. "
            "Sinh viên có thể chia sẻ với phụ huynh, gửi giáo viên, đính kèm hồ sơ học bổng, hoặc dán vào CV. "
            "Đây là điểm độc đáo chưa từng có trên thị trường công cụ tập trung."
        )
    },
    {
        "time": "1:50 — 2:20",
        "slide": "Slide 7–9 — Thị trường, mô hình kinh doanh, BMC",
        "title": "4. TÍNH KHẢ THI KINH DOANH",
        "stage": "Slide thị trường → mô hình → BMC. Nhịp nhanh, số liệu rõ.",
        "speech": (
            "Thị trường mục tiêu: 30 triệu sinh viên và freelancer Đông Nam Á dùng Chrome — "
            "tương đương 1,2 tỷ USD SAM. Trong 3 năm đầu, FocusProof đặt mục tiêu 200.000 user trả phí. "
            "Mô hình kinh doanh: Freemium kết hợp Credit System và gói Pro 49.000 đồng / tháng, "
            "Team 199.000, Trường học 499.000 trở lên. "
            "Chi phí biên gần bằng 0 nhờ AI tại chỗ và Supabase free tier. "
            "Kết quả: LTV trên CAC khoảng 19 lần — một đơn vị kinh tế cực kỳ lành mạnh."
        )
    },
    {
        "time": "2:20 — 2:45",
        "slide": "Slide 10 — Kết quả dự kiến & Kế hoạch",
        "title": "5. KẾT QUẢ DỰ KIẾN & KẾ HOẠCH",
        "stage": "Slide KPI + lộ trình 6 giai đoạn. Nói chậm con số.",
        "speech": (
            "Lộ trình 8–10 tuần đã hoàn thành MVP với 3-Signal Engine, hệ thống chứng chỉ, freemium và Stripe. "
            "Năm đầu tiên FocusProof hướng tới 10.000 lượt cài đặt, 1.500 người dùng trả phí, "
            "doanh thu xấp xỉ 880 triệu đồng và hoà vốn vào tháng thứ 8 đến thứ 9. "
            "Sau đó, mở rộng Team plan tới các trường đại học và đi ra thị trường Đông Nam Á."
        )
    },
    {
        "time": "2:45 — 3:00",
        "slide": "Slide 11 — Call to action",
        "title": "KÊU GỌI & CẢM ƠN",
        "stage": "Nhìn thẳng, mỉm cười, chậm và chắc.",
        "speech": (
            "FocusProof không chỉ là một extension — đó là cách biến kỷ luật cá nhân "
            "thành một loại tài sản số có thể chứng minh. "
            "Tôi mong nhận được sự đồng hành của ban giám khảo, mentor và các đối tác trường. "
            "Xin trân trọng cảm ơn — và tập trung không còn là cảm giác, mà là một bằng chứng."
        )
    },
]


def _add_para(doc, text, *, size=12, bold=False, color=None, align=None,
              space_before=0, space_after=4):
    p = doc.add_paragraph()
    if align:
        p.alignment = align
    pf = p.paragraph_format
    pf.space_before = DPt(space_before)
    pf.space_after = DPt(space_after)
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = DPt(size)
    r.font.bold = bold
    if color:
        r.font.color.rgb = color
    return p


def build_script():
    doc = Document()
    # Page margins
    for sec in doc.sections:
        sec.top_margin = Cm(2)
        sec.bottom_margin = Cm(2)
        sec.left_margin = Cm(2.2)
        sec.right_margin = Cm(2.2)

    _add_para(doc, "KỊCH BẢN VIDEO THUYẾT TRÌNH — 3 PHÚT",
              size=20, bold=True, color=DRGB(0x0B, 0x2E, 0x4F),
              align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    _add_para(doc, "FocusProof — Chứng chỉ Tập trung Thông minh & Xác thực",
              size=14, bold=True, color=DRGB(0xE8, 0x7A, 0x22),
              align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    _add_para(doc, "TECH STARTUP CHALLENGER 2026 — Khoa CNTT, ĐH Tôn Đức Thắng",
              size=12, color=DRGB(0x55, 0x5B, 0x66),
              align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    _add_para(doc, "Tác giả: Ngô Bình Minh — MSSV 524H0169",
              size=12, color=DRGB(0x55, 0x5B, 0x66),
              align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)

    # Tổng quan
    _add_para(doc, "TỔNG QUAN", size=14, bold=True,
              color=DRGB(0x0B, 0x2E, 0x4F), space_after=4)
    summary_table = doc.add_table(rows=1, cols=2)
    summary_table.style = "Light Grid Accent 1"
    cells = summary_table.rows[0].cells
    cells[0].text = "Thời lượng tổng"
    cells[1].text = "≤ 03 phút (180 giây)"
    for k, v in [
        ("Cấu trúc", "5 phần theo gợi ý của BTC + Hook + Call-to-action"),
        ("Tổng số chữ", "≈ 470 từ tiếng Việt — đảm bảo đủ thời lượng"),
        ("Tốc độ nói", "≈ 155 từ/phút — rõ ràng, có nhấn nhá"),
        ("Yêu cầu hình ảnh", "12 slide PPTX kèm theo (FocusProof_Pitch_Deck.pptx)"),
        ("Phong cách", "Tự tin — câu chuyện cá nhân — số liệu — kêu gọi hành động"),
    ]:
        row = summary_table.add_row().cells
        row[0].text = k
        row[1].text = v
    for row in summary_table.rows:
        for c in row.cells:
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.name = "Times New Roman"
                    r.font.size = DPt(11)

    doc.add_paragraph()
    _add_para(doc, "LƯU Ý KHI QUAY", size=14, bold=True,
              color=DRGB(0x0B, 0x2E, 0x4F), space_after=4)
    for note in [
        "Quay ngang 16:9, ánh sáng từ phía trước, nền sạch (tường trơn / bảng trắng).",
        "Mặc áo sơ mi tối màu hoặc đồng phục TDTU. Cài micro hoặc dùng micro thu rời.",
        "Mỗi slide hiển thị tối thiểu 8 giây — đồng bộ với mốc thời gian dưới đây.",
        "Đoạn HOOK (0:00–0:15) nên có nhạc nhẹ, dừng nhạc khi vào phần SẢN PHẨM.",
        "Cuối video: hiện logo + email + QR website FocusProof trong 3 giây.",
    ]:
        _add_para(doc, "•  " + note, size=11)

    doc.add_paragraph()
    _add_para(doc, "KỊCH BẢN CHI TIẾT", size=16, bold=True,
              color=DRGB(0x0B, 0x2E, 0x4F),
              align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)

    for sec in SCRIPT_SECTIONS:
        # Header bar
        tbl = doc.add_table(rows=1, cols=2)
        tbl.autofit = False
        tbl.columns[0].width = Cm(4.0)
        tbl.columns[1].width = Cm(12.5)
        h = tbl.rows[0].cells
        h[0].text = sec["time"]
        h[1].text = sec["title"]
        for ci, c in enumerate(h):
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.name = "Times New Roman"
                    r.font.size = DPt(13)
                    r.font.bold = True
                    r.font.color.rgb = DRGB(0xFF, 0xFF, 0xFF)
            # background color
            from docx.oxml.ns import qn
            from docx.oxml import OxmlElement
            tc_pr = c._tc.get_or_add_tcPr()
            shd = OxmlElement("w:shd")
            shd.set(qn("w:fill"), "0B2E4F" if ci == 0 else "1F6F8B")
            tc_pr.append(shd)

        _add_para(doc, "Slide: " + sec["slide"], size=11, bold=True,
                  color=DRGB(0xE8, 0x7A, 0x22), space_before=4, space_after=2)
        _add_para(doc, "Hành động & sân khấu: " + sec["stage"],
                  size=11, color=DRGB(0x55, 0x5B, 0x66), space_after=4)
        _add_para(doc, "Lời thoại:", size=11, bold=True,
                  color=DRGB(0x0B, 0x2E, 0x4F), space_after=2)
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.5)
        p.paragraph_format.space_after = DPt(10)
        r = p.add_run("“" + sec["speech"] + "”")
        r.font.name = "Times New Roman"
        r.font.size = DPt(12.5)
        r.italic = True

    # Closing checklist
    _add_para(doc, "CHECKLIST TRƯỚC KHI NỘP",
              size=14, bold=True, color=DRGB(0x0B, 0x2E, 0x4F),
              space_before=6, space_after=4)
    for item in [
        "Quay đủ 5 phần theo gợi ý của BTC.",
        "Tổng thời lượng KHÔNG vượt quá 03:00.",
        "Lời thoại trùng khớp slide đang chiếu.",
        "Có giới thiệu họ tên + MSSV ở 15 giây đầu.",
        "Có phần Call-to-action ở 15 giây cuối.",
        "Xuất video MP4 1080p, bitrate ≥ 8 Mbps, audio AAC 192 kbps.",
        "Đặt tên file: FocusProof_NgoBinhMinh_524H0169.mp4",
    ]:
        _add_para(doc, "☐  " + item, size=11)

    doc.save(SCRIPT_OUT)
    print(f"   [OK] {SCRIPT_OUT.name} ({SCRIPT_OUT.stat().st_size // 1024} KB)")


def main():
    print("=" * 70)
    print("  FocusProof v1.1 — Generate Pitch Deck (PPTX) + Video Script")
    print("=" * 70)
    print("\n[1/2] Build PPTX...")
    build_pptx()
    print("\n[2/2] Build Script DOCX...")
    build_script()
    print("\n DONE!")
    print(f"   PPTX  : {PPTX_OUT}")
    print(f"   Script: {SCRIPT_OUT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
