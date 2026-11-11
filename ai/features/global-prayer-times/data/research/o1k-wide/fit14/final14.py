"""Final classification, town rollup and byte accounting. Writes englupt.json.

Per-array classes:
  exact | offset | offset+dip | offset+step | drift | angle-like | own-table
Offset tests run on days outside masked blocks (DST blips, smooth dips,
constant steps); a block only counts as a town override when it covers
<=40% of days, otherwise the smooth bulk IS the table (angle-like/own).
"""
import json, os
from collections import Counter

HOME = os.path.expanduser('~')
OUT = f'{HOME}/athan-gitree/census/o1k-wide/fit14'
LU = json.load(open(f'{OUT}/lupt_fi.json'))

TOWN = {
    'blackpool-central-2026-11': ('Blackpool', 'North West'),
    'bolton-zakariyya-2026': ('Bolton', 'North West'),
    'brighton-almedinah-2026-11': ('Brighton', 'South Coast'),
    'cambridge-central-2026-11': ('Cambridge', 'East'),
    'coventry-zeenatul-islam-2026': ('Coventry', 'West Midlands'),
    'dudley-mcc-2026-11': ('Dudley', 'West Midlands'),
    'elm-london-2026': ('London (Elm)', 'London'),
    'ilford-2026-11': ('London (Ilford)', 'London'),
    'luton-central-mosque-2026-11': ('Luton', 'Home Counties'),
    'middlesbrough-central-2026-11': ('Middlesbrough', 'North East'),
    'nottingham-ic-2026': ('Nottingham', 'East Midlands'),
    'oldham-ocmic-2026': ('Oldham (OCMIC)', 'North West'),
    'oldham-westwood-2026': ('Oldham (Westwood)', 'North West'),
    'oxford-coms-2026': ('Oxford', 'Home Counties'),
    'preston-jamea-2026-11': ('Preston', 'North West'),
    'reading-amic-2026': ('Reading', 'Home Counties'),
    'rochdale-golden-2026': ('Rochdale', 'North West'),
    'slough-jmic-2022': ('Slough', 'Home Counties'),
    'stockport-islamic-centre-2026-11': ('Stockport', 'North West'),
    'stoke-citycentral-month': ('Stoke', 'West Midlands'),
    'walsall-wjmg-2020': ('Walsall', 'West Midlands'),
    'watford-jamia-2026-11': ('Watford', 'Home Counties'),
    'aberdeen-amic-central-2026': ('Aberdeen (Central)', 'Scotland (contrast)'),
    'aberdeen-amic-spital-2026': ('Aberdeen (Spital)', 'Scotland (contrast)'),
    'birmingham-central-mosque-2026-11': ('Birmingham', 'West Midlands'),
    'dundee-almaktoum-mosque-2026': ('Dundee', 'Scotland (contrast)'),
    'east-london-mosque-2026': ('London (East London Mosque)', 'London'),
    'edinburgh-central-mosque-2026-11': ('Edinburgh', 'Scotland (contrast)'),
    'galway-gicc-rest-2026': ('Galway', 'Ireland (contrast)'),
    'glasgow-central-mosque-2026': ('Glasgow', 'Scotland (contrast)'),
    'hull-mosque-2026': ('Hull', 'Yorkshire'),
    'jamia-masjid-hanfia-bradford-2026': ('Bradford (Hanfia)', 'Yorkshire'),
    'leicester-masjid-umar-2026-11': ('Leicester', 'East Midlands'),
    'london-central-mosque-icc-2026-11-12': ('London (ICC)', 'London'),
    'mwh-north-london-2026-11': ('London (MWH)', 'London'),
    'swicc-cardiff-2026-11': ('Cardiff', 'Wales (contrast)'),
    'victor-street-bradford-2026-11': ('Bradford (Victor St)', 'Yorkshire'),
}


def robust_center(vals):
    cnt = Counter(vals)
    best_n, best_c, best_e = -1, 0, -1
    for c in range(min(vals) - 1, max(vals) + 2):
        n = sum(1 for x in vals if abs(x - c) <= 1)
        e = cnt.get(c, 0)
        if n > best_n or (n == best_n and (e > best_e or (e == best_e and abs(c) < abs(best_c)))):
            best_n, best_c, best_e = n, c, e
    return best_c


def rle_bytes(vals):
    runs = 1 + sum(1 for a, b in zip(vals, vals[1:]) if b != a)
    return runs * 3


def analyse(rows, side, min_days):
    d = [(r['date'], r[side] - LU[side][r['mmdd']]) for r in rows if r[side] is not None]
    if not d:
        return None
    dates = [x[0] for x in d]
    vals = [x[1] for x in d]
    n = len(vals)
    c = robust_center(vals)
    mask = [abs(v - c) > 3 for v in vals]
    blip = [False] * n
    blocks = []
    i = 0
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            if j - i <= 3:
                blip[i:j] = [True] * (j - i)
            else:
                blocks.append((i, j - 1))
            i = j
        else:
            i += 1
    tol1_all = sum(1 for v in vals if abs(v - c) <= 1) / n
    rng = max(vals) - min(vals)
    smooth = sum(1 for a, b in zip(vals, vals[1:]) if abs(b - a) <= 2) / (n - 1)
    strict = sum(1 for v in vals if v == c) / n
    # characterise blocks; dips and steps recorded separately, cumulative
    # dip coverage capped at 40% of days so a global smooth curve cannot
    # masquerade as a dip on a flat base
    dips, steps, blip_days = [], [], sum(blip)
    dip_days = 0
    for i0, i1 in blocks:
        bv = vals[i0:i1 + 1]
        bs = sum(1 for a, b in zip(bv, bv[1:]) if abs(b - a) <= 2) / max(1, len(bv) - 1)
        bmax = max(abs(x - c) for x in bv)
        if bs >= 0.9 and bmax <= 30 and dip_days + (i1 - i0 + 1) <= 0.4 * n:
            dips.append({'from': dates[i0], 'to': dates[i1], 'depth': [min(bv), max(bv)],
                         'center': robust_center(bv), 'n': len(bv)})
            dip_days += len(bv)
        elif dip_days + (i1 - i0 + 1) <= 0.4 * n and (bs < 0.9 or max(bv) - min(bv) <= 2):
            steps.append({'from': dates[i0], 'to': dates[i1], 'value': robust_center(bv), 'n': len(bv)})
        # else: the block is the table itself; leave unrecorded, class handles it
    clean = [v for k, v in enumerate(vals) if not blip[k] and not any(i0 <= k <= i1 for i0, i1 in blocks)]
    tol1 = sum(1 for v in clean if abs(v - c) <= 1) / len(clean) if clean else 0.0
    full = n >= 90
    if tol1 >= (0.95 if full else 0.85) and rng <= 3:
        cls = 'exact' if (c == 0 and strict >= 0.8) else 'offset'
    elif dips and tol1 >= (0.95 if full else 0.85):
        cls = 'offset+dip'
    elif steps and tol1 >= (0.95 if full else 0.85):
        cls = 'offset+step'
    elif rng <= 16 or max(abs(v) for v in vals) <= 20:
        cls = 'drift'
    elif smooth >= 0.9 and rng >= 20:
        cls = 'angle-like'
    else:
        cls = 'own-table'
    return {
        'class': cls,
        'offset': c if cls.startswith(('exact', 'offset')) else None,
        'tol1': round(tol1, 3), 'tol1AllDays': round(tol1_all, 3), 'strict': round(strict, 3),
        'range': rng, 'envelope': [min(vals), max(vals)], 'smooth': round(smooth, 3),
        'n': n, 'shortWindow': not full, 'dipDays': dip_days, 'blipDays': blip_days,
        'dips': dips, 'steps': steps,
        'bytesRawArrays': n, 'bytesDeltaRle': rle_bytes(vals),
        'monthMeans': _month_means(dates, vals),
    }


def _month_means(dates, vals):
    m = {}
    for dt, v in zip(dates, vals):
        m.setdefault(dt[5:7], []).append(v)
    return {k: round(sum(v) / len(v), 1) for k, v in sorted(m.items())}


ARRAY_PRI = {'exact': 0, 'offset': 1, 'offset+dip': 1, 'offset+step': 1,
             'drift': 2, 'angle-like': 3, 'own-table': 3}
TOWN_OF_PRI = {0: 'LUPT-exact', 1: 'LUPT+offset', 2: 'LUPT-family-drift', 3: 'own-table-not-LUPT'}

out = []
for fn in sorted(os.listdir(f'{OUT}/series')):
    key = fn[:-5]
    s = json.load(open(f'{OUT}/series/{fn}'))
    rows = s['rows']
    aF = analyse(rows, 'F', 25)
    aI = analyse(rows, 'I', 25)
    town, region = TOWN.get(key, (key, 'unknown'))
    sides = [a for a in (aF, aI) if a]
    pri = max(ARRAY_PRI[a['class']] for a in sides)
    flags = []
    for side, a in (('F', aF), ('I', aI)):
        if not a:
            continue
        if a['blipDays']:
            flags.append(f'{side}-dst-blips:{a["blipDays"]}')
        if a['class'] == 'angle-like' and a['envelope'][1] > 100:
            flags.append(f'{side}-unclamped-summer')
    # evidence strength
    if len(rows) < 90:
        evidence = 'short-window'
    elif len(sides) < 2:
        evidence = 'half-coverage'
    else:
        evidence = 'full-year'
    eng = region not in ('Scotland (contrast)', 'Wales (contrast)')
    if len(rows) < 25:
        continue  # below the job's row bar
    bytes_off = None
    if pri in (0, 1):
        bytes_off = 0 if pri == 0 else 2
        for a in (aF, aI):
            if not a:
                continue
            for dip in a['dips']:
                bytes_off += 6  # (start-day, n, center)
            for stp in a['steps']:
                bytes_off += 6
    # offset side when the town still lands in drift
    offset_note = None
    if pri == 2:
        parts = []
        for side, a in (('F', aF), ('I', aI)):
            if a and a['class'] in ('offset', 'offset+dip', 'offset+step'):
                parts.append(f'{side}={a["offset"]}')
        offset_note = ','.join(parts) if parts else None
    out.append({
        'capture': key, 'town': town, 'region': region, 'english': eng,
        'src': s['src'], 'rows': len(rows),
        'F': aF, 'I': aI, 'classF': aF['class'] if aF else None,
        'classI': aI['class'] if aI else None,
        'class': TOWN_OF_PRI[pri], 'evidence': evidence,
        'offsetNote': offset_note,
        'bytesPerTownLuptOffsetEncoding': bytes_off,
        'bytesPerTownOwnArrays': (aF or aI) and sum(a['bytesRawArrays'] for a in sides),
        'flags': flags,
    })

json.dump(out, open(f'{OUT}/englupt.json', 'w'), indent=1)
for r in out:
    def txt(a):
        if not a:
            return 'n/a'
        off = f" off={a['offset']}" if a['offset'] is not None else ''
        dip = f" dip({a['dipDays']}d)" if a['dips'] else ''
        stp = f" step={[(s['from'],s['to'],s['value'],s['n']) for s in a['steps']]}" if a['steps'] else ''
        return f"{a['class']}{off} tol1={a['tol1']} env={a['envelope']}{dip}{stp}"
    print(f"{r['town']:30s} {r['rows']:3d}r {r['evidence']:13s} {r['class']:20s} F: {txt(r['F'])}")
    print(f"{'':30s} {'':14s} {'':20s} I: {txt(r['I'])}")
# summary counts
eng = [r for r in out if r['english']]
from collections import Counter
print('\n== England counts (>=25 rows):', Counter(r['class'] for r in eng))
print('== All captures:', Counter(r['class'] for r in out))
