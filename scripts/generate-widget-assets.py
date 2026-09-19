#!/usr/bin/env python3
"""Generates the Android widget PNG assets in assets/widgets/.

The widget renderer (Jetpack Glance via expo-widgets) cannot draw blur,
strokes, shadows or rounded containers, so the iOS design's card + orb
lighting, the active pill and the stale moon mark ship as pre-rendered
bitmaps. Every color here is a byte-identical literal from the palette in
widgets/PrayerWidget.tsx; shared/__tests__/widgetAssets.test.ts pins that
this file's literals stay a subset of the layout's palette.

Scale: 3x the dp box (small 110dp, medium 250x110dp, pill 140x26dp, moon
26dp). Regenerate with Pillow after changing the palette: python3
scripts/generate-widget-assets.py
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SCALE = 3
SMALL = 110
MEDIUM_W, MEDIUM_H = 250, 110
PILL_W, PILL_H = 140, 26
MOON = 26
CARD_RADIUS_PT = 16
PILL_RADIUS_PT = 4

def css(color: str) -> tuple:
    """Parses '#rrggbb' / '#rrggbbaa' / 'rgba(r, g, b, a)' into an RGBA
    tuple. The palette below keeps the layout's exact literal strings so the
    asset test can pin them against widgets/PrayerWidget.tsx."""
    if color.startswith("#"):
        hexpart = color[1:]
        rgb = tuple(int(hexpart[i : i + 2], 16) for i in (0, 2, 4))
        alpha = int(hexpart[6:8], 16) if len(hexpart) == 8 else 255
        return (*rgb, alpha)
    body = color[color.index("(") + 1 : color.index(")")].replace("/", " ")
    parts = [part.strip() for part in body.split(",")]
    r, g, b = (int(float(part)) for part in parts[0:3])
    alpha = float(parts[3]) if len(parts) > 3 else 1.0
    return (r, g, b, int(alpha * 255))


# Palette literals (byte-identical strings from widgets/PrayerWidget.tsx;
# shared/__tests__/widgetAssets.test.ts pins the subset relation). The two
# card bases are the Android-only OPAQUE forms: iOS keeps its translucent
# cards, Android renders these bitmaps over the wallpaper (owner ruling
# 2026-09-19), so alpha 1.0 keeps the wallpaper from showing through.
CARD_LIGHT = css("#fcfcfe")
CARD_DARK = css("#1a1a5c")

ORBS_SMALL = {
    "top": {"color": css("rgba(128, 0, 255, 0.25)"), "size": 85, "x": 30, "y": -38, "blur": 38},
    "bottom": {"color": css("rgba(128, 0, 255, 0.45)"), "size": 130, "x": -70, "y": 60, "blur": 40},
    "center": {"color": css("rgba(165, 180, 252, 0.3)"), "size": 34, "x": 0, "y": 8, "blur": 30},
    "corner": {"color": css("rgba(128, 0, 255, 0.34)"), "size": 130, "x": 70, "y": 60, "blur": 40},
}
ORBS_MEDIUM = {
    "top": {"color": css("rgba(155, 30, 255, 0.22)"), "size": 165, "x": -5, "y": -75, "blur": 60},
    "bottom": {"color": css("rgba(128, 0, 255, 0.45)"), "size": 195, "x": -110, "y": 60, "blur": 82},
    "center": {"color": css("rgba(130, 145, 240, 0.3)"), "size": 44, "x": 0, "y": 8, "blur": 30},
    "corner": {"color": css("rgba(55, 75, 235, 0.17)"), "size": 255, "x": 95, "y": 58, "blur": 75},
}

PILLS = {
    "standard_light": {
        "fill": css("#4f46e5"),
        "stroke": css("rgba(79, 70, 229, 0.35)"),
    },
    "extra_light": {
        "fill": css("#db2777"),
        "stroke": css("rgba(219, 39, 119, 0.35)"),
    },
    "standard_dark": {
        "fill": css("#0847e5"),
        "stroke": css("rgba(8, 71, 229, 0.35)"),
    },
    "extra_dark": {
        "fill": css("#a123aa"),
        "stroke": css("rgba(146, 0, 162, 0.35)"),
    },
}

MOON_LIGHT = css("#db2777")
MOON_DARK = css("#ff69b4")


def rounded_card(width_pt: int, height_pt: int, fill, orbs: dict | None) -> Image.Image:
    """A rounded translucent card, optionally carrying the blurred orb glows
    clipped to the card shape. Orb coordinates are card-center-relative, as
    in the iOS composition."""
    width = width_pt * SCALE
    height = height_pt * SCALE
    radius = CARD_RADIUS_PT * SCALE
    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, width - 1, height - 1], radius=radius, fill=255)
    solid = Image.new("RGBA", (width, height), fill)
    card.paste(solid, (0, 0), mask)

    if orbs is None:
        return card

    cx = width // 2
    cy = height // 2
    for orb in orbs.values():
        size = orb["size"] * SCALE
        x = orb["x"] * SCALE
        y = orb["y"] * SCALE
        left = cx + x - size // 2
        top = cy + y - size // 2
        glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([left, top, left + size, top + size], fill=orb["color"])
        glow = glow.filter(ImageFilter.GaussianBlur(orb["blur"] * SCALE))
        card.alpha_composite(glow)

    clipped = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    clipped.paste(card, (0, 0), mask)
    return clipped


def pill(spec: dict) -> Image.Image:
    width = PILL_W * SCALE
    height = PILL_H * SCALE
    radius = PILL_RADIUS_PT * SCALE
    # Shadow-free and margin-free (owner ruling 2026-09-19: the 3T renders
    # the pill's drop shadow badly): the image spans its full row width and
    # its padded height exactly, and the layout stretches it 1:1 vertically.
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))

    ImageDraw.Draw(canvas).rounded_rectangle(
        [0, 0, width - 1, height - 1],
        radius=radius,
        fill=spec["fill"],
        outline=spec["stroke"],
        width=SCALE,
    )
    return canvas


def moon(color) -> Image.Image:
    """A crescent-and-star mark standing in for the iOS moon.stars.fill
    symbol: a full disc with a smaller offset disc punched out, one small
    star (a four-point diamond spark) beside it."""
    size = MOON * SCALE
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    disc_r = int(size * 0.42)
    cx = int(size * 0.44)
    cy = int(size * 0.5)
    disc = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(disc).ellipse(
        [cx - disc_r, cy - disc_r, cx + disc_r, cy + disc_r], fill=color
    )
    punch_r = int(disc_r * 0.86)
    punch = Image.new("L", (size, size), 0)
    ImageDraw.Draw(punch).ellipse(
        [cx - punch_r + int(disc_r * 0.75), cy - punch_r - int(disc_r * 0.35), cx + punch_r + int(disc_r * 0.75), cy + punch_r - int(disc_r * 0.35)],
        fill=255,
    )
    disc.putalpha(Image.composite(Image.new("L", (size, size), 0), disc.getchannel("A"), punch))
    canvas.alpha_composite(disc)

    star_cx = int(size * 0.78)
    star_cy = int(size * 0.32)
    star_r = int(size * 0.14)
    draw.polygon(
        [
            (star_cx, star_cy - star_r),
            (star_cx + star_r // 3, star_cy - star_r // 3),
            (star_cx + star_r, star_cy),
            (star_cx + star_r // 3, star_cy + star_r // 3),
            (star_cx, star_cy + star_r),
            (star_cx - star_r // 3, star_cy + star_r // 3),
            (star_cx - star_r, star_cy),
            (star_cx - star_r // 3, star_cy - star_r // 3),
        ],
        fill=color,
    )
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="assets/widgets", help="output directory")
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    outputs = {
        "athan_widget_card_light_small": rounded_card(SMALL, SMALL, CARD_LIGHT, None),
        "athan_widget_card_light_medium": rounded_card(MEDIUM_W, MEDIUM_H, CARD_LIGHT, None),
        "athan_widget_card_dark_small": rounded_card(SMALL, SMALL, CARD_DARK, ORBS_SMALL),
        "athan_widget_card_dark_medium": rounded_card(MEDIUM_W, MEDIUM_H, CARD_DARK, ORBS_MEDIUM),
        "athan_widget_pill_standard_light": pill(PILLS["standard_light"]),
        "athan_widget_pill_extra_light": pill(PILLS["extra_light"]),
        "athan_widget_pill_standard_dark": pill(PILLS["standard_dark"]),
        "athan_widget_pill_extra_dark": pill(PILLS["extra_dark"]),
        "athan_widget_moon_light": moon(MOON_LIGHT),
        "athan_widget_moon_dark": moon(MOON_DARK),
    }
    for name, image in outputs.items():
        image.save(out / f"{name}.png")
        print(f"wrote {out / (name + '.png')} {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    main()
