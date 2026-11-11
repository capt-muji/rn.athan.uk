# Cross-check the census Jamiat engine through the census's own solar.py model
# (NOAA/Meeus) - the ruler the engine was originally defined with.
import json, sys
sys.path.insert(0, '../southernafrica2')
from solar import day_events

TOWNS = [
    ('Maputo',   'jamiat-maputo-2026-12.json'),
    ('Windhoek', 'jamiat-windhoek-2026-12.json'),
    ('Luanda',   'jamiat-luanda-2026-12.json'),
    ('Maseru',   'jamiat-maseru-2026-12.json'),
    ('Mbabane',  'jamiat-mbabane-2026-12.json'),
    ('Harare',   'jamiat-harare-2026-12.json'),
    ('Bulawayo', 'jamiat-bulawayo-2026-12.json'),
    ('Blantyre', 'jamiat-blantyre-2026-12.json'),
    ('Lilongwe', 'jamiat-lilongwe-2026-12.json'),
    ('Mzuzu',    'jamiat-mzuzu-2026-12.json'),
    ('Zomba',    'jamiat-zomba-2026-12.json'),
]
FALLBACK = {'Harare': (-17.8250, 31.0333), 'Bulawayo': (-20.1500, 28.5833)}
import re, datetime, statistics

tot = 0; tex = 0
for town, f in TOWNS:
    doc = json.load(open('../southernafrica2/data/' + f))
    if doc.get('coords_as_published'):
        m = re.match(r"([\d.]+)([NS]), ([\d.]+)([EW])", doc['coords_as_published'])
        lat = float(m.group(1)) * (-1 if m.group(2) == 'S' else 1)
        lon = float(m.group(3)) * (-1 if m.group(4) == 'W' else 1)
        printed = doc['coords_as_published']
    else:
        lat, lon = FALLBACK[town]; printed = 'not printed'
    off = doc.get('utc_offset_hours', 2)
    cols = {}
    exact = 0; n = 0; worst = 0; percol = {}
    for d, row in sorted(doc['rows'].items()):
        date = datetime.date.fromisoformat(d)
        ev = day_events(date, lat, lon, off)
        m18 = ev['fajr18']
        comp = {
            'suhoor': ev['fajr18'] - 5 if m18 is not None else None,
            'fajr': m18,
            'sunrise': ev['sunrise'],
            'ishraaq': ev['sunrise'] + 15 if ev['sunrise'] is not None else None,
            'dhuha': ev['sunrise'] + 195 if ev['sunrise'] is not None else None,
            'zawaal': ev['transit'] - 5,
            'zuhr': ev['transit'] + 5,
            'asr_shafi': ev['asr_shafi'],
            'asr_hanafi': ev['asr_hanafi'],
            'sunset': ev['sunset'] - 3 if ev['sunset'] is not None else None,
            'maghrib': ev['sunset'] + 3 if ev['sunset'] is not None else None,
            'isha_shafi': ev['isha15'],
            'isha_hanafi': (2 * ev['transit'] - m18) if m18 is not None else None,
        }
        def pm(s):
            h, mi = s.split(':'); return int(h) * 60 + int(mi)
        for c, v in comp.items():
            if v is None: continue
            p = pm(row[c])
            diff = abs(round(v) - p)
            percol.setdefault(c, []).append(diff)
    line = f"{town:10}"
    res = {}
    for c, v in percol.items():
        e = sum(1 for x in v if x == 0)
        res[c] = (e, len(v), max(v))
        exact += e; n += len(v); worst = max(worst, max(v))
    tot += n; tex += exact
    bad = {c: r for c, r in res.items() if r[0] < r[1]}
    print(f"{town:10} {printed:24} exact {exact}/{n} worst {worst}  " +
          ' '.join(f"{c}:{e}/{k}(w{w})" for c, (e, k, w) in bad.items()))
print(f"TOTAL solar.py engine exact {tex}/{tot}")
