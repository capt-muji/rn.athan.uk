import json, re, sys, pypdf

ROW = re.compile(r'^(\d{1,2})\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$')
TIME = re.compile(r'^\d{1,2}:\d{2}$')

def parse(path):
    r = pypdf.PdfReader(path)
    rows = []
    for page in r.pages:
        for line in page.extract_text().split('\n'):
            m = ROW.match(line.strip())
            if m:
                rows.append((int(m.group(1)), m.groups()[2:]))
    out, month, prev = {}, 0, 0
    for day, vals in rows:
        if day == 1 and prev != 1:
            month += 1
        prev = day
        if month < 1 or month > 12:
            continue
        out[f'2026-{month:02d}-{day:02d}'] = dict(zip(
            ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'),
            [None if not TIME.match(v) else v for v in vals]))
    return out

for city in sys.argv[1:]:
    rows = parse(f'captures/no-jamiat-{city}-2026.pdf')
    json.dump(rows, open(f'data/no-jamiat-{city}-2026.json', 'w'), indent=0, sort_keys=True)
    print(city, len(rows), rows.get('2026-01-01'), '|', rows.get('2026-06-21'), '|', rows.get('2026-12-31'))
