#!/usr/bin/env python3
"""Parse the mechet.ru (platform tier) November 2026 tables captured via browser."""
import json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'data')

SOURCES = {
    'Челябинск': ('captures/mechet/chelyabinsk_2026-11.txt', 55.16, 61.40, 'Asia/Yekaterinburg'),
    'Новосибирск': ('captures/mechet/novosibirsk_2026-11.txt', 55.03, 82.92, 'Asia/Novosibirsk'),
}
LINE = re.compile(r'^(\d{2})\.(\d{2})\s*·.*?((?:\d{2}:\d{2}){6})$')


def clock(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)


out = {}
for city, (rel, lat, lon, tz) in SOURCES.items():
    rows = {}
    for line in open(os.path.join(ROOT, rel), encoding='utf-8'):
        m = LINE.match(line.strip())
        if not m:
            continue
        day, month = int(m.group(1)), int(m.group(2))
        vals = [clock(x) for x in re.findall(r'\d{2}:\d{2}', m.group(3))]
        rows[f"2026-{month:02d}-{day:02d}"] = dict(
            zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], vals))
    out[city] = {'lat': lat, 'lon': lon, 'tz': tz, 'rows': rows}
    print(city, len(rows), 'rows')

json.dump(out, open(os.path.join(OUT, 'mechet_2026_11.json'), 'w', encoding='utf-8'), ensure_ascii=False)
