#!/usr/bin/env python3
"""Per-column distinct-value count for a mawaqit calendar: fixed clocks vs solar-tracking."""
import json, sys
from collections import Counter

COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

for path in sys.argv[1:]:
    d = json.load(open(path))
    cal = d['calendar']
    per = {c: [] for c in COLS}
    for month in cal:
        for day, vals in month.items():
            for i, c in enumerate(COLS):
                per[c].append(vals[i])
    print(f"== {path}  lat={d['lat']:.3f} lon={d['lon']:.3f} tz={d['tz']}")
    for c in COLS:
        v = per[c]
        cnt = Counter(v)
        top = cnt.most_common(1)[0]
        print(f"   {c:8s} n={len(v):4d} distinct={len(cnt):4d} mode={top[0]}@{top[1]} min={min(v)} max={max(v)}")
