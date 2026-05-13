# -*- coding: utf-8 -*-
"""
FocusProof - Update Logo Script
1. Backup old icons (16, 48, 128, svg) to icons/old/
2. Resize logo_source.png to 16, 48, 128, 256, 512 PNG
3. Save with high-quality LANCZOS resampling
4. Trim transparent border if needed
"""
from pathlib import Path
from PIL import Image
import shutil
from datetime import datetime

ROOT = Path(__file__).parent.parent
ICONS_DIR = ROOT / "public" / "icons"
BACKUP_DIR = ICONS_DIR / "old"
BACKUP_DIR.mkdir(exist_ok=True)

# Find source logo (handle both .png and .png.png filenames)
SOURCES = [
    ICONS_DIR / "logo_source.png",
    ICONS_DIR / "logo_source.png.png",
]
source = next((p for p in SOURCES if p.exists()), None)
if source is None:
    raise FileNotFoundError(
        "Khong tim thay logo_source.png trong public/icons/"
    )

print("=" * 70)
print("  FocusProof - Update Logo")
print("=" * 70)
print(f"\n[1/4] Source logo: {source.name}")

# Load source
img = Image.open(source)
print(f"      Size: {img.size[0]}x{img.size[1]} px, mode: {img.mode}")

# Convert to RGBA if not already (preserve transparency)
if img.mode != "RGBA":
    img = img.convert("RGBA")

# Auto-trim transparent border (if any) so icon fills frame
def trim_transparent(im):
    """Crop fully-transparent pixels around the image."""
    bbox = im.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

# Try trim - if image has white background it won't work, just keep original
trimmed = trim_transparent(img)
if trimmed.size != img.size:
    print(f"      Trimmed to: {trimmed.size[0]}x{trimmed.size[1]} px")
    img = trimmed

# Make square (pad with transparent if not square)
if img.size[0] != img.size[1]:
    side = max(img.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(img, ((side - img.size[0]) // 2, (side - img.size[1]) // 2))
    img = sq
    print(f"      Padded to square: {img.size[0]}x{img.size[1]} px")

print(f"\n[2/4] Backup icons cu vao 'old/'")
ts = datetime.now().strftime("%Y%m%d_%H%M%S")
for fname in ["icon16.png", "icon48.png", "icon128.png", "icon.svg"]:
    src = ICONS_DIR / fname
    if src.exists():
        dst = BACKUP_DIR / f"{src.stem}_{ts}{src.suffix}"
        shutil.copy2(src, dst)
        print(f"      Backed up {fname} -> old/{dst.name}")

print(f"\n[3/4] Tach mark va wordmark")
# Source after trim+pad has wordmark "FocusProof" at bottom ~30%
# Crop top portion (mark only) for small icon sizes
# Heuristic: top 68% of image is the mark
W, H = img.size
mark_h = int(H * 0.68)
mark = img.crop((0, 0, W, mark_h))

# Re-trim and re-pad mark to be square
mark = trim_transparent(mark)
if mark.size[0] != mark.size[1]:
    side = max(mark.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(mark, ((side - mark.size[0]) // 2, (side - mark.size[1]) // 2))
    mark = sq
print(f"      Mark (no wordmark): {mark.size[0]}x{mark.size[1]} px")
print(f"      Lockup (full):      {img.size[0]}x{img.size[1]} px")

print(f"\n[4/5] Resize:")
print(f"      Mark-only -> icon16, icon48, icon128 (Chrome toolbar)")
mark_sizes = {
    "icon16.png":  16,
    "icon48.png":  48,
    "icon128.png": 128,
}
for fname, size in mark_sizes.items():
    out = ICONS_DIR / fname
    resized = mark.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(out, "PNG", optimize=True)
    print(f"      [OK] {fname:14s} ({size:>3}x{size:<3}px, {out.stat().st_size:>5} bytes)")

print(f"\n      Full lockup -> icon256, icon512 (slides/web)")
lockup_sizes = {
    "icon256.png": 256,
    "icon512.png": 512,
    "logo_full.png": 1024,
}
for fname, size in lockup_sizes.items():
    out = ICONS_DIR / fname
    # Resize the full lockup keeping aspect
    aspect = img.size[0] / img.size[1]
    if aspect >= 1:
        new_w = size
        new_h = int(size / aspect)
    else:
        new_h = size
        new_w = int(size * aspect)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    resized.save(out, "PNG", optimize=True)
    print(f"      [OK] {fname:14s} ({new_w:>4}x{new_h:<4}px, {out.stat().st_size:>6} bytes)")

print(f"\n[5/5] Done!")
print(f"      Icons updated in: {ICONS_DIR}")
print(f"      Old icons backed up in: {BACKUP_DIR}")
print("\n  NEXT STEPS:")
print("  1. npm run build")
print("  2. chrome://extensions -> Reload FocusProof")
print("  3. Re-open test tabs")
print("=" * 70)
