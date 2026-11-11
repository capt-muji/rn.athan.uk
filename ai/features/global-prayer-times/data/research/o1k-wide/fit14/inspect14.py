"""Month-by-month shape of dF/dI for the contested captures, to separate
defect blocks (dpt DST windows, unclamped summer) from genuine drift."""
import json, os, sys
from collections import Counter

HOME = os.path.expanduser('~')
OUT = f'{HOME}/athan-gitree/census/o1k-wide/fit14'
LU = json.load(open(f'{OUT}/lupt_fi.json'))

def robust_center(d):
    best, bc = -1, 0
    for c in range(min(d) - 1, max(d) + 2):
        n = sum(1 for x in d if abs(x - c) <= 1)
        if n > best or (n == best and abs(c) < abs(bc)):
            best, bc = n, c
    return bc, best / len(d)

def show(name):
    s = json.load(open(f'{OUT}/series/{name}.json'))
    rows = s['rows']
    for side in ('F', 'I'):
        d = [(r['date'], r[side] - LU[side][r['mmdd']]) for r in rows if r[side] is not None]
        if not d:
            print(f'{name} {side}: none'); continue
        c, share = robust_center([x[1] for x in d])
        dirty = [(dt, v) for dt, v in d if abs(v - c) > 3]
        bym = Counter(dt[5:7] for dt, v in dirty)
        vals = sorted(set(v for _, v in dirty))
        outside = sum(1 for _, v in d if abs(v - c) > 1) - len(dirty)
        print(f'{name} {side}: c={c} tol1={share:.3f} clean_outside±1={outside} dirty_days={len(dirty)} by_month={dict(bym)} dirty_vals={vals[:12]}')

for name in sys.argv[1:]:
    show(name)
