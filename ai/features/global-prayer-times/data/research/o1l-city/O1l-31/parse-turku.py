import json, re, pypdf

MONTH = {'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
         'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12}
ROW = re.compile(r'^(\d{1,2})\s+\S{3}\s+\d+\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$')

r = pypdf.PdfReader('captures/fi-turku-timetable-2026.pdf')
rows = {}
for page in r.pages:
    text = page.extract_text()
    head = text.split('\n')[0].strip()
    m = re.fullmatch(r'([A-Za-z]+)\s+(\d{4})', head)
    month, year = MONTH[m.group(1).lower()], int(m.group(2))
    for line in text.split('\n'):
        hit = ROW.match(line.strip())
        if not hit:
            continue
        rows[f'{year}-{month:02d}-{int(hit.group(1)):02d}'] = dict(zip(
            ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'), hit.groups()[1:]))
json.dump(rows, open('data/fi-turku-2026.json', 'w'), indent=0, sort_keys=True)
print('turku', len(rows), rows.get('2026-01-01'), rows.get('2026-06-21'))
