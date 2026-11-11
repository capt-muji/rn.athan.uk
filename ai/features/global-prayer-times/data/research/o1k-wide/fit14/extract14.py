"""Extract per-capture F[MM-DD] and I[MM-DD] interval series.

F = sunrise - fajr (minutes fajr leads sunrise)
I = isha - maghrib (minutes isha lags maghrib)
Both are longitude-free: the interval between two columns of the same table.
Times are HH:MM strings rounded to the minute, so each side carries +-1 min
rounding; a computed interval carries +-2 worst case, typically 0/1.
"""
import json, os, glob

HOME = os.path.expanduser('~')
BASE = f'{HOME}/athan-gitree/census/o1k-wide'
OUT = f'{BASE}/fit14'

COLS = {  # capture column -> canonical
    'sunrise': 'sunrise', 'fajr': 'fajr', 'fajr_begins': 'fajr',
    'subh_sadiq': 'fajr', 'magrib': 'maghrib', 'maghrib_begins': 'maghrib',
    'magrib_jamah': 'maghrib', 'isha': 'isha', 'isha_begins': 'isha',
    'esha': 'isha',
}

def mins(hhmm):
    h, m = hhmm.split(':')
    return int(h) * 60 + int(m)

def series(path):
    j = json.load(open(path))
    rows = []
    wraps = 0
    for d in sorted(j.keys()):
        v = j[d]
        c = {}
        for k, val in v.items():
            if k in COLS and isinstance(val, str) and ':' in val:
                c[COLS[k]] = mins(val)
        f = i = None
        if 'sunrise' in c and 'fajr' in c:
            f = c['sunrise'] - c['fajr']
            if f < 0:
                wraps += 1
                f = None
        if 'maghrib' in c and 'isha' in c:
            i = c['isha'] - c['maghrib']
            if i < 0:
                wraps += 1
                i = None
        rows.append({'date': d, 'mmdd': d[5:10], 'F': f, 'I': i})
    return rows, wraps

if __name__ == '__main__':
    lu = json.load(open(f'{OUT}/lupt_fi.json'))
    F, I = lu['F'], lu['I']
    jobs = []
    for d in ('uktowns2/data', 'ukscotland/data'):
        for p in sorted(glob.glob(f'{BASE}/{d}/*.json')):
            b = os.path.basename(p)
            if b.startswith('_') or b.startswith('lupt'):
                continue
            jobs.append((d.split('/')[0], b, p))
    # validate the reference against every captured LUPT month first
    print('== LUPT reference validation (captured months vs recipe tables)')
    for p in sorted(glob.glob(f'{BASE}/uktowns2/data/lupt-*.json')) + \
             [f'{BASE}/ukscotland/data/lupt-monthly-2027-01.json']:
        rows, wraps = series(p)
        df = [r['F'] - F[r['mmdd']] for r in rows if r['F'] is not None]
        di = [r['I'] - I[r['mmdd']] for r in rows if r['I'] is not None]
        from collections import Counter
        print(f"  {os.path.basename(p)}: F d={dict(Counter(df))} I d={dict(Counter(di))}")
    # extract every capture's series
    for src, b, p in jobs:
        rows, wraps = series(p)
        n = len(rows)
        nf = sum(1 for r in rows if r['F'] is not None)
        ni = sum(1 for r in rows if r['I'] is not None)
        json.dump({'src': src, 'file': b, 'wraps': wraps, 'rows': rows},
                  open(f"{OUT}/series/{b[:-5]}.json", 'w'))
        print(f"  {src}/{b}: rows={n} F={nf} I={ni} wraps={wraps}")
