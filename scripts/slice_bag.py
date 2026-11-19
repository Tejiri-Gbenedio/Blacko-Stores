#!/usr/bin/env python3
"""
Blacko Stores — Custom Weekender Bag 2-Layer Pocket Slicer
==========================================================

Processes the raw unobstructed empty-interior weekender bag board
into a 2-layer pocket sandwich (bag-back.webp and bag-front-lip.webp) at 640px wide.

Layer 1: public/assets/bag/bag-back.webp (rear wall, empty interior lining, rear handle)
Layer 2: (Folded shirts drop between Layer 1 and Layer 3)
Layer 3: public/assets/bag/bag-front-lip.webp (front cream canvas body and drooping front leather handle)

Dependencies:
  pip install pillow numpy scipy
"""

import argparse
from pathlib import Path
from typing import Tuple

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d


def remove_white_bg_flood(
    pil_img: Image.Image,
    threshold: int = 220,
    sat_tolerance: int = 14,
    shadow_cutoff: int = 130,
    edge_softness: int = 2,
) -> Image.Image:
    """
    Remove white/light studio background via border-seeded flood propagation.
    Effectively eliminates studio backdrop while preserving cream canvas and interior shadows.
    """
    rgba = pil_img.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    rgb = arr[:, :, :3]

    min_c = np.min(rgb, axis=2)
    max_c = np.max(rgb, axis=2)
    sat = max_c - min_c

    # Studio background: bright white OR neutral low-sat gray shadows near borders
    is_bg_cand = (min_c > threshold) | ((sat < sat_tolerance) & (min_c > shadow_cutoff))

    # Seed flood fill from all 4 image borders
    seed = np.zeros_like(is_bg_cand, dtype=bool)
    seed[0, :] = is_bg_cand[0, :]
    seed[-1, :] = is_bg_cand[-1, :]
    seed[:, 0] = is_bg_cand[:, 0]
    seed[:, -1] = is_bg_cand[:, -1]

    bg_mask = ndimage.binary_propagation(seed, mask=is_bg_cand)
    alpha = np.where(bg_mask, 0.0, 255.0)

    # Smooth anti-aliased edge ramp
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


def trace_front_rim_curve(arr: np.ndarray) -> np.ndarray:
    """
    Traces the front dark-brown leather rim curve across the front cream canvas body.
    Since the front handle droops downward, keeps ONLY pixels below that front rim curve.
    """
    h, w = arr.shape[:2]
    rim_curve = np.zeros(w, dtype=float)

    for x in range(w):
        rgb = arr[:, x, :3]
        alpha = arr[:, x, 3]

        # Find front cream canvas wall (bright: R > 145, G > 135, B > 115)
        cream_candidates = np.where(
            (rgb[:, 0] > 145) & (rgb[:, 1] > 135) & (rgb[:, 2] > 115) & (alpha > 150)
        )[0]
        front_canvas = cream_candidates[(cream_candidates >= int(h * 0.35)) & (cream_candidates <= int(h * 0.75))]

        if len(front_canvas) > 0:
            top_canvas_y = front_canvas[0]
            rim_y = top_canvas_y
            # Dark leather trim sits just above cream canvas
            for y_test in range(top_canvas_y - 1, max(0, top_canvas_y - 30), -1):
                if alpha[y_test] > 150 and np.sum(rgb[y_test]) > 55:
                    rim_y = y_test
                else:
                    break
            rim_curve[x] = rim_y
        else:
            rim_curve[x] = 0

    valid_xs = np.where(rim_curve > 0)[0]
    if len(valid_xs) > 0:
        first_x, last_x = valid_xs[0], valid_xs[-1]
        smoothed = rim_curve.copy()
        smoothed[:first_x] = rim_curve[first_x] + (first_x - np.arange(first_x)) * 0.7
        smoothed[last_x:] = rim_curve[last_x] + (np.arange(w - last_x)) * 0.5
        final_rim = gaussian_filter1d(smoothed, sigma=4)
        return final_rim

    # Fallback to standard rim profile
    anchors = np.array([
        [0.00, 0.65], [0.15, 0.50], [0.35, 0.48], [0.50, 0.47], [0.65, 0.45], [0.85, 0.46], [1.00, 0.55]
    ])
    from scipy.interpolate import PchipInterpolator
    interp = PchipInterpolator(anchors[:, 0] * (w - 1), anchors[:, 1] * h)
    return interp(np.arange(w))


def slice_bag(
    input_path: Path,
    output_dir: Path,
    target_width: int = 640,
) -> Tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(f"Bag image not found at {input_path}")

    print(f"Loading raw bag image: {input_path}")
    raw_img = Image.open(input_path)

    # 1. Remove background via border-seeded flood fill
    print("Removing studio background via border-seeded flood fill...")
    transparent = remove_white_bg_flood(raw_img)

    # 2. Tight crop to actual bag foreground
    bbox = transparent.getbbox()
    if not bbox:
        raise ValueError("Image appears empty after background removal.")
    cropped = transparent.crop(bbox)
    print(f"Tight crop bbox: {bbox} (width: {cropped.width}, height: {cropped.height})")

    # 3. Resize to target width (640px)
    scale = target_width / float(cropped.width)
    target_height = int(round(cropped.height * scale))
    resized_back = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)

    # Export public/assets/bag/bag-back.webp
    back_out = output_dir / "bag-back.webp"
    resized_back.save(back_out, "WEBP", quality=95)
    print(f"  [✓] Exported: {back_out} ({target_width}x{target_height})")

    # 4. Generate public/assets/bag/bag-front-lip.webp
    # Trace front dark-brown leather rim curve across front cream canvas body
    # Keep ONLY pixels below that front rim curve (no upright handle masking)
    arr_back = np.array(resized_back, dtype=np.float32)
    rim_ys = trace_front_rim_curve(arr_back)
    ys = np.arange(target_height)[:, None]

    # Smooth 2px anti-aliased edge at rim curve
    edge_dist = ys - rim_ys[None, :]
    rim_alpha_mask = np.clip((edge_dist + 1.0) / 2.0, 0.0, 1.0)

    arr_front = arr_back.copy()
    arr_front[:, :, 3] = np.clip(arr_front[:, :, 3] * rim_alpha_mask, 0.0, 255.0)

    front_img = Image.fromarray(arr_front.astype(np.uint8), mode="RGBA")
    front_out = output_dir / "bag-front-lip.webp"
    front_img.save(front_out, "WEBP", quality=95)
    print(f"  [✓] Exported: {front_out} ({target_width}x{target_height})")

    return back_out, front_out


def main():
    parser = argparse.ArgumentParser(description="Slice clean empty-interior weekender bag into 2-layer pocket")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("raw_boards/empty-weekender-bag.jpg"),
        help="Path to raw empty-interior bag photo",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("public/assets/bag"),
        help="Output directory for bag sprites",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=640,
        help="Target sprite width in pixels (default: 640)",
    )
    args = parser.parse_args()

    slice_bag(args.input, args.output_dir, target_width=args.width)
    print("\nCustom Weekender Bag 2-layer pocket sprites created successfully!")


if __name__ == "__main__":
    main()
