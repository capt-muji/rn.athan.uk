#!/usr/bin/env python3
"""Normalize harvested masjidbox captures into the brief's row shape:
{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}} as HH:MM in Asia/Kolkata."""
import json, os, sys

COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
HERE = os.path.dirname(os.path.abspath(__file__))


def normalize(path, out, year):
    days = json.load(open(path))['days']
    rows = {}
    for key, row in sorted(days.items()):
        if not key.startswith(str(year)):
            continue
        rows[key] = {c: row[c][11:16] for c in COLS}
    json.dump(rows, open(out, 'w'), indent=0)
    print(f'{os.path.basename(out)}: {len(rows)} rows')


if __name__ == '__main__':
    year = int(sys.argv[1])
    for name in sys.argv[2:]:
        src = os.path.join(HERE, 'captures', f'mbx-{name}-{year}.json')
        if not os.path.exists(src):
            print(f'{name} {year}: MISSING')
            continue
        normalize(src, os.path.join(HERE, 'data', f'masjidbox-{name}-{year}.json'), year)
