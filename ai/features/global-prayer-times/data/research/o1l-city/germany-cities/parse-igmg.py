import json, glob, os, re, sys

COLS = {'fajr': 'fajr', 'sunrise': 'sunrise', 'dhuhr': 'dhuhr', 'asr': 'asr', 'maghrib': 'maghrib', 'isha': 'ishaa'}
MONTHS = []
y, m = 2026, 10
for _ in range(14):
    MONTHS.append(f'{y}-{m:02d}')
    m += 1
    if m == 13:
        y, m = y + 1, 1

tags = [l.split(':')[0] for l in open('cities.tsv') if l.strip()]
report = {}
for tag in tags:
    rows, sun = {}, None
    for mo in MONTHS:
        p = f'captures/igmg-{tag}-{mo}.json'
        if not os.path.exists(p):
            continue
        d = json.load(open(p))
        for day in d.get('days', []):
            rows[day['date']] = {k: day['times'][v] for k, v in COLS.items()}
    t = json.load(open(f'captures/igmg-times-{tag}.json'))
    sun = t.get('sun')
    out = f'data/igmg-{tag}.json'
    json.dump(rows, open(out, 'w'), indent=0)
    ks = sorted(rows)
    report[tag] = {'rows': len(rows), 'span': [ks[0], ks[-1]] if ks else None, 'sun': sun}
    print(f'{tag:12} {len(rows):4} rows {ks[0]}..{ks[-1]}  sun {sun}')
json.dump(report, open('data/igmg-index.json', 'w'), indent=1)
