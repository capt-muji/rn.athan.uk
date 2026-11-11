"""mawaqit confData -> dated rows. The calendar is a year of month-keyed day slots."""
import re, json, glob, os, sys

COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
YEAR = 2026
CITY = {
    'mq-lyon-grande.html': ('lyon', 'Grande mosquee de Lyon'),
    'mq-lille-grande.html': ('lille', 'Grande Mosquee de Lille'),
    'mq-marseille-mariam.html': ('marseille', 'Mosquee Mariam Marseille'),
    'mq-milano-vialemarche.html': ('milano', 'Bangla Assoc. Viale Marche Milano'),
    'mq-torino-taiba.html': ('torino', 'Moschea Taiba Torino'),
    'mq-bologna-annur.html': ('bologna', 'Moschea Annur Bologna'),
    'mq-barcelona-ccic.html': ('barcelona', 'Centre Cultural Islamic Catala'),
    'mq-valencia-gran.html': ('valencia', 'Gran Mezquita de Valencia'),
    'mq-sevilla-carretera.html': ('sevilla', 'Comunidad Islamica Carretera Amarilla'),
    'mq-sevilla-alwahda.html': ('sevilla2', 'Mezquita Alwahda Sevilla'),
    'mq-granada-annoor.html': ('granada2', 'Masjid An-Noor Granada'),
    'mq-granada-omar.html': ('granada3', 'Masjid Omar Granada'),
    'mq-marseille-khalid.html': ('marseille2', 'Mosquee Khalid ibn al-Walid Marseille'),
    'mq-lyon-attawba.html': ('lyon2', 'Masjid Attawba Lyon'),
    'mq-lille-assalam.html': ('lille2', 'Mosquee Assalam Lille'),
}

out = {}
for f in sorted(glob.glob('captures/mq-*.html')):
    base = os.path.basename(f)
    if base not in CITY:
        continue
    slug, label = CITY[base]
    s = open(f, encoding='utf-8').read()
    m = re.search(r'confData\s*=\s*(\{.*?\});', s, re.S)
    d = json.loads(m.group(1))
    days = {}
    for mi, month in enumerate(d['calendar']):
        for dk, vals in month.items():
            day = int(dk)
            # Omar Granada repeats fajr; collapse a leading duplicate
            if len(vals) == 7 and vals[0] == vals[1]:
                vals = vals[1:]
            if len(vals) < 6 or any(v in ('', '--:--') for v in vals[:6]):
                continue
            days[f'{YEAR}-{mi + 1:02d}-{day:02d}'] = dict(zip(COLS, vals[:6]))
    out[slug] = {'label': label, 'name': d.get('name'), 'lat': d.get('latitude'),
                 'lon': d.get('longitude'), 'tz': d.get('timezone'), 'days': days}
    print(f'{slug:10s} {len(days):3d} rows  {d.get("latitude")},{d.get("longitude")}  {d.get("timezone")}')

json.dump(out, open('data/mawaqit-o1l-22-2026.json', 'w'), indent=1, ensure_ascii=False)
print('surfaces', len(out), 'rows', sum(len(v['days']) for v in out.values()))
