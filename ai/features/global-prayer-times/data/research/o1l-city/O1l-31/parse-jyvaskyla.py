import json, re, pypdf

FILES = {'feb2026': (2026, 2), 'mar2026': (2026, 3), 'april2026': (2026, 4), 'May2026': (2026, 5),
         'June2026': (2026, 6), 'July2026': (2026, 7), 'Aug2026': (2026, 8), 'Sep2026': (2026, 9),
         'Oct2026': (2026, 10), 'Nov2026': (2026, 11), 'Dec2026': (2026, 12), 'Jan2027': (2027, 1)}
TIME = r'(\d{1,2}\.\d{2})'
ROW = re.compile(r'^\s*(\d{1,2})\s+(?:\d+\s+)?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+' + r'\s+'.join([TIME] * 6) + r'\s*$')

rows = {}
for name, (year, month) in FILES.items():
    text = pypdf.PdfReader(f'captures/fi-jyvaskyla-{name}.pdf').pages[0].extract_text()
    for line in text.split('\n'):
        m = ROW.match(line)
        if not m:
            continue
        vals = [v.replace('.', ':') for v in m.groups()[1:]]
        rows[f'{year}-{month:02d}-{int(m.group(1)):02d}'] = dict(zip(
            ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'), vals))
json.dump(rows, open('data/fi-jyvaskyla-2026.json', 'w'), indent=0, sort_keys=True)
print('jyvaskyla', len(rows), rows.get('2026-11-01'), rows.get('2026-06-21'), rows.get('2027-01-31'))
