# What law generates the printed dhuha column? Test candidates against the
# generator's own printed columns.
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

tot = {k: [0, 0] for k in ['sunrise+day/4', 'sunrise+maghribday/4', 'mid(sunrise,zawaal)',
                           'sunrise+zawaaldiff/2', 'mid(sunrise,transit)', 'sunrise+(transit-sunrise)*0.48', 'zawaal-day/8']}
for town, f in TOWNS:
    doc = json.load(open('../southernafrica2/data/' + f))
    if doc.get('coords_as_published'):
        m = re.match(r"([\d.]+)([NS]), ([\d.]+)([EW])", doc['coords_as_published'])
        lat = float(m.group(1)) * (-1 if m.group(2) == 'S' else 1)
        lon = float(m.group(3)) * (-1 if m.group(4) == 'W' else 1)
    else:
        lat, lon = FALLBACK[town]
    off = doc.get('utc_offset_hours', 2)
    per = {k: [0, 0] for k in tot}
    for d, row in sorted(doc['rows'].items()):
        ev = day_events(datetime.date.fromisoformat(d), lat, lon, off)
        ps = pm(row['sunrise']); pz = pm(row['zawaal']); zu = pm(row['zuhr']); pd = pm(row['dhuha'])
        su = ev['sunrise']; tr = ev['transit']; ss = ev['sunset']
        cands = {
            'sunrise+day/4': ss - (ss - su) / -4 if ss is not None else None,  # placeholder, replaced below
        }
        cands = {
            'sunrise+day/4': su + (ss - su) / 4,
            'sunrise+maghribday/4': su + (ss + 3 - su) / 4,
            'mid(sunrise,zawaal)': (ps + pz) / 2,
            'sunrise+zawaaldiff/2': ps + (pz - ps) / 2,
            'mid(sunrise,transit)': (su + tr) / 2,
            'sunrise+(transit-sunrise)*0.48': su + (tr - su) * 0.48,
            'zawaal-day/8': tr - 5 - (ss - su) / 8,
        }
        for k, v in cands.items():
            if v is None: continue
            per[k][1] += 1
            if abs(round(v) - pd) == 0: per[k][0] += 1
    for k in tot:
        tot[k][0] += per[k][0]; tot[k][1] += per[k][1]
    best = max(per.items(), key=lambda kv: kv[1][0])
    print(f"{town:10} " + ' '.join(f"{k}:{e}/{n}" for k, (e, n) in per.items()))
print('TOTAL', ' '.join(f"{k}:{e}/{n}" for k, (e, n) in tot.items()))
