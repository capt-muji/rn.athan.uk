"""Classify every capture's F/I interval arrays against the LUPT reference.

LUPT-exact / LUPT+offset: d within +-1 of a constant on >=95% of days.
LUPT-family-drift: small smooth wander (p95 |d| <= 10, range <= 12), not constant.
angle-signature: large smooth seasonal excursion (consecutive-day smoothness).
own-table-not-LUPT: everything else, subflags for dpt defects.
"""
import json, os
from collections import Counter

HOME = os.path.expanduser('~')
OUT = f'{HOME}/athan-gitree/census/o1k-wide/fit14'
LU = json.load(open(f'{OUT}/lupt_fi.json'))


def dist(rows, side):
    table = LU[side]
    d = [r[side] - table[r['mmdd']] for r in rows if r[side] is not None]
    return d


def profile(d):
    if not d:
        return None
    n = len(d)
    cnt = Counter(d)
    c, freq = cnt.most_common(1)[0]
    tol1 = sum(v for k, v in cnt.items() if abs(k - c) <= 1)
    inside = sorted(abs(x - c) for x in d)
    p95 = inside[int(0.95 * (n - 1))]
    rng = max(d) - min(d)
    cons = max(abs(b - a) for a, b in zip(d, d[1:]))
    smooth_days = sum(1 for a, b in zip(d, d[1:]) if abs(b - a) <= 2)
    runs = 1 + sum(1 for a, b in zip(d, d[1:]) if b != a)
    return {
        'n': n, 'mode': c, 'modeShare': round(freq / n, 3),
        'tol1Share': round(tol1 / n, 3), 'p95resid': p95,
        'range': rng, 'maxStep': cons,
        'smoothShare': round(smooth_days / (n - 1), 3),
        'min': min(d), 'max': max(d), 'runs': runs,
    }


def classify_one(p, side):
    if p is None:
        return None
    if p['tol1Share'] >= 0.95:
        if p['mode'] == 0 and p['modeShare'] >= 0.90:
            return 'LUPT-exact'
        return 'LUPT-offset'
    if p['p95resid'] <= 10 and p['range'] <= 12:
        return 'LUPT-drift'
    if p['smoothShare'] >= 0.95:
        return 'angle-signature'
    return 'own-table'


TOWN = {  # capture -> town, region
    'blackpool-central': ('Blackpool', 'North West'),
    'bolton-zakariyya': ('Bolton', 'North West'),
    'brighton-almedinah': ('Brighton', 'South Coast'),
    'cambridge-central': ('Cambridge', 'East'),
    'coventry-zeenatul-islam': ('Coventry', 'West Midlands'),
    'dudley-mcc': ('Dudley', 'West Midlands'),
    'elm-london': ('London (Elm)', 'London'),
    'ilford': ('London (Ilford)', 'London'),
    'luton-central-mosque': ('Luton', 'Home Counties'),
    'middlesbrough-central': ('Middlesbrough', 'North East'),
    'nottingham-ic': ('Nottingham', 'East Midlands'),
    'oldham-ocmic': ('Oldham (OCMIC)', 'North West'),
    'oldham-westwood': ('Oldham (Westwood)', 'North West'),
    'oxford-coms': ('Oxford', 'Home Counties'),
    'preston-jamea': ('Preston', 'North West'),
    'reading-amic': ('Reading', 'Home Counties'),
    'rochdale-golden': ('Rochdale', 'North West'),
    'slough-jmic': ('Slough', 'Home Counties'),
    'stockport-islamic-centre': ('Stockport', 'North West'),
    'stoke-citycentral': ('Stoke', 'West Midlands'),
    'walsall-wjmg': ('Walsall', 'West Midlands'),
    'watford-jamia': ('Watford', 'Home Counties'),
    'aberdeen-amic-central': ('Aberdeen (Central)', 'Scotland'),
    'aberdeen-amic-spital': ('Aberdeen (Spital)', 'Scotland'),
    'birmingham-central-mosque': ('Birmingham', 'West Midlands'),
    'dundee-almaktoum': ('Dundee', 'Scotland'),
    'east-london-mosque': ('London (East London Mosque)', 'London'),
    'edinburgh-central-mosque': ('Edinburgh', 'Scotland'),
    'glasgow-central-mosque': ('Glasgow', 'Scotland'),
    'hull-mosque': ('Hull', 'Yorkshire'),
    'jamia-masjid-hanfia-bradford': ('Bradford (Hanfia)', 'Yorkshire'),
    'leicester-masjid-umar': ('Leicester', 'East Midlands'),
    'london-central-mosque-icc': ('London (ICC)', 'London'),
    'mwh-north-london': ('London (MWH)', 'London'),
    'swicc-cardiff': ('Cardiff', 'Wales'),
    'victor-street-bradford': ('Bradford (Victor St)', 'Yorkshire'),
}

result = []
for fn in sorted(os.listdir(f'{OUT}/series')):
    key = fn[:-5]
    s = json.load(open(f'{OUT}/series/{fn}'))
    rows = s['rows']
    pF, pI = profile(dist(rows, 'F')), profile(dist(rows, 'I'))
    cF, cI = classify_one(pF, 'F'), classify_one(pI, 'I')
    town, region = TOWN.get(key, (key, 'unknown'))
    # subflags
    flags = []
    if pF and pF['max'] - pF['mode'] > 40 and pF['maxStep'] <= 3:
        flags.append('dpt-unclamped-fajr-summer-spike')
    if pI and pI['max'] - pI['mode'] > 40 and pI['maxStep'] <= 3:
        flags.append('dpt-unclamped-isha-summer-spike')
    # town label priority: any own/angle dominates; both constant => exact/offset
    sides = [c for c in (cF, cI) if c]
    if any(c in ('own-table', 'angle-signature') for c in sides):
        town_cls = 'own-table-not-LUPT' if 'own-table' in sides else 'angle-table'
    elif all(c in ('LUPT-exact', 'LUPT-offset') for c in sides):
        town_cls = 'LUPT-exact' if all(c == 'LUPT-exact' for c in sides) else 'LUPT+offset'
    else:
        town_cls = 'LUPT-family-drift'
    result.append({
        'capture': key, 'town': town, 'region': region, 'src': s['src'],
        'rows': len(rows), 'coverage': s['wraps'] and 'wrap' or 'clean',
        'F': pF, 'I': pI, 'classF': cF, 'classI': cI,
        'class': town_cls, 'flags': flags,
    })

json.dump(result, open(f'{OUT}/classification-raw.json', 'w'), indent=1)
for r in result:
    pf, pi = r['F'], r['I']
    ftxt = f"F {r['classF']} c={pf['mode']} share={pf['modeShare']} tol1={pf['tol1Share']} rng={pf['range']} runs={pf['runs']}" if pf else 'F none'
    itxt = f"I {r['classI']} c={pi['mode']} share={pi['modeShare']} tol1={pi['tol1Share']} rng={pi['range']} runs={pi['runs']}" if pi else 'I none'
    print(f"{r['town']:28s} {r['src']:10s} n={r['rows']:3d} {ftxt}\n{'':28s} {'':10s}      {itxt}  {r['flags']}")
