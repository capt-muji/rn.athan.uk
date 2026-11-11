#!/usr/bin/env python3
"""Normalise the DUM RT (Tatarstan) settlement CSVs into dated rows.

Columns differ by year: the 2025 block carries the qibla time as a ninth value,
the 2026 block drops it. The Aktanis export is missing the newline between the
last 2025 row and the first 2026 row, so that one row is split in place.
"""
import csv, os, json, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ROOT, 'captures', 'dumrt')


def clock(s):
    m = re.match(r'^(\d{1,2}):(\d{2})$', s.strip())
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None


cities = {}
for line in open(os.path.join(ROOT, 'data', 'dumrt_cities_2026-11-11.tsv'), encoding='utf-8'):
    slug, name, url = line.rstrip('\n').split('\t')
    cities[slug] = name

out = {}
for path in sorted(glob.glob(os.path.join(CAP, '*.csv'))):
    slug = os.path.basename(path).split('_')[0]
    rows = {}
    fixed = 0
    for raw in open(path, encoding='utf-8', errors='replace').read().split('\n'):
        # The Aktanis export glues the two years together without a newline
        # ("...;13:06" + "01.01.2026;..."), so the boundary is re-cut first.
        parts = re.sub(r'(\d)(\d{2}\.\d{2}\.\d{4};)', '\\1\n\\2', raw).split('\n')
        if len(parts) > 1:
            fixed += 1
        for line in parts:
            if not line.strip():
                continue
            f = [x.strip() for x in line.split(';')]
            m = re.match(r'^(\d{2})\.(\d{2})\.(\d{4})$', f[0]) if f else None
            if not m or len(f) < 9:
                continue
            day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
            vals = [clock(x) for x in f[1:9]]
            if any(v is None for v in vals):
                continue
            rows[f"{year:04d}-{month:02d}-{day:02d}"] = dict(
                zip(['fajr', 'mosqueFajr', 'sunrise', 'zawal', 'dhuhr', 'asr', 'maghrib', 'isha'], vals))
        f = [x.strip() for x in f]
        m = re.match(r'^(\d{2})\.(\d{2})\.(\d{4})$', f[0]) if f else None
        if not m or len(f) < 9:
            continue
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        vals = [clock(x) for x in f[1:9]]
        if any(v is None for v in vals):
            continue
        rows[f"{year:04d}-{month:02d}-{day:02d}"] = dict(
            zip(['fajr', 'mosqueFajr', 'sunrise', 'zawal', 'dhuhr', 'asr', 'maghrib', 'isha'], vals))
    years = sorted({k[:4] for k in rows})
    out[slug] = {'name': cities.get(slug, slug), 'rows': rows, 'years': years, 'repairedRows': fixed}
    print(slug, cities.get(slug), len(rows), years, 'repaired', fixed)

json.dump(out, open(os.path.join(ROOT, 'data', 'dumrt.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('cities', len(out), 'rows', sum(len(v['rows']) for v in out.values()))
