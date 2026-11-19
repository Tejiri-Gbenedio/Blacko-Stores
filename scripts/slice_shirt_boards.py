#!/usr/bin/env python3
"""
Atelier Rack — 4-Panel Shirt Turnaround Board Slicer & Hook Aligner
===================================================================

Automates turning AI-generated 4-panel e-commerce shirt boards (pure white background)
into aligned, transparent WebP/PNG sprites ready for the -11 deg diagonal clothing rack.

Expected 2x2 Panel Layout:
  +-------------------+-------------------+
  | Top-Left: front   | Top-Right: side   |
  +-------------------+-------------------+
  | Bottom-Left: back | Bottom-Right: fold|
  +-------------------+-------------------+

Usage:
  # 1. Process an entire folder of 4-panel boards:
  python slice_shirt_boards.py --input-dir ./raw_boards --output-dir ./public/assets/shirts

  # 2. Process a single shirt board with a custom slug:
  python slice_shirt_boards.py --input ./sky_floral_board.jpg --slug sky-floral-camp --output-dir ./public/assets/shirts

Dependencies:
  pip install pillow numpy scipy
"""

import argparse
import json
import re
from pathlib import Path
from typing import Tuple

import numpy as np
from PIL import Image
from scipy import ndimage


SUPPORTED_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


KNOWN_SLUGS = {
    "olive-damask-board": "olive-damask-camp",
    "olive-damask": "olive-damask-camp",
    "terracotta-geometric-board": "terracotta-geometric-camp",
    "terracotta-geometric": "terracotta-geometric-camp",
    "indigo-batik-board": "indigo-batik-camp",
    "indigo-batik": "indigo-batik-camp",
    "sky-floral-camp-board": "sky-floral-camp",
    "sky-floral-camp": "sky-floral-camp",
}


def slugify(name: str) -> str:
    """Convert filename stem into a clean URL-safe garment slug."""
    raw = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    if raw in KNOWN_SLUGS:
        return KNOWN_SLUGS[raw]
    clean = re.sub(r"-board$", "", raw)
    return clean or "garment"


def remove_white_bg_flood(
    pil_img: Image.Image,
    threshold: int = 236,
    sat_tolerance: int = 18,
    edge_softness: int = 2,
) -> Image.Image:
    """
    Remove a pure white studio background using border-seeded flood propagation.
    Because it flood-fills strictly from the outer borders, white patterns, buttons,
    or jacquard motifs *inside* the shirt remain 100% opaque.
    """
    rgba = pil_img.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    rgb = arr[:, :, :3]

    min_c = np.min(rgb, axis=2)
    max_c = np.max(rgb, axis=2)
    sat = max_c - min_c

    # Candidate background pixels: very bright and near-neutral gray/white
    is_bg_cand = (min_c > threshold) & (sat < sat_tolerance)

    # Seed flood fill from all 4 borders of the quadrant
    seed = np.zeros_like(is_bg_cand, dtype=bool)
    seed[0, :] = is_bg_cand[0, :]
    seed[-1, :] = is_bg_cand[-1, :]
    seed[:, 0] = is_bg_cand[:, 0]
    seed[:, -1] = is_bg_cand[:, -1]

    bg_mask = ndimage.binary_propagation(seed, mask=is_bg_cand)
    alpha = np.where(bg_mask, 0.0, 255.0)

    # Smooth anti-aliased edge ramp to eliminate white haloing
    if edge_softness > 0:
        dilated = ndimage.binary_dilation(bg_mask, iterations=edge_softness)
        edge_zone = dilated & (~bg_mask)
        lum = np.mean(rgb, axis=2)
        denom = max(1.0, 252.0 - threshold + 10.0)
        edge_alpha = np.clip((252.0 - lum) * (255.0 / denom), 0.0, 255.0)
        alpha = np.where(edge_zone, np.minimum(alpha, edge_alpha), alpha)

    out = arr.copy()
    out[:, :, 3] = alpha
    return Image.fromarray(out.astype(np.uint8), mode="RGBA")


def align_hanger_sprite(
    img: Image.Image,
    target_size: Tuple[int, int] = (800, 960),
    hook_top_ratio: float = 0.042,
) -> Image.Image:
    """
    Crop to tight foreground bounds, detect the top-center tip of the hanger hook,
    and place the shirt on a standardized canvas so every garment's hook aligns
    at the exact pivot coordinate (50% X, `hook_top_ratio` Y) on the -11 deg rail.
    """
    bbox = img.getbbox()
    if not bbox:
        return Image.new("RGBA", target_size, (0, 0, 0, 0))

    cropped = img.crop(bbox)
    arr = np.array(cropped)

    # Detect the metal hook x-center from the top 12% of the cropped sprite
    top_h = max(10, int(cropped.height * 0.12))
    top_alpha = arr[:top_h, :, 3]
    _, xs = np.where(top_alpha > 80)
    hook_x = int(np.median(xs)) if len(xs) > 0 else cropped.width // 2

    target_w, target_h = target_size
    hook_top_y = int(round(target_h * hook_top_ratio))
    bottom_pad = int(round(target_h * 0.03))

    scale = min(
        (target_w * 0.88) / cropped.width,
        (target_h - hook_top_y - bottom_pad) / cropped.height,
    )
    new_w = max(1, int(round(cropped.width * scale)))
    new_h = max(1, int(round(cropped.height * scale)))

    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    scaled_hook_x = int(round(hook_x * scale))

    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    paste_x = (target_w // 2) - scaled_hook_x
    canvas.paste(resized, (paste_x, hook_top_y), resized)
    return canvas


def crop_folded_sprite(img: Image.Image, max_width: int = 640, pad: int = 12) -> Image.Image:
    """Tightly crop the folded retail shirt stack with light padding for bag flight."""
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    if cropped.width > max_width:
        scale = max_width / cropped.width
        cropped = cropped.resize(
            (max_width, max(1, int(round(cropped.height * scale)))),
            Image.Resampling.LANCZOS,
        )
    canvas = Image.new(
        "RGBA",
        (cropped.width + pad * 2, cropped.height + pad * 2),
        (0, 0, 0, 0),
    )
    canvas.paste(cropped, (pad, pad), cropped)
    return canvas


def save_sprite(img: Image.Image, path: Path, fmt: str, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fmt == "webp":
        img.save(path, format="WEBP", quality=quality, method=6)
    else:
        img.save(path, format="PNG", optimize=True)


def process_board(
    board_path: Path,
    output_dir: Path,
    slug: str,
    threshold: int = 236,
    canvas_size: Tuple[int, int] = (800, 960),
    hook_top_ratio: float = 0.042,
    fmt: str = "webp",
    quality: int = 90,
) -> dict:
    """Slice a single 2x2 master product board into front, side, back, and folded assets."""
    board = Image.open(board_path).convert("RGBA")
    w, h = board.size
    mx, my = w // 2, h // 2

    # Trim 2px inner gutter to prevent any faint divider lines from bleeding across panels
    gutter = 2
    quads = {
        "front": board.crop((0, 0, mx - gutter, my - gutter)),
        "side": board.crop((mx + gutter, 0, w, my - gutter)),
        "back": board.crop((0, my + gutter, mx - gutter, h)),
        "folded": board.crop((mx + gutter, my + gutter, w, h)),
    }

    shirt_dir = output_dir / slug
    garments_dir = output_dir.parent / "garments" / slug
    garments_flat_dir = output_dir.parent / "garments"
    ext = "webp" if fmt == "webp" else "png"
    entry = {"slug": slug}

    for view in ("front", "side", "back"):
        cleaned = remove_white_bg_flood(quads[view], threshold=threshold)
        aligned = align_hanger_sprite(cleaned, target_size=canvas_size, hook_top_ratio=hook_top_ratio)
        out_path = shirt_dir / f"{view}.{ext}"
        save_sprite(aligned, out_path, fmt=fmt, quality=quality)
        save_sprite(aligned, garments_dir / f"{view}.{ext}", fmt=fmt, quality=quality)
        save_sprite(aligned, garments_flat_dir / f"{slug}-{view}.{ext}", fmt=fmt, quality=quality)
        entry[f"{view}ImgUrl"] = f"/assets/shirts/{slug}/{view}.{ext}"

    folded_clean = remove_white_bg_flood(quads["folded"], threshold=threshold)
    folded_ready = crop_folded_sprite(folded_clean)
    folded_path = shirt_dir / f"folded.{ext}"
    save_sprite(folded_ready, folded_path, fmt=fmt, quality=quality)
    save_sprite(folded_ready, garments_dir / f"folded.{ext}", fmt=fmt, quality=quality)
    save_sprite(folded_ready, garments_flat_dir / f"{slug}-folded.{ext}", fmt=fmt, quality=quality)
    entry["foldedImgUrl"] = f"/assets/shirts/{slug}/folded.{ext}"

    return entry


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Slice 4-panel shirt turnaround boards into aligned transparent sprites."
    )
    parser.add_argument("--input", type=Path, default=None, help="Path to a single 4-panel board image.")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("raw_boards"),
        help="Folder of 4-panel board images to batch process (default: raw_boards).",
    )

    parser.add_argument("--slug", type=str, default=None, help="Custom garment slug (only for --input).")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("public/assets/shirts"),
        help="Destination folder (default: public/assets/shirts).",
    )
    parser.add_argument("--width", type=int, default=800, help="Output hanger sprite width (default: 800).")
    parser.add_argument("--height", type=int, default=960, help="Output hanger sprite height (default: 960).")
    parser.add_argument(
        "--hook-y",
        type=float,
        default=0.062,
        help="Normalized vertical hook pivot matching CSS transform-origin (default: 0.062).",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=236,
        help="White background cutoff 0-255; lower if light gray edges remain (default: 236).",
    )
    parser.add_argument("--format", choices=["webp", "png"], default="webp", help="Output format (default: webp).")
    parser.add_argument("--quality", type=int, default=90, help="WebP quality 1-100 (default: 90).")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=None,
        help="Optional path to write a JSON manifest for db/seed.ts (e.g., db/shirts-manifest.json).",
    )

    args = parser.parse_args()
    canvas_size = (args.width, args.height)
    manifest = []

    if args.input:
        slug = slugify(args.slug or args.input.stem)
        entry = process_board(
            board_path=args.input,
            output_dir=args.output_dir,
            slug=slug,
            threshold=args.threshold,
            canvas_size=canvas_size,
            hook_top_ratio=args.hook_y,
            fmt=args.format,
            quality=args.quality,
        )
        manifest.append(entry)
        print(f"[OK] {args.input.name} -> {args.output_dir / slug}/ (front, side, back, folded.{args.format})")
    else:
        files = sorted(
            p for p in args.input_dir.iterdir()
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS and "bag" not in p.name.lower()
        )
        if not files:
            raise SystemExit(f"No supported shirt images found in {args.input_dir}")

        for img_path in files:
            slug = slugify(img_path.stem)
            entry = process_board(
                board_path=img_path,
                output_dir=args.output_dir,
                slug=slug,
                threshold=args.threshold,
                canvas_size=canvas_size,
                hook_top_ratio=args.hook_y,
                fmt=args.format,
                quality=args.quality,
            )
            manifest.append(entry)
            print(f"[OK] {img_path.name} -> {args.output_dir / slug}/")

    if args.manifest:
        args.manifest.parent.mkdir(parents=True, exist_ok=True)
        args.manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"[MANIFEST] Wrote {len(manifest)} garment record(s) to {args.manifest}")


if __name__ == "__main__":
    main()
