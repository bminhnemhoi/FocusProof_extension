# -*- coding: utf-8 -*-
"""
FocusProof — VIBE CODING 2026 — Sinh ảnh minh hoạ cho slide VC2026-A-HT13.pptx
Toàn bộ ảnh tự tạo bằng matplotlib + PIL (không dùng tài nguyên ngoài).
"""
from pathlib import Path
import math

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Wedge, Rectangle
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import qrcode

ROOT = Path(__file__).parent
OUT = ROOT / "_assets"
OUT.mkdir(exist_ok=True)
PROJ = ROOT.parent.parent  # d:\Extension_FocusProof

# ---------------- Palette (đồng bộ logo indigo -> cyan) ----------------
INK = "#0F172A"
SLATE = "#475569"
MUTE = "#94A3B8"
INDIGO = "#4F46E5"
VIOLET = "#7C3AED"
CYAN = "#06B6D4"
SKY = "#0EA5E9"
AMBER = "#F59E0B"
GREEN = "#10B981"
RED = "#EF4444"
PANEL = "#F1F5F9"
BORDER = "#E2E8F0"
DARK1 = (10, 16, 34)      # #0A1022
DARK2 = (22, 30, 62)      # #161E3E

plt.rcParams["font.family"] = "Segoe UI"
plt.rcParams["axes.edgecolor"] = BORDER
plt.rcParams["svg.fonttype"] = "none"

FONT_DIR = Path("C:/Windows/Fonts")


def pil_font(name: str, size: int):
    candidates = {
        "bold": ["segoeuib.ttf", "arialbd.ttf"],
        "semibold": ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"],
        "regular": ["segoeui.ttf", "arial.ttf"],
        "light": ["segoeuil.ttf", "segoeui.ttf", "arial.ttf"],
        "mono": ["consola.ttf", "cour.ttf"],
    }[name]
    for c in candidates:
        p = FONT_DIR / c
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def hx(color: str):
    color = color.lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))


# ======================================================================
# 1) HERO BACKGROUND (dark, gradient + glow) — dùng cho slide bìa & kết
# ======================================================================
def make_hero_bg():
    W, H = 1920, 1080
    img = Image.new("RGB", (W, H))
    # vertical gradient
    top, bottom = DARK1, DARK2
    for y in range(H):
        t = y / H
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        ImageDraw.Draw(img).line([(0, y), (W, y)], fill=(r, g, b))

    # glow layer
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * 0.62, -H * 0.35, W * 1.25, H * 0.55], fill=(38, 34, 120))   # indigo
    gd.ellipse([-W * 0.25, H * 0.55, W * 0.35, H * 1.35], fill=(6, 60, 84))     # cyan
    gd.ellipse([W * 0.30, H * 0.75, W * 0.62, H * 1.15], fill=(40, 26, 12))     # amber nhẹ
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    img = Image.blend(img, Image.composite(glow, img, Image.new("L", (W, H), 255)), 0.0)
    arr = np.array(img).astype(int) + np.array(glow).astype(int)
    img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))

    d = ImageDraw.Draw(img, "RGBA")
    # dot grid
    for gx in range(60, W, 62):
        for gy in range(60, H, 62):
            d.ellipse([gx, gy, gx + 2, gy + 2], fill=(255, 255, 255, 14))
    # concentric focus rings (motif "ống kính")
    cx, cy = int(W * 0.845), int(H * 0.30)
    for rr, a in [(340, 26), (260, 34), (185, 44)]:
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(120, 140, 255, a), width=2)
    d.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], outline=(34, 211, 238, 70), width=3)
    # check mark trong ring
    d.line([(cx - 45, cy + 5), (cx - 8, cy + 42), (cx + 62, cy - 40)],
           fill=(34, 211, 238, 200), width=10, joint="curve")
    # đường chéo mảnh
    for i in range(-3, 4):
        x0 = W * 0.06 + i * 26
        d.line([(x0, H * 0.16), (x0 + 130, H * 0.16 + 130)], fill=(255, 255, 255, 10), width=2)
    img.save(OUT / "hero_bg.png")
    print("  [OK] hero_bg.png")


# ======================================================================
# 2) LOGO MARK — cắt phần biểu tượng (bỏ wordmark) từ icon512
# ======================================================================
def make_logo_mark():
    src = PROJ / "public" / "icons" / "icon512.png"
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    top = im.crop((0, 0, w, int(h * 0.66)))  # phần trên chứa biểu tượng
    bbox = top.getbbox()
    if bbox:
        top = top.crop(bbox)
    top.save(OUT / "logo_mark.png")
    print("  [OK] logo_mark.png")


# ======================================================================
# helpers matplotlib
# ======================================================================
def new_fig(w=16, h=9, dpi=170, face="white"):
    fig = plt.figure(figsize=(w, h), dpi=dpi)
    fig.patch.set_facecolor(face)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, w)
    ax.set_ylim(0, h)
    ax.axis("off")
    return fig, ax


def card(ax, x, y, w, h, fc="white", ec=BORDER, lw=1.4, r=0.16, z=2):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0,rounding_size={r}",
                       fc=fc, ec=ec, lw=lw, zorder=z)
    ax.add_patch(p)
    return p


def arrow(ax, x1, y1, x2, y2, color=SLATE, lw=2.4, style="-|>", curve=0.0, z=3, ls="-"):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                        mutation_scale=20, lw=lw, color=color,
                        connectionstyle=f"arc3,rad={curve}", zorder=z, linestyle=ls)
    ax.add_patch(a)


def icon_camera(ax, cx, cy, s, color):
    card(ax, cx - s * 0.85, cy - s * 0.6, s * 1.7, s * 1.15, fc=color, ec="none", r=0.10, z=4)
    ax.add_patch(Rectangle((cx - s * 0.28, cy + s * 0.55), s * 0.56, s * 0.22, fc=color, ec="none", zorder=4))
    ax.add_patch(Circle((cx, cy - 0.02), s * 0.38, fc="white", ec="none", zorder=5))
    ax.add_patch(Circle((cx, cy - 0.02), s * 0.20, fc=color, ec="none", zorder=6))


def icon_activity(ax, cx, cy, s, color):
    # bàn phím
    card(ax, cx - s * 0.95, cy - s * 0.55, s * 1.35, s * 0.85, fc=color, ec="none", r=0.08, z=4)
    for i in range(3):
        for j in range(2):
            ax.add_patch(Rectangle((cx - s * 0.82 + i * s * 0.38, cy - s * 0.38 + j * s * 0.30),
                                   s * 0.26, s * 0.18, fc="white", ec="none", zorder=5))
    # chuột
    ax.add_patch(FancyBboxPatch((cx + s * 0.52, cy - s * 0.55), s * 0.45, s * 0.9,
                                boxstyle="round,pad=0,rounding_size=0.14",
                                fc=color, ec="none", zorder=4))
    ax.plot([cx + s * 0.745, cx + s * 0.745], [cy + 0.02, cy + s * 0.3],
            color="white", lw=2.2, zorder=5)


def icon_globe(ax, cx, cy, s, color):
    ax.add_patch(Circle((cx, cy), s * 0.62, fc=color, ec="none", zorder=4))
    from matplotlib.patches import Arc
    for wdt in (s * 0.5, s * 1.0):
        ax.add_patch(Arc((cx, cy), wdt, s * 1.24, theta1=0, theta2=360,
                         ec="white", lw=1.8, zorder=5))
    ax.plot([cx - s * 0.62, cx + s * 0.62], [cy, cy], color="white", lw=1.8, zorder=5)
    ax.plot([cx - s * 0.5, cx + s * 0.5], [cy + s * 0.3, cy + s * 0.3], color="white", lw=1.4, zorder=5)
    ax.plot([cx - s * 0.5, cx + s * 0.5], [cy - s * 0.3, cy - s * 0.3], color="white", lw=1.4, zorder=5)


# ======================================================================
# 3) SƠ ĐỒ 3-SIGNAL FOCUS ENGINE
# ======================================================================
def make_three_signals():
    fig, ax = new_fig(16, 9)

    signals = [
        (7.3, INDIGO, "TÍN HIỆU KHUÔN MẶT", "BlazeFace (MediaPipe WASM)\nchạy 100% trên máy người dùng\n— không ảnh nào rời thiết bị", icon_camera),
        (4.55, SKY, "TÍN HIỆU HOẠT ĐỘNG", "Chuột & bàn phím\nphát hiện idle / treo máy\n— loại \"giả vờ ngồi học\"", icon_activity),
        (1.8, CYAN, "TÍN HIỆU TAB / DOMAIN", "Đối chiếu tab đang mở với\nmục tiêu phiên học\n— chặn lách subdomain giả", icon_globe),
    ]
    for y, color, title, desc, icon in signals:
        card(ax, 0.55, y - 1.08, 4.9, 2.28, fc="white", ec=BORDER, lw=1.6)
        ax.add_patch(Rectangle((0.55, y - 1.08), 0.14, 2.28, fc=color, ec="none", zorder=3))
        icon(ax, 1.55, y + 0.42, 0.52, color)
        ax.text(2.45, y + 0.62, title, fontsize=15.5, fontweight="bold", color=INK, va="center")
        ax.text(2.45, y - 0.28, desc, fontsize=11.5, color=SLATE, va="center", linespacing=1.5)
        arrow(ax, 5.55, y + 0.06, 6.9, 4.62 + (y - 4.55) * 0.12, color=color, lw=3.0, curve=-0.12)

    # engine
    card(ax, 6.95, 3.0, 3.6, 3.2, fc=INK, ec="none", r=0.22)
    ax.add_patch(Circle((8.75, 5.32), 0.42, fc="none", ec=CYAN, lw=3, zorder=5))
    ax.add_patch(Circle((8.75, 5.32), 0.20, fc=CYAN, ec="none", zorder=5))
    for k in range(8):
        aa = k * math.pi / 4
        x0, y0 = 8.75 + 0.52 * math.cos(aa), 5.32 + 0.52 * math.sin(aa)
        x1, y1 = 8.75 + 0.68 * math.cos(aa), 5.32 + 0.68 * math.sin(aa)
        ax.plot([x0, x1], [y0, y1], color=CYAN, lw=3, zorder=5)
    ax.text(8.75, 4.42, "3-SIGNAL\nFOCUS ENGINE", fontsize=17, fontweight="bold",
            color="white", ha="center", va="center", linespacing=1.25)
    ax.text(8.75, 3.55, "chấm điểm mỗi ~6 giây\nngay trong Service Worker", fontsize=10.5,
            color="#A5B4FC", ha="center", va="center", linespacing=1.4)

    # outputs
    outputs = [
        (6.6, AMBER, "FOCUS SCORE 0–100", "Điểm + xếp hạng A/B/C\nbiểu đồ diễn biến phiên"),
        (4.55, GREEN, "CẢNH BÁO THỜI GIAN THỰC", "Mất mặt / idle / sai tab /\nrời Chrome — đếm thật, lưu thật"),
        (2.5, VIOLET, "CHỨNG CHỈ PDF + QR", "Ký HMAC phía máy chủ\nquét QR ra trang xác thực"),
    ]
    for y, color, title, desc in outputs:
        arrow(ax, 10.6, 4.6 + (y - 4.55) * 0.12, 11.6, y - 0.15, color=color, lw=3.0, curve=-0.10)
        card(ax, 11.65, y - 1.02, 3.85, 1.85, fc="white", ec=BORDER, lw=1.6)
        ax.add_patch(Rectangle((11.65, y + 0.63), 3.85, 0.2, fc=color, ec="none", zorder=3))
        ax.text(11.85, y + 0.30, title, fontsize=13.5, fontweight="bold", color=INK, va="center")
        ax.text(11.85, y - 0.42, desc, fontsize=10.5, color=SLATE, va="center", linespacing=1.45)

    ax.text(8.0, 0.72, "GIẢ 1 TÍN HIỆU THÌ DỄ — GIẢ CẢ 3 CÙNG LÚC GẦN NHƯ PHẢI... HỌC THẬT",
            fontsize=15, fontweight="bold", color=INK, ha="center")
    ax.text(8.0, 0.28, "Ba tín hiệu độc lập kiểm chứng chéo (triangulation) — đo hành vi tập trung khách quan, không suy diễn cảm xúc",
            fontsize=11.5, color=SLATE, ha="center")

    fig.savefig(OUT / "three_signals.png", facecolor="white")
    plt.close(fig)
    print("  [OK] three_signals.png")


# ======================================================================
# 4) KIẾN TRÚC HỆ THỐNG
# ======================================================================
def make_architecture():
    fig, ax = new_fig(16, 9)

    # ---- Chrome Extension container ----
    card(ax, 0.5, 1.35, 8.3, 6.6, fc="#F8FAFC", ec=INDIGO, lw=2.0, r=0.2)
    ax.text(0.9, 7.45, "CHROME EXTENSION — Manifest V3", fontsize=16, fontweight="bold", color=INDIGO)
    ax.text(0.9, 7.02, "Hoạt động đầy đủ offline · dữ liệu trong chrome.storage.local", fontsize=10.5, color=SLATE)

    boxes = [
        (0.95, 4.6, 3.5, 1.9, "POPUP (React 18 + TS)", "Điều khiển phiên · kết quả ·\nlịch sử · Diagnostic Dashboard", INDIGO),
        (4.85, 4.6, 3.5, 1.9, "SERVICE WORKER", "Vòng lặp chấm điểm ~6s ·\nwatchdog chrome.alarms ·\nquản lý phiên & huy hiệu", INK),
        (0.95, 1.85, 3.5, 1.9, "CONTENT SCRIPT", "Widget điểm realtime ·\nhoạt động chuột/bàn phím\n(mặc định KHÔNG thu nội dung)", SKY),
        (4.85, 1.85, 3.5, 1.9, "OFFSCREEN DOCUMENT", "MediaPipe BlazeFace WASM ·\nnhận diện khuôn mặt on-device\n— không gửi ảnh đi đâu", CYAN),
    ]
    for x, y, w, h, t, d, c in boxes:
        card(ax, x, y, w, h, fc="white", ec=BORDER, lw=1.5)
        ax.add_patch(Rectangle((x, y + h - 0.18), w, 0.18, fc=c, ec="none", zorder=3))
        ax.text(x + 0.2, y + h - 0.52, t, fontsize=13, fontweight="bold", color=INK)
        ax.text(x + 0.2, y + h - 1.25, d, fontsize=10, color=SLATE, va="center", linespacing=1.4)

    arrow(ax, 4.45, 5.55, 4.85, 5.55, color=SLATE)
    arrow(ax, 4.85, 5.35, 4.45, 5.35, color=SLATE)
    arrow(ax, 2.7, 4.6, 2.7, 3.75, color=SLATE)
    arrow(ax, 6.6, 4.6, 6.6, 3.75, color=SLATE)
    arrow(ax, 6.6, 3.75, 6.6, 4.6, color=SLATE)
    ax.text(4.65, 5.78, "message", fontsize=8.5, color=MUTE, ha="center")

    # ---- Backend container ----
    card(ax, 9.6, 1.35, 5.9, 6.6, fc="#F8FAFC", ec=CYAN, lw=2.0, r=0.2)
    ax.text(10.0, 7.45, "BACKEND — Node/Express + SQLite", fontsize=16, fontweight="bold", color="#0E7490")
    ax.text(10.0, 7.02, "Lớp xác thực cộng thêm — extension không phụ thuộc cứng", fontsize=10.5, color=SLATE)

    endpoints = [
        ("POST /api/ai-analyze", "Proxy GPT-4o-mini — API key chỉ nằm ở server", VIOLET),
        ("POST /api/certificates", "Lưu + ký HMAC-SHA-256 (v2) · chống ghi đè 409", INDIGO),
        ("GET  /verify/:id", "Trang xác thực công khai — quét QR là ra bản gốc", GREEN),
        ("POST /api/events", "Analytics + error log ẩn danh (không URL/PII)", SKY),
        ("SQLite (node:sqlite)", "DB thật · token x-fp-token · 13/13 test PASS", AMBER),
    ]
    yy = 6.35
    for t, d, c in endpoints:
        card(ax, 9.95, yy - 0.78, 5.2, 0.92, fc="white", ec=BORDER, lw=1.3, r=0.10)
        ax.add_patch(Rectangle((9.95, yy - 0.78), 0.12, 0.92, fc=c, ec="none", zorder=3))
        ax.text(10.25, yy - 0.18, t, fontsize=11.5, fontweight="bold", color=INK, family="Consolas")
        ax.text(10.25, y_desc := yy - 0.52, d, fontsize=9.3, color=SLATE)
        yy -= 1.06

    arrow(ax, 8.8, 5.4, 9.6, 5.4, color=INDIGO, lw=3)
    arrow(ax, 9.6, 5.0, 8.8, 5.0, color=CYAN, lw=3)
    ax.text(9.2, 5.62, "HTTPS", fontsize=9, color=MUTE, ha="center")

    ax.text(8.0, 0.62, "AI khuôn mặt chạy tại thiết bị — chỉ điểm tổng hợp & bản ghi chứng chỉ đi qua mạng khi người dùng đồng ý",
            fontsize=11.5, color=SLATE, ha="center", style="italic")

    ax.text(8.0, 8.55, "KIẾN TRÚC PRIVACY-FIRST: XỬ LÝ TẠI THIẾT BỊ, XÁC THỰC TẠI MÁY CHỦ",
            fontsize=15, fontweight="bold", color=INK, ha="center")

    fig.savefig(OUT / "architecture.png", facecolor="white")
    plt.close(fig)
    print("  [OK] architecture.png")


# ======================================================================
# 5) DASHBOARD CHẤT LƯỢNG (trước/sau)
# ======================================================================
def make_quality_dashboard():
    fig = plt.figure(figsize=(16, 6.4), dpi=170)
    fig.patch.set_facecolor("white")

    # --- Panel 1: tests ---
    ax1 = fig.add_axes([0.045, 0.14, 0.27, 0.68])
    vals = [184, 279]
    labels = ["Vòng loại", "Chung kết"]
    colors = [MUTE, INDIGO]
    bars = ax1.bar(labels, vals, width=0.52, color=colors, zorder=3)
    for b, v in zip(bars, vals):
        ax1.text(b.get_x() + b.get_width() / 2, v + 6, str(v), ha="center",
                 fontsize=17, fontweight="bold", color=INK)
    ax1.set_ylim(0, 330)
    ax1.spines[["top", "right", "left"]].set_visible(False)
    ax1.set_yticks([])
    ax1.tick_params(axis="x", labelsize=12, colors=SLATE, length=0)
    ax1.set_title("Test tự động PASS (+52%)", fontsize=14.5, fontweight="bold", color=INK, pad=12)
    ax1.text(1, 300, "266 client + 13 server", fontsize=10.5, color=SLATE, ha="center")
    ax1.grid(axis="y", color=BORDER, lw=0.8, zorder=0)

    # --- Panel 2: build size ---
    ax2 = fig.add_axes([0.375, 0.14, 0.27, 0.68])
    vals2 = [41, 22, 7.7]
    labels2 = ["Build cũ", "Build 1.0.1", "Gói nộp .zip"]
    colors2 = [MUTE, CYAN, GREEN]
    bars2 = ax2.bar(labels2, vals2, width=0.52, color=colors2, zorder=3)
    for b, v in zip(bars2, vals2):
        ax2.text(b.get_x() + b.get_width() / 2, v + 1, f"{v} MB", ha="center",
                 fontsize=15.5, fontweight="bold", color=INK)
    ax2.set_ylim(0, 48)
    ax2.spines[["top", "right", "left"]].set_visible(False)
    ax2.set_yticks([])
    ax2.tick_params(axis="x", labelsize=12, colors=SLATE, length=0)
    ax2.set_title("Dung lượng gói (giảm 46%)", fontsize=14.5, fontweight="bold", color=INK, pad=12)
    ax2.grid(axis="y", color=BORDER, lw=0.8, zorder=0)

    # --- Panel 3: checklist ---
    ax3 = fig.add_axes([0.70, 0.06, 0.28, 0.82])
    ax3.set_xlim(0, 10)
    ax3.set_ylim(0, 10)
    ax3.axis("off")
    ax3.set_title("Cổng chất lượng (CI/CD)", fontsize=14.5, fontweight="bold", color=INK, pad=12)
    checks = [
        "TypeScript strict — 0 lỗi",
        "ESLint — 0 lỗi",
        "266/266 + 13/13 test PASS",
        "check-no-secrets — 0 key lộ",
        "GitHub Actions + husky pre-commit",
    ]
    yy = 8.6
    for cst in checks:
        ax3.add_patch(Circle((0.7, yy), 0.34, fc=GREEN, ec="none"))
        ax3.plot([0.52, 0.66, 0.92], [yy, yy - 0.14, yy + 0.16], color="white", lw=2.4)
        ax3.text(1.35, yy, cst, fontsize=12.5, color=INK, va="center")
        yy -= 1.85

    fig.savefig(OUT / "quality_dashboard.png", facecolor="white")
    plt.close(fig)
    print("  [OK] quality_dashboard.png")


# ======================================================================
# 6) RADAR 10 TIÊU CHÍ (trước / sau nâng cấp)
# ======================================================================
def make_radar():
    labels = ["Giao diện", "Trải nghiệm", "Logic\nứng dụng", "Backend\n& API", "Cơ sở\ndữ liệu",
              "Bảo mật", "Hiệu năng", "Analytics", "Vận hành", "Chiến lược\nsản phẩm"]
    before = [7, 7, 7, 4, 4, 6, 6, 5, 5, 8]
    after = [8, 8.5, 8.5, 7.5, 7, 8, 7.5, 8, 7.5, 8.5]

    N = len(labels)
    ang = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    ang += ang[:1]
    b = before + before[:1]
    a = after + after[:1]

    fig = plt.figure(figsize=(8.6, 8.4), dpi=170)
    fig.patch.set_facecolor("white")
    ax = fig.add_axes([0.09, 0.155, 0.82, 0.70], polar=True)
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_facecolor("white")

    ax.plot(ang, b, color=MUTE, lw=2.2, ls="--")
    ax.fill(ang, b, color=MUTE, alpha=0.13)
    ax.plot(ang, a, color=INDIGO, lw=3)
    ax.fill(ang, a, color=INDIGO, alpha=0.20)

    ax.set_xticks(ang[:-1])
    ax.set_xticklabels(labels, fontsize=11.5, color=INK)
    ax.set_ylim(0, 10)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(["2", "4", "6", "8", "10"], fontsize=9, color=MUTE)
    ax.grid(color=BORDER, lw=1)
    ax.spines["polar"].set_color(BORDER)

    fig.text(0.5, 0.955, "Tự đánh giá theo rubric 10 tiêu chí", fontsize=16,
             fontweight="bold", color=INK, ha="center")
    fig.text(0.5, 0.915, "Vòng loại 59/100  →  sau đợt nâng cấp ~79/100 (mọi mục đều có bằng chứng test)",
             fontsize=11, color=SLATE, ha="center")
    from matplotlib.lines import Line2D
    fig.legend(handles=[
        Line2D([0], [0], color=MUTE, lw=2.2, ls="--", label="Vòng loại (59/100)"),
        Line2D([0], [0], color=INDIGO, lw=3, label="Vòng chung kết (~79/100)"),
    ], loc="lower center", bbox_to_anchor=(0.5, 0.005), ncol=2, frameon=False, fontsize=11.5)

    fig.savefig(OUT / "radar_rubric.png", facecolor="white")
    plt.close(fig)
    print("  [OK] radar_rubric.png")


# ======================================================================
# 7) THỊ TRƯỜNG — TAM/SAM/SOM + tăng trưởng EdTech VN
# ======================================================================
def make_market():
    fig = plt.figure(figsize=(16, 7.2), dpi=170)
    fig.patch.set_facecolor("white")

    # --- Left: concentric TAM/SAM/SOM ---
    axL = fig.add_axes([0.03, 0.04, 0.44, 0.86])
    axL.set_xlim(0, 10)
    axL.set_ylim(0, 10)
    axL.axis("off")
    axL.set_title("Quy mô thị trường", fontsize=15.5, fontweight="bold", color=INK, pad=14)

    circles = [
        (4.6, 4.35, INDIGO, 0.14),
        (3.15, 3.6, CYAN, 0.20),
        (1.55, 2.75, AMBER, 0.95),
    ]
    cx, cy = 4.4, 4.5
    for r, _, c, al in circles:
        axL.add_patch(Circle((cx, cy - (4.6 - r) * 0.72), r, fc=c, alpha=al, ec="none"))

    axL.annotate("TAM — Toàn cầu\n1,6 tỷ HS-SV & freelancer\n≈ 50 tỷ USD EdTech + năng suất",
                 xy=(cx + 3.1, cy + 2.6), fontsize=11.5, color=INK, ha="left", va="center",
                 fontweight="bold", linespacing=1.5)
    axL.plot([cx + 1.4, cx + 3.0], [cy + 3.4, cy + 2.9], color=MUTE, lw=1.2)
    axL.annotate("SAM — Đông Nam Á + VN\n30 triệu người dùng Chrome\n≈ 1,2 tỷ USD",
                 xy=(cx + 3.1, cy - 0.2), fontsize=11.5, color=INK, ha="left", va="center",
                 fontweight="bold", linespacing=1.5)
    axL.plot([cx + 2.2, cx + 3.0], [cy - 0.2, cy - 0.2], color=MUTE, lw=1.2)
    axL.annotate("SOM — 3 năm đầu\n200.000 user trả phí\n≈ 6 triệu USD",
                 xy=(cx + 3.1, cy - 2.7), fontsize=11.5, color="#92400E", ha="left", va="center",
                 fontweight="bold", linespacing=1.5)
    axL.plot([cx + 0.9, cx + 3.0], [cy - 2.35, cy - 2.6], color=MUTE, lw=1.2)

    # --- Right: EdTech VN growth ---
    axR = fig.add_axes([0.56, 0.16, 0.40, 0.66])
    years = [2024, 2027, 2030, 2033]
    vals = [1.0, 1.55, 2.25, 3.0]
    axR.plot(years, vals, color=INDIGO, lw=3.5, marker="o", markersize=9,
             markerfacecolor="white", markeredgewidth=2.6, zorder=4)
    axR.fill_between(years, vals, color=INDIGO, alpha=0.10, zorder=2)
    for xx, vv in zip(years, vals):
        axR.text(xx, vv + 0.14, f"{vv:g} tỷ USD".replace(".", ","), ha="center",
                 fontsize=11.5, fontweight="bold", color=INK)
    axR.set_ylim(0, 3.6)
    axR.set_xticks(years)
    axR.tick_params(labelsize=11.5, colors=SLATE, length=0)
    axR.spines[["top", "right", "left"]].set_visible(False)
    axR.set_yticks([])
    axR.grid(axis="y", color=BORDER, lw=0.8)
    axR.set_title("Thị trường EdTech Việt Nam (dự báo)", fontsize=15.5,
                  fontweight="bold", color=INK, pad=14)
    fig.text(0.76, 0.045, "Nhu cầu đã được chứng minh: YPT (Hàn Quốc) 5+ triệu người dùng\n\"thi đua tập trung\" — nhưng chỉ tự khai, không có bằng chứng khách quan.",
             fontsize=10.5, color=SLATE, ha="center", linespacing=1.5)

    fig.savefig(OUT / "market_chart.png", facecolor="white")
    plt.close(fig)
    print("  [OK] market_chart.png")


# ======================================================================
# 8) MOCK CHỨNG CHỈ (PIL + QR thật)
# ======================================================================
def make_certificate():
    W, H = 1480, 1020
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)

    # viền gradient giả (2 khung)
    d.rounded_rectangle([10, 10, W - 10, H - 10], radius=26, outline=hx(INDIGO), width=6)
    d.rounded_rectangle([26, 26, W - 26, H - 26], radius=18, outline=hx(CYAN), width=2)

    # dải header
    d.rounded_rectangle([54, 54, W - 54, 200], radius=14, fill=hx("#0F172A"))
    d.text((92, 88), "CHỨNG CHỈ TẬP TRUNG", font=pil_font("bold", 52), fill=(255, 255, 255))
    d.text((92, 150), "FOCUS CERTIFICATE — FOCUSPROOF", font=pil_font("semibold", 24), fill=hx("#7DD3FC"))

    # score badge (vòng tròn bên phải header)
    bx, by, br = W - 190, 127, 118
    d.ellipse([bx - br, by - br + 130, bx + br, by + br + 130], fill=hx(INDIGO))
    d.ellipse([bx - br + 10, by - br + 140, bx + br - 10, by + br + 120], outline=hx(CYAN), width=5)
    f_num = pil_font("bold", 74)
    d.text((bx, by + 96), "92", font=f_num, fill=(255, 255, 255), anchor="mm")
    d.text((bx, by + 158), "/100 — HẠNG A", font=pil_font("semibold", 26), fill=(255, 255, 255), anchor="mm")

    # nội dung
    d.text((92, 258), "Chứng nhận", font=pil_font("regular", 26), fill=hx(SLATE))
    d.text((92, 300), "Nguyễn Văn A", font=pil_font("bold", 56), fill=hx(INK))
    d.text((92, 386), "đã hoàn thành phiên tập trung:", font=pil_font("regular", 26), fill=hx(SLATE))
    d.text((92, 428), "“Ôn thi Giải tích — 90 phút”", font=pil_font("semibold", 40), fill=hx(INDIGO))

    rows = [
        ("Thời gian tập trung thực", "83 / 90 phút (92%)"),
        ("Cảnh báo mất tập trung", "2 lần (đã hiển thị minh bạch)"),
        ("Ngày cấp", "09/05/2026 · 14:32"),
    ]
    yy = 520
    for k, v in rows:
        d.text((92, yy), k, font=pil_font("regular", 26), fill=hx(SLATE))
        d.text((560, yy), v, font=pil_font("semibold", 26), fill=hx(INK))
        yy += 54

    # hash + chữ ký
    d.rounded_rectangle([92, 712, 950, 856], radius=14, fill=hx(PANEL))
    d.text((116, 734), "SHA-256 Integrity", font=pil_font("semibold", 24), fill=hx(INK))
    d.text((116, 774), "3f9c8a71d2e4b6…c94a1e2 (dấu vân tay toàn vẹn dữ liệu)", font=pil_font("mono", 22), fill=hx(SLATE))
    d.text((116, 812), "Ký HMAC-SHA-256 bởi máy chủ FocusProof — bản ghi #FP-2026-0142", font=pil_font("regular", 22), fill=hx("#0E7490"))

    d.text((92, 896), "Quét QR để xác thực bản gốc tại focusproof.app/verify", font=pil_font("regular", 24), fill=hx(SLATE))
    d.text((92, 936), "Không thể chỉnh sửa điểm số — mọi thay đổi làm hash mất hiệu lực.", font=pil_font("regular", 22), fill=hx(MUTE))

    # QR thật
    qr = qrcode.QRCode(border=1, box_size=8)
    qr.add_data("https://focusproof.app/verify/FP-2026-0142")
    qr.make(fit=True)
    qim = qr.make_image(fill_color="#0F172A", back_color="white").convert("RGB")
    qim = qim.resize((250, 250), Image.NEAREST)
    d.rounded_rectangle([W - 350, H - 356, W - 76, H - 82], radius=14, outline=hx(BORDER), width=3)
    img.paste(qim, (W - 338, H - 344))

    img.save(OUT / "certificate_mock.png")
    print("  [OK] certificate_mock.png")


# ======================================================================
# 9) MOCK WIDGET REALTIME (PIL)
# ======================================================================
def make_widget():
    W, H = 1180, 340
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([6, 6, W - 6, H - 6], radius=40, fill=hx("#0F172A"))
    d.rounded_rectangle([6, 6, W - 6, H - 6], radius=40, outline=hx("#334155"), width=3)

    # chấm trạng thái + tên
    d.ellipse([54, 56, 82, 84], fill=hx(GREEN))
    d.text((104, 52), "FocusProof — đang theo dõi phiên", font=pil_font("semibold", 34), fill=(255, 255, 255))
    d.text((104, 108), "Mục tiêu: Ôn thi Giải tích · Notion + Coursera", font=pil_font("regular", 27), fill=hx(MUTE))

    # ring gauge
    cx, cy, r = 990, 170, 120
    d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=270, fill=hx("#1E293B"), width=26)
    d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=-90 + int(360 * 0.87), fill=hx(CYAN), width=26)
    d.text((cx, cy - 12), "87", font=pil_font("bold", 72), fill=(255, 255, 255), anchor="mm")
    d.text((cx, cy + 52), "FOCUS SCORE", font=pil_font("semibold", 20), fill=hx(MUTE), anchor="mm")

    # meta dưới
    metas = [("32:15", "đã tập trung"), ("0", "cảnh báo"), ("2", "tab hợp lệ")]
    xx = 104
    for num, lab in metas:
        d.text((xx, 190), num, font=pil_font("bold", 52), fill=hx("#7DD3FC"))
        d.text((xx, 258), lab, font=pil_font("regular", 26), fill=hx(MUTE))
        xx += 240

    img.save(OUT / "widget_mock.png")
    print("  [OK] widget_mock.png")


if __name__ == "__main__":
    print("Sinh ảnh minh hoạ VC2026 ...")
    make_hero_bg()
    make_logo_mark()
    make_three_signals()
    make_architecture()
    make_quality_dashboard()
    make_radar()
    make_market()
    make_certificate()
    make_widget()
    print("Xong: ", OUT)
