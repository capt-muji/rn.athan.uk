"""The deviation distribution: each district's table against the nearest banked
city table, and the coordinate ledger bank."""
import json, glob, os, math, statistics, unicodedata

OUT = os.path.dirname(os.path.abspath(__file__))
COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
mi = lambda s: int(s[:s.index(':')]) * 60 + int(s[s.index(':') + 1:])
wrap = lambda d: (d % 1440) - 1440 if (d % 1440) > 720 else (d % 1440)


def norm(s):
    a = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return ''.join(c for c in a.replace('ß', 'ss').lower() if c.isalnum())


summ = json.load(open(f'{OUT}/data/parse-all.json'))
tables = {s['id']: json.load(open(f'{OUT}/data/district-{s["id"]}-2026.json')) for s in summ}

citytab, citypt = {}, {}
for p in glob.glob(os.path.expanduser('~/athan-gitree/census/o1l-city/germany-cities/data/de-diyanet-*-2026.json')):
    tag = os.path.basename(p).replace('de-diyanet-', '').replace('-2026.json', '')
    citytab[tag] = json.load(open(p))
idx = json.load(open(os.path.expanduser('~/athan-gitree/census/o1l-city/germany-cities/data/igmg-index.json')))
citypt = {tag: v['sun'] for tag, v in idx.items() if tag in citytab}

sun = json.load(open(f'{OUT}/data/igmg-sun.json'))
pt = {}
for v in sun.values():
    if v['sun'] and norm(v['name']) not in pt:
        pt[norm(v['name'])] = v['sun']


def hav(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


rows = []
REJECT = {'HORST', 'REGENSTAUF', 'LAUENFORDE'}
for s in summ:
    p = pt.get(norm(s['name']))
    if not p or s['name'] in REJECT:
        continue
    nearest = min(citypt, key=lambda c: hav((p['lat'], p['lon']), (citypt[c]['lat'], citypt[c]['lon'])))
    d = hav((p['lat'], p['lon']), (citypt[nearest]['lat'], citypt[nearest]['lon']))
    a, b = tables[s['id']], citytab[nearest]
    days = sorted(set(a) & set(b))
    per = {}
    for c in COLS:
        diffs = [wrap(mi(a[k][c]) - mi(b[k][c])) for k in days]
        ab = sorted(abs(x) for x in diffs)
        per[c] = {'med': statistics.median(diffs), 'medAbs': ab[len(ab) // 2],
                  'maxAbs': ab[-1], 'differ': sum(1 for x in diffs if x) / len(diffs)}
    rows.append({'id': s['id'], 'name': s['name'], 'state': s['state'], 'lat': p['lat'], 'lon': p['lon'],
                 'city': nearest, 'km': round(d, 1), 'per': per, 'days': len(days)})

json.dump(rows, open(f'{OUT}/data/vs-city.json', 'w'), indent=1)
print(f'{len(rows)} districts measured against their nearest banked city table')
for c in COLS:
    m = sorted(r['per'][c]['medAbs'] for r in rows)
    s = sorted(r['per'][c]['med'] for r in rows)
    mx = sorted(r['per'][c]['maxAbs'] for r in rows)
    df = sorted(r['per'][c]['differ'] for r in rows)
    print(f'  {c:8s} median|d| {m[len(m)//2]:4.1f}  signed median {s[len(s)//2]:+5.1f}  '
          f'max|d| {mx[-1]:3d}  days-differing median {df[len(df)//2]*100:5.1f}%')
km = sorted(r['km'] for r in rows)
print(f'  distance to that city: median {km[len(km)//2]} km, max {km[-1]} km')

json.dump([{'id': r['id'], 'name': r['name'], 'state': r['state'], 'lat': r['lat'], 'lon': r['lon'],
            'source': 'igmg gazetteer sun point, 0.1 deg'} for r in rows],
          open(f'{OUT}/data/district-coords.json', 'w'), indent=1)
print('  ledger rows', len(rows))
