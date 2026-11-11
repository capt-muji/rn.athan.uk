import json, subprocess, sys

D = json.load(open('data/mawaqit-o1l-20r-2026.json'))
COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

def to_min(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)

for slug, v in D.items():
    days = {k: x for k, x in v['days'].items() if k != '2026-02-29'}
    payload = {'lat': v['lat'], 'lon': v['lon'], 'tz': v['timezone'],
               'rows': {k: {c: to_min(t[c]) for c in COLS} for k, t in days.items()}}
    open(f'scratch/{slug}.json', 'w').write(json.dumps(payload))
    r = subprocess.run(['node', 'fit_mawaqit.mjs', f'scratch/{slug}.json'], capture_output=True, text=True)
    print(f'=== {slug}  ({v["name"]})  {len(days)} rows  {v["timezone"]}')
    print(r.stdout.strip() or r.stderr.strip()[:500])
