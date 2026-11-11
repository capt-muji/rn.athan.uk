"""Neutral two-feed Yemen diff. Facts only: no fit, no recommendation.

Sanaa feed: awqaf.gov.ye get_page_data, 31 locations, 9 dated days of Nov 2026.
Aden feed:  yemenawqaf.org/prayer-times, 6 cities, full Nov 2026.
"""
import json, statistics

ROOT = '$HOME/athan-gitree/census/o1k-wide/gulf2/data'
sanaa = json.load(open(f'{ROOT}/ye-sanaa-31-locations-nov2026.json'))
aden = json.load(open(f'{ROOT}/ye-gov-aden-nov2026.json'))

# Feed-location name pairs that name the same place in both feeds.
PAIRS = [
    ('عدن', 'عدن', 'Aden'),
    ('حضرموت - المكلا', 'المكلا', 'Mukalla'),
    ('حضرموت - سيئون', 'سيئون', 'Seiyun'),
    ('مأرب', 'مارب', 'Marib'),
]
# Served by both feeds under different granularity: governorate vs its capital city.
NEAR = [
    ('المهرة', 'الغيضة', 'Mahra governorate vs Ghaydah (its capital)'),
    ('لحج', 'الحوطة', 'Lahj governorate vs Al Hawtah (its capital)'),
]

def mins(hhmm):
    h, m = hhmm.split(':')[:2]
    return int(h) * 60 + int(m)

PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha']

sanaa_dates = sorted({d for loc in sanaa.values() for d in loc})
shared_dates = [d for d in sanaa_dates if d in aden]

out = {
    'generated': '2026-11-10',
    'feeds': {
        'sanaa': {
            'publisher': 'Awqaf authority, Sanaa (awqaf.gov.ye)',
            'endpoint': '/api/method/blue_theme.blue_theme.page.tebyan_prayer_panel.tebyan_prayer_panel.get_page_data?fetch_date=',
            'locations': len(sanaa),
            'dates_held': [sanaa_dates[0], sanaa_dates[-1], len(sanaa_dates)],
            'note': 'rolling window; 2026-11-08 and every date after 2026-11-10 returned an empty document',
        },
        'aden': {
            'publisher': 'Ministry of Awqaf and Guidance, Aden (yemenawqaf.org)',
            'endpoint': '/prayer-times (Livewire POST; URL params ignored)',
            'cities': 6,
            'years_selectable': [2025, 2026, 2027],
            'dates_held': [min(aden), max(aden), len(aden)],
        },
    },
    'overlap_dates': shared_dates,
    'exact_pairs': [],
    'near_pairs': [],
    'per_prayer_delta': {},
}

def block(sloc, aloc, dates):
    rows = []
    for d in dates:
        s, a = sanaa[sloc].get(d), aden.get(d)
        if not s or not a:
            continue
        rows.append({
            'date': d,
            'sanaa': {p: s[p] for p in PRAYERS},
            'aden': {p: a[p] for p in PRAYERS},
            'delta_aden_minus_sanaa_min': {p: mins(a[p]) - mins(s[p]) for p in PRAYERS},
        })
    return rows

for sloc, aloc, label in PAIRS:
    rows = block(sloc, aloc, shared_dates)
    out['exact_pairs'].append({'label': label, 'sanaa_location': sloc, 'aden_location': aloc, 'rows': rows})
for sloc, aloc, label in NEAR:
    rows = block(sloc, aloc, shared_dates)
    out['near_pairs'].append({'label': label, 'sanaa_location': sloc, 'aden_location': aloc, 'rows': rows})

allrows = [r for p in out['exact_pairs'] for r in p['rows']]
for p in PRAYERS:
    ds = [r['delta_aden_minus_sanaa_min'][p] for r in allrows]
    out['per_prayer_delta'][p] = {
        'n': len(ds), 'mean': round(statistics.mean(ds), 2),
        'min': min(ds), 'max': max(ds),
        'histogram': {str(k): ds.count(k) for k in sorted(set(ds))},
    }

# Coverage statement: which places each feed serves that the other does not.
out['coverage'] = {
    'sanaa_only': sorted(set(sanaa) - {p[0] for p in PAIRS} - {p[0] for p in NEAR}),
    'aden_only': sorted({p[1] for p in PAIRS} | {p[1] for p in NEAR}),
}

json.dump(out, open('$HOME/athan-gitree/census/o1k-wide/kel2/yemen-diff.json', 'w'),
          ensure_ascii=False, indent=1)

for p in out['exact_pairs']:
    print('##', p['label'])
    for r in p['rows']:
        print(' ', r['date'], 'F', r['sanaa']['fajr'], r['aden']['fajr'],
              r['delta_aden_minus_sanaa_min']['fajr'],
              '| I', r['sanaa']['isha'], r['aden']['isha'],
              r['delta_aden_minus_sanaa_min']['isha'])
print('\nper-prayer delta (aden - sanaa, minutes):')
for k, v in out['per_prayer_delta'].items():
    print(f"  {k:8s} n={v['n']:2d} mean={v['mean']:+.2f} range={v['min']:+d}..{v['max']:+d} hist={v['histogram']}")
print('\noverlap dates:', shared_dates)
print('sanaa dates:', sanaa_dates)
print('\nsanaa-only locations:', ', '.join(out['coverage']['sanaa_only']))
