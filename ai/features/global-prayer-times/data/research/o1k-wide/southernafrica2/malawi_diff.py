"""Blantyre vs Lilongwe (and other Malawi towns): printed margins vs computed solar.

Margin = printed - computed, with the split rounding law folded in:
morning/noon columns round-to-nearest (print = round(comp + margin)),
afternoon/evening columns truncate (print = floor(comp + margin)).
So margin ranges are: round -> [print-0.5-comp, print+0.5-comp],
truncate -> [print-comp, print+1-comp]. All in minutes.
"""
import json, datetime, statistics, sys
sys.path.insert(0, '.')
from solar import day_events, printed_min

TOWNS = json.load(open('data/jamiat-blantyre-2026-12.json'))  # shape ref
FILES = {
    'Blantyre': 'data/jamiat-blantyre-2026-12.json',
    'Lilongwe': 'data/jamiat-lilongwe-2026-12.json',
    'Mzuzu': 'data/jamiat-mzuzu-2026-12.json',
    'Zomba': 'data/jamiat-zomba-2026-12.json',
}

# column -> (computed key, offset applied by recipe in minutes, rounding mode)
# recipe per census: suhoor=fajr-5, ishraaq=sunrise+15, dhuha=sunrise+15+180? dhuha is Chast (mid-morning, ~sunrise+3h? printed 08:14 vs sunrise 04:59 => +195), zawaal=transit-5, zuhr=transit+5, sunset=astro-3 (sunset col = astro -3), maghrib=astro+3, isha_shafi=15deg, isha_hanafi=18deg
COLS = {
    'suhoor': ('fajr18', -5, 'round'),
    'fajr': ('fajr18', 0, 'round'),
    'sunrise': ('sunrise', 0, 'round'),
    'ishraaq': ('sunrise', 15, 'round'),
    'dhuha': ('sunrise', 195, 'round'),
    'zawaal': ('transit', -5, 'round'),
    'zuhr': ('transit', 5, 'round'),
    'asr_shafi': ('asr_shafi', 0, 'trunc'),
    'asr_hanafi': ('asr_hanafi', 0, 'trunc'),
    'sunset': ('sunset', -3, 'trunc'),
    'maghrib': ('sunset', 3, 'trunc'),
    'isha_shafi': ('isha15', 0, 'trunc'),
    'isha_hanafi': ('fajr18', 0, 'trunc'),  # 18 deg evening computed as morning-side crossing; evening 18deg = 2*transit - morning
}

result = {}
for town, path in FILES.items():
    doc = json.load(open(path))
    lat = doc['coords_as_published']
    # parse lat/lon from the published strings
    import re
    m = re.match(r"([\d.]+)([NS]), ([\d.]+)([EW])", lat)
    la = float(m.group(1)) * (-1 if m.group(2) == 'S' else 1)
    lo = float(m.group(3)) * (-1 if m.group(4) == 'W' else 1)
    margins = {c: [] for c in COLS}
    for date_s, row in doc['rows'].items():
        d = datetime.date.fromisoformat(date_s)
        ev = day_events(d, la, lo, 2)
        # isha_hanafi evening 18deg: mirror of morning crossing about transit
        m18 = ev['fajr18']
        ev_isha_h = (2 * ev['transit'] - m18) if m18 is not None else None
        for col, (key, off, mode) in COLS.items():
            comp = ev_isha_h if col == 'isha_hanafi' else ev[key]
            if comp is None:
                continue
            p = printed_min(row[col])
            base = p - off - comp
            lo_b = base - 0.5 if mode == 'round' else base
            hi_b = base + 0.5 if mode == 'round' else base + 1.0
            margins[col].append((lo_b, hi_b))
    result[town] = {c: (round(statistics.median(a for a, b in v), 2),
                        round(statistics.median(b for a, b in v), 2)) for c, v in margins.items()}

out = {}
for col in COLS:
    out[col] = {t: result[t][col] for t in result}
json.dump(out, open('data/malawi-margin-diff.json', 'w'), indent=1)
hdr = f"{'column':<12}" + ''.join(f"{t:>22}" for t in result)
print(hdr)
for col, v in out.items():
    print(f"{col:<12}" + ''.join(f"{t}: {a}-{b}".rjust(22) for t, (a, b) in v.items()))
