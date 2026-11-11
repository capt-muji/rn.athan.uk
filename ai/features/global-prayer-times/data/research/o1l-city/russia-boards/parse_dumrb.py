#!/usr/bin/env python3
"""Normalise the DUM RB API captures into dated per-city rows."""
import json, glob, os, sys, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ROOT, 'captures', 'dumrb')
OUT = os.path.join(ROOT, 'data')

cities = {}
for line in open(os.path.join(OUT, 'dumrb_cities.tsv'), encoding='utf-8'):
    cid, name, lat, lon = line.rstrip('\n').split('\t')
    cities[int(cid)] = {'name': name, 'lat': float(lat), 'lon': float(lon)}

def hm(v):
    if not v:
        return None
    parts = v.split(':')
    return int(parts[0]) * 60 + int(parts[1])

rows = {2025: collections.defaultdict(dict), 2026: collections.defaultdict(dict)}
meta = {2025: collections.defaultdict(set), 2026: collections.defaultdict(set)}
for path in sorted(glob.glob(os.path.join(CAP, '*.json'))):
    base = os.path.basename(path).split('.')[0]
    year, cid, month = (int(x) for x in base.split('_'))
    try:
        d = json.load(open(path, encoding='utf-8'))
    except Exception:
        continue
    if 'prayerTimes' not in d:
        continue
    cid_api = d.get('cityId')
    times = d['prayerTimes']
    if not times:
        continue
    meta[year][cid].add(month)
    for i, t in enumerate(times, start=1):
        day = f"{year:04d}-{month:02d}-{i:02d}"
        rows[year][cid][day] = {
            'fajr': hm(t.get('fajr')),
            'sunrise': hm(t.get('sunrise')),
            'dhuhr': hm(t.get('dhuhr')),
            'zaual': hm(t.get('zaual')),
            'asr': hm(t.get('asr')),
            'maghrib': hm(t.get('maghrib')),
            'isha': hm(t.get('isha')),
            'suhur': hm(t.get('suhurDo')),
        }

for year in (2025, 2026):
    payload = {'cities': {}, 'meta': {}}
    for cid, recs in rows[year].items():
        c = cities[cid]
        payload['cities'][c['name']] = {
            'id': cid, 'lat': c['lat'], 'lon': c['lon'],
            'months': sorted(meta[year][cid]),
            'rows': recs,
        }
    json.dump(payload, open(os.path.join(OUT, f'dumrb_{year}.json'), 'w', encoding='utf-8'),
              ensure_ascii=False)
    print(year, len(payload['cities']), 'cities',
          sum(len(c['rows']) for c in payload['cities'].values()), 'rows',
          'full-year', sum(1 for c in payload['cities'].values() if len(c['months']) == 12))
