import json, re, subprocess, sys

# Rome poster rows, transcribed by eye from the live PNG (2026-11-11 .. 2026-12-10).
RAW = open('$HOME/athan-gitree/census/o1k-wide/iberia2/roma_poster.py').read()
body = RAW.split('ROWS = """')[1].split('"""')[0].strip()
rows = {}
for line in body.splitlines():
    p = line.split()
    rows[p[0]] = dict(zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], p[1:]))
json.dump(rows, open('data/it-roma-gm-2026-11.json', 'w'), indent=1)
json.dump({'roma': {'label': 'Grande Moschea di Roma', 'lat': 41.9353, 'lon': 12.4936,
                    'tz': 'Europe/Rome', 'days': rows}},
          open('work/roma-fit-input.json', 'w'), indent=1)
print('rows', len(rows), min(rows), max(rows))


def mins(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)


iv = {mins(v['isha']) - mins(v['maghrib']) for v in rows.values()}
print('isha - maghrib distinct values:', sorted(iv))
