import re, json, glob, os

MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
YEAR = 2026
COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

out = {}
for f in sorted(glob.glob('captures/mawaqit-*.html')):
    slug = os.path.basename(f)[len('mawaqit-'):-5]
    s = open(f, encoding='utf-8').read()
    m = re.search(r'confData\s*=\s*(\{.*?\});', s, re.S)
    if not m:
        print(f'{slug}: NO confData')
        continue
    d = json.loads(m.group(1))
    cal = d['calendar']
    days = {}
    for mi, month in enumerate(cal):
        for dk, vals in month.items():
            day = int(dk)
            if len(vals) < 6 or any(v in ('', '--:--') for v in vals[:6]):
                continue
            date = f'{YEAR}-{mi + 1:02d}-{day:02d}'
            days[date] = dict(zip(COLS, vals[:6]))
    out[slug] = {
        'name': d.get('name'), 'lat': d.get('latitude'), 'lon': d.get('longitude'),
        'timezone': d.get('timezone'), 'year_implicit': YEAR, 'days': days,
    }
    print(f'{slug:28s} {d.get("name")[:38]:40s} {len(days):3d} rows  {d.get("latitude")},{d.get("longitude")}')

json.dump(out, open('data/mawaqit-o1l-20r-2026.json', 'w'), indent=1, ensure_ascii=False)
print('surfaces', len(out), 'rows', sum(len(v['days']) for v in out.values()))
