"""IGMG against the Diyanet portal on every overlapping day: is the mirror the
same computed generation? Compares all 23 captured cities (17 new here, six held
in the two earlier workspaces) over 2026-10-01..2026-12-31.
Run: python3 check-mirror.py
"""
import json

HELD = '$HOME/athan-gitree/census/o1l-city/watches-eu/data/'
O1K = '$HOME/athan-gitree/census/o1k-wide/europe/data/'
SIX = {'koln': O1K + 'de-diyanet-koeln-2026.json', 'berlin': O1K + 'de-diyanet-berlin-2026.json',
       'frankfurt': O1K + 'de-diyanet-frankfurt-2026.json',
       'muenchen': HELD + 'de-diyanet-muenchen-2026.json', 'hamburg': HELD + 'de-diyanet-hamburg-2026.json',
       'stuttgart': HELD + 'de-diyanet-stuttgart-2026.json'}
# The o1k files name the imsak column differently from the o1l ones.
MAP_O1K = {'fajr': 'fajr_imsak', 'sunrise': 'sunrise', 'dhuhr': 'dhuhr', 'asr': 'asr', 'maghrib': 'magrib', 'isha': 'isha'}
COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def mins(v):
    h, m = v.split(':')
    return int(h) * 60 + int(m)


def compare(tag, path, mapping):
    portal = json.load(open(path))
    mirror = json.load(open(f'data/igmg-{tag}.json'))
    norm = {k: {c: portal[k][mapping[c]] for c in COLS} for k in portal}
    days = [k for k in sorted(norm) if k in mirror]
    identical = sum(1 for k in days if norm[k] == mirror[k])
    worst = max(abs(mins(norm[k][c]) - mins(mirror[k][c])) for k in days for c in COLS)
    return days, identical, worst


total_days = total_ident = 0
tags = [l.split(':')[0] for l in open('cities.tsv') if l.strip()]
for tag in tags:
    path = SIX.get(tag, f'data/de-diyanet-{tag}-2026.json')
    if tag in SIX and tag not in ('muenchen', 'hamburg', 'stuttgart'):
        mapping = MAP_O1K
    else:
        mapping = {c: c for c in COLS}
    days, identical, worst = compare(tag, path, mapping)
    print(f'{tag:12} {len(days):3} common  identical {identical:3}  worst {worst}')
    total_days += len(days)
    total_ident += identical
print(f'TOTAL {len(tags)} cities, {total_days} city-days, {total_ident} identical')
