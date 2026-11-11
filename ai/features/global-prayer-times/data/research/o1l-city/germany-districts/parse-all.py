"""Parse every captured district page and report the whole-axis numbers:
distinctness, the pairwise deviation distribution per state, and the recipe
margins at every district that carries a gazetteer point."""
import re, json, glob, os, csv, statistics, hashlib, itertools

OUT = os.path.dirname(os.path.abspath(__file__))
COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def yearly_tables(html):
    out = []
    for m in re.finditer(r'<table[^>]*class="[^"]*vakit-table[^"]*"[^>]*>(.*?)</table>', html, re.S):
        d = {}
        for r in re.finditer(r'<tr>\s*<td>(\d{2})\.(\d{2})\.(\d{4})</td>(.*?)</tr>', m.group(1), re.S):
            day, mon, yr, rest = r.groups()
            t = re.findall(r'<td>\s*(\d{1,2}:\d{2})\s*</td>', rest)
            if len(t) >= 6:
                d[f'{yr}-{mon}-{day}'] = dict(zip(COLS, t[:6]))
        out.append(d)
    return out


rows = list(csv.DictReader(open(f'{OUT}/data/districts-all.tsv'), delimiter='\t'))
meta, summary = {}, []
for r in rows:
    meta[r['id']] = r

for path in sorted(glob.glob(f'{OUT}/captures/district-*.html')):
    did = os.path.basename(path).split('-')[1].split('.')[0]
    if did not in meta:
        continue
    dest = f'{OUT}/data/district-{did}-2026.json'
    html = open(path, encoding='utf-8', errors='replace').read()
    tabs = yearly_tables(html)
    good = [t for t in tabs if len(t) >= 360]
    if not good:
        summary.append({**meta[did], 'rows': 0, 'error': 'no year table'})
        continue
    base = good[0]
    conflicts = sum(1 for o in good[1:] for k, v in base.items() if o.get(k) and o[k] != v)
    json.dump(base, open(dest, 'w'), indent=0)
    summary.append({**meta[did], 'rows': len(base), 'span': [min(base), max(base)],
                    'conflicts': conflicts, 'n2027': html.count('2027')})

json.dump(summary, open(f'{OUT}/data/parse-all.json', 'w'), indent=1)
ok = [s for s in summary if s.get('rows')]
print(f'parsed {len(ok)} of {len(rows)} enumerated districts, {sum(s["rows"] for s in ok)} district-days')
print('row counts', sorted({s['rows'] for s in ok}))
print('conflicts total', sum(s['conflicts'] for s in ok))
print('2027 occurrences', sorted({s['n2027'] for s in ok}))
print('states', len({s['state'] for s in ok}))

sig = {}
for s in ok:
    t = json.load(open(f'{OUT}/data/district-{s["id"]}-2026.json'))
    sig.setdefault(hashlib.sha256(json.dumps(t, sort_keys=True).encode()).hexdigest()[:12], []).append(s)
dupes = {h: v for h, v in sig.items() if len(v) > 1}
print(f'distinct tables {len(sig)} of {len(ok)}; identical clusters {len(dupes)}')
for h, v in list(dupes.items())[:5]:
    print('  ', [(x['id'], x['name'], x['state']) for x in v])

by_state = {}
for s in ok:
    by_state.setdefault(s['state'], []).append(s)
print('\nper state: n, distinct')
for st in sorted(by_state):
    ds = by_state[st]
    h = {hashlib.sha256(json.dumps(json.load(open(f'{OUT}/data/district-{d["id"]}-2026.json')), sort_keys=True).encode()).hexdigest() for d in ds}
    print(f'  {st:26s} {len(ds):3d}  {len(h)}')
