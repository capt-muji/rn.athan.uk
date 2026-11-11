#!/usr/bin/env python3
"""Flatten a mawaqit conf calendar (12 months, day-keyed, no year marker) into dated rows."""
import json, os, sys

CAPS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captures")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

SURFACES = {
    "andorra": ("mawaqit_andorra_conf.json", 2026),
    "sanmarino": ("mawaqit_sanmarino_conf.json", 2026),
    "malta_birkirkara": ("mawaqit_birkirkara-mosque-slc-1760-birkirkara-malta_conf.json", 2026),
    "malta_bilal": ("mawaqit_bilal-mosque-msjd-bll-msida-msd-1364-malta_conf.json", 2026),
    "gibraltar_sunrise": ("mawaqit_mezquita-sunrise-hotel-gibraltar-gx11-1aa-gibraltar_conf.json", 2026),
}

for tag, (conf, year) in SURFACES.items():
    c = json.load(open(os.path.join(CAPS, conf)))
    rows = {}
    for m in range(12):
        dim = (year % 4 == 0 and m == 1) and 29 or [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]
        for d in range(1, dim + 1):
            r = c["calendar"][m].get(str(d))
            if not r:
                continue
            rows[f"{year}-{m + 1:02d}-{d:02d}"] = dict(
                fajr=r[0], sunrise=r[1], dhuhr=r[2], asr=r[3], maghrib=r[4], isha=r[5])
    os.makedirs(DATA, exist_ok=True)
    out = os.path.join(DATA, f"mawaqit_{tag}_{year}.json")
    json.dump(rows, open(out, "w"), indent=1)
    print(tag, year, len(rows), "rows ->", out)
