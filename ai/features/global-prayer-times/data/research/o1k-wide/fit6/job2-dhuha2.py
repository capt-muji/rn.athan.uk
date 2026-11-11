# dhuha candidate: sunrise + (astro_sunset + 3 - astro_sunrise) / 4, nearest.
import json, re, sys, datetime
sys.path.insert(0, '../southernafrica2')
from solar import day_events

TOWNS = [('Maputo','jamiat-maputo-2026-12.json'),('Windhoek','jamiat-windhoek-2026-12.json'),
('Luanda','jamiat-luanda-2026-12.json'),('Maseru','jamiat-maseru-2026-12.json'),
('Mbabane','jamiat-mbabane-2026-12.json'),('Harare','jamiat-harare-2026-12.json'),
('Bulawayo','jamiat-bulawayo-2026-12.json'),('Blantyre','jamiat-blantyre-2026-12.json'),
('Lilongwe','jamiat-lilongwe-2026-12.json'),('Mzuzu','jamiat-mzuzu-2026-12.json'),
('Zomba','jamiat-zomba-2026-12.json')]
FALLBACK = {'Harare': (-17.8250, 31.0333), 'Bulawayo': (-20.1500, 28.5833)}
def pm(s):
    h, mi = s.split(':'); return int(h) * 60 + int(mi)
te = tn = 0; worstAll = 0
res = {}
for town, f in TOWNS:
    doc = json.load(open('../southernafrica2/data/' + f))
    if doc.get('coords_as_published'):
        m = re.match(r"([\d.]+)([NS]), ([\d.]+)([EW])", doc['coords_as_published'])
        lat = float(m.group(1)) * (-1 if m.group(2) == 'S' else 1)
        lon = float(m.group(3)) * (-1 if m.group(4) == 'W' else 1)
    else:
        lat, lon = FALLBACK[town]
    off = doc.get('utc_offset_hours', 2)
    e = n = 0; worst = 0
    for d, row in sorted(doc['rows'].items()):
        ev = day_events(datetime.date.fromisoformat(d), lat, lon, off)
        v = ev['sunrise'] + ((ev['sunset'] + 3) - ev['sunrise']) / 4
        diff = abs(round(v) - pm(row['dhuha']))
        if diff == 0: e += 1
        worst = max(worst, diff); n += 1
    te += e; tn += n; worstAll = max(worstAll, worst)
    res[town] = (e, n, worst)
    print(f"{town:10} sunrise+(astro_sunset+3-sunrise)/4  exact {e}/{n} worst {worst}")
print(f"TOTAL exact {te}/{tn} worst {worstAll}")
