#!/usr/bin/env python3
"""Crop and enlarge the mufti poster's two zon tables for transcription.

The poster is 1381x2048; the two tables sit side by side under a banner.
Geometry is measured once against the Zulkaedah poster and reused.
"""
import sys, pathlib
from PIL import Image

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
img = Image.open(SRC)
W, H = img.size

BANDS = {
    'a': (700, 1180),
    'b': (1160, 1650),
}
COLS = {
    'z1': (0, 700),
    'z2': (680, 1381),
}

for cname, (x0, x1) in COLS.items():
    for bname, (y0, y1) in BANDS.items():
        crop = img.crop((x0, y0, x1, y1))
        scale = 3 if cname == 'z1' else 3
        crop = crop.resize((crop.width * scale, crop.height * scale), Image.LANCZOS)
        p = OUT / f'{SRC.stem.split("-media")[0]}-{cname}-{bname}.png'
        crop.save(p)
        print(p, crop.size)
