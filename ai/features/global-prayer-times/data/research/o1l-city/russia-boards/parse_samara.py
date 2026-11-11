#!/usr/bin/env python3
"""Normalise the Samara (RDUM Samara, CDUM member) month tables."""
import re, os, json

ROOT = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ROOT, 'captures', 'samara')


def clock(s):
    m = re.match(r'^(\d{1,2}):(\d{2})$', s.strip())
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None


rows = {}
for month in range(1, 13):
    path = os.path.join(CAP, f'namaz_month{month}_2026-11-11.html')
    h = open(path, 'rb').read().decode('cp1251', errors='replace')
    for m in re.finditer(
            r'<td align="center" class="namaztime_title" width="40"><span>(\d+)</span></td>(.*?)</tr>',
            h, re.S):
        day = int(m.group(1))
        vals = [clock(x) for x in re.findall(r'<span>([\d:]+)</span>', m.group(2))]
        if len(vals) < 6 or any(v is None for v in vals):
            continue
        rows[f"2026-{month:02d}-{day:02d}"] = dict(
            zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], vals[:6]))

json.dump({'Самара': {'rows': rows, 'yearLabel': 'none printed; coordinate and weekday checks place it in 2026'}},
          open(os.path.join(ROOT, 'data', 'samara.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('rows', len(rows))
