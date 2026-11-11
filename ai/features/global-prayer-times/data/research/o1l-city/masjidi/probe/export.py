import json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, 'captures')
OUT = os.path.join(ROOT, 'data')
YEAR = 2028
COLS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

meta = json.load(open(os.path.join(OUT, 'table_meta.json')))
recipes = {r['id']: r for r in json.load(open(os.path.join(ROOT, 'out', 'recipes.json')))}
os.makedirs(os.path.join(OUT, 'tables'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'iqamah'), exist_ok=True)

for tid in sorted(meta, key=int):
    p = os.path.join(CAP, f'table_region_{tid}.json')
    if not os.path.exists(p):
        continue
    rows = json.load(open(p))
    days = {}
    d = datetime.date(YEAR, 1, 1)
    for i, r in enumerate(rows):
        day = d + datetime.timedelta(days=i)
        days[day.isoformat()] = {c.lower(): r[c] for c in COLS}
    rec = recipes.get(int(tid), {})
    # vintage from the Saudi Ramadan isha block (maghrib + 120)
    mins = lambda v: int(v.split(':')[0]) * 60 + int(v.split(':')[1])
    hi = [i for i, r in enumerate(rows) if mins(r['Isha']) - mins(r['Maghrib']) >= 115]
    vintage = None
    if len(hi) > 20:
        run = [hi[0], hi[0]]
        for i in hi[1:]:
            if i == run[1] + 1: run[1] = i
            else: break
        if run[0] == 48: vintage = {'year': 2026, 'evidence': 'isha maghrib+120 on rows 48-78 = Ramadan 1447 (2026-02-18)'}
        elif run[0] == 70: vintage = {'year': 2024, 'evidence': 'isha maghrib+120 on rows 70-99 = Ramadan 1445 (2024-03-11)'}
    out = {
        'meta': {
            'tableId': int(tid), 'country': meta[tid]['country'], 'timezone': meta[tid]['tz'],
            'stdOffsetMinutes': meta[tid]['off'], 'tenants': meta[tid]['tenants'],
            'rows': len(rows),
            'dateBasis': 'keys are a 2028 leap-year scaffold so all 366 day-of-year rows survive; '
                         'they are an index, not a claim of year. The payload carries no year and no '
                         'coordinates, and the live page renders no server-side times, so no '
                         'live-page date gate is possible.',
            'vintage': vintage,
            'recipe': {k: rec.get(k) for k in ('lat', 'lon', 'h0', 'fajr', 'isha', 'asr', 'asrOff', 'dhuhrOff', 'rmsAll', 'within1All')},
        },
        'days': days,
    }
    json.dump(out, open(os.path.join(OUT, 'tables', f'table_{tid}.json'), 'w'), ensure_ascii=False, indent=0)

cfgs = json.load(open(os.path.join(OUT, 'sample_configs.json')))
n = 0
for c in cfgs:
    if not c.get('prayers'):
        continue
    waits = {}
    friday = {}
    for p in c['prayers']:
        if p['key'] not in ('Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'):
            continue
        waits[p['key']] = {'iqamaWaitDuration': p['iqamaWaitDuration'], 'timeOffset': p['timeOffset']}
        if p.get('dateOverrides'):
            friday[p['key']] = p['dateOverrides']
    json.dump({
        'tenantId': c['id'], 'name': c['name'], 'city': c['city'], 'country': c['country'],
        'timezone': c['timezone'], 'timingsType': c['timingsType'], 'tableId': c['tableId'],
        'iqamah': waits, 'overrides': friday,
        'note': 'athan times come from the regional table; the iqamah layer is the wait in minutes '
                'after the athan, plus Friday (Jumu\'ah) overrides.',
    }, open(os.path.join(OUT, 'iqamah', f'tenant_{c["id"]}.json'), 'w'), ensure_ascii=False, indent=1)
    n += 1
print('tables exported', len(os.listdir(os.path.join(OUT, 'tables'))), 'iqamah exported', n)
