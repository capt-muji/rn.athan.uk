"""Shape pass: is the town's own F (or I) a flat-run step table, a smooth
angle-like curve, or LUPT-shaped? Prints per-month town values and run metrics."""
import json, os, sys
from collections import Counter

HOME = os.path.expanduser('~')
OUT = f'{HOME}/athan-gitree/census/o1k-wide/fit14'
LU = json.load(open(f'{OUT}/lupt_fi.json'))

def runs(vals):
    r = 1 + sum(1 for a, b in zip(vals, vals[1:]) if b != a)
    longest = cur = 1
    for a, b in zip(vals, vals[1:]):
        cur = cur + 1 if b == a else 1
        longest = max(longest, cur)
    return r, longest

def show(name):
    s = json.load(open(f'{OUT}/series/{name}.json'))
    print(f"== {name} ({s['src']})")
    for side in ('F', 'I'):
        d = [(r['date'], r[side]) for r in s['rows'] if r[side] is not None]
        if not d:
            continue
        vals = [v for _, v in d]
        nr, longest = runs(vals)
        dm = [(r['date'], r[side] - LU[side][r['mmdd']]) for r in s['rows'] if r[side] is not None]
        dvals = [v for _, v in dm]
        ndr, ndlong = runs(dvals)
        bym = {}
        for dt, v in d:
            bym.setdefault(dt[5:7], []).append(v)
        shape = ' '.join(f"{m}:{min(vs) if vs else ''}..{max(vs)}" for m, vs in sorted(bym.items()))
        print(f"  {side}: town_runs={nr} longest={longest} distinct={len(set(vals))} "
              f"d_runs={ndr} d_longest={ndlong} distinct_d={len(set(dvals))}")
        print(f"    town by month: {shape}")

for name in sys.argv[1:]:
    show(name)

# Coventry summer isha: fixed clock?
s = json.load(open(f'{OUT}/series/coventry-zeenatul-islam-2026.json'))
raw = json.load(open(f"{HOME}/athan-gitree/census/o1k-wide/uktowns2/data/coventry-zeenatul-islam-2026.json"))
print('== Coventry June raw isha/magrib (fixed-clock test)')
js = sorted(set(raw[d]['isha'] for d in raw if d[5:7] == '06'))
mg = sorted(set(raw[d]['magrib'] for d in raw if d[5:7] == '06'))
print('  June isha distinct:', js, ' June magrib distinct:', len(mg))
