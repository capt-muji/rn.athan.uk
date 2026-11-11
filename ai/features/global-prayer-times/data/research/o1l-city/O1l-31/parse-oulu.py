import json, re, glob

rows = {}
for f in sorted(glob.glob('captures/fi-oulu-2026-[0-9][0-9].html')):
    s = open(f, encoding='utf-8', errors='replace').read()
    m = re.search(r'data-year="(\d{4})" data-month="(\d{1,2})"', s)
    year, month = int(m.group(1)), int(m.group(2))
    for tr in re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', s):
        cells = [re.sub(r'<[^>]+>', ' ', c).strip() for c in re.findall(r'<td[^>]*>([\s\S]*?)</td>', tr)]
        if len(cells) < 8:
            continue
        day = re.match(r'(\d{1,2})', cells[0])
        times = [t for c in cells[2:] for t in re.findall(r'\b(\d{1,2}:\d{2})\b', c)]
        if not day or len(times) < 6:
            continue
        rows[f'{year}-{month:02d}-{int(day.group(1)):02d}'] = dict(zip(
            ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'), times[:6]))
json.dump(rows, open('data/fi-oulu-2026.json', 'w'), indent=0, sort_keys=True)
print('oulu', len(rows), rows.get('2026-01-01'), rows.get('2026-06-21'), rows.get('2026-11-11'))
