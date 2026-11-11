import json, glob, os, re, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
P = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
out_index = {}
for f in sorted(glob.glob('captures/ba_api_*_year.json')):
    m = re.search(r'ba_api_(\d+)_(\d{4})_year\.json', f)
    if not m:
        continue
    raw = json.load(open(f))
    loc = raw['lokacija']
    year = raw['godina']
    rows = {}
    for mi, month in enumerate(raw['mjesec'], 1):
        for di, day in enumerate(month['dan'], 1):
            v = day['vakat']
            rows['%04d-%02d-%02d' % (year, mi, di)] = dict(zip(P, v))
    out = {'source': 'https://api.vaktija.ba/vaktija/v1/%s/%s' % (m.group(1), year),
           'publisher': 'vaktija.ba (Rijaset-branded mirror of the official Bosnian timetable)',
           'tier': 'community mirror of authority', 'place': loc, 'id': int(m.group(1)),
           'year': year, 'columns': P, 'rows': dict(sorted(rows.items()))}
    name = re.sub(r'[^a-z0-9]+', '_', loc.lower()).strip('_')
    json.dump(out, open('data/ba_%s_%s.json' % (name, year), 'w'), ensure_ascii=False, indent=0)
    out_index[int(m.group(1))] = {'place': loc, 'days': len(rows), 'file': 'ba_%s_%s.json' % (name, year),
                                 'first': min(rows), 'last': max(rows)}
    print('%-16s id=%-4d days=%d %s..%s' % (loc, int(m.group(1)), len(rows), min(rows), max(rows)))
json.dump(out_index, open('data/ba_cities_index.json', 'w'), ensure_ascii=False, indent=1)
print('total cities', len(out_index))
