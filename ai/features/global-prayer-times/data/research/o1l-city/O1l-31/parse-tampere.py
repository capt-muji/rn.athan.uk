import json, re, sys, pypdf

MONTH = {1: 1}
ROW = re.compile(r'^\S+\s+(\d{2})\.(\d{2})\.(\d{4})\s+(.+)$')

def parse(path, month):
    r = pypdf.PdfReader(path)
    out = {}
    for page in r.pages:
        for line in page.extract_text().split('\n'):
            m = ROW.match(line.strip())
            if not m:
                continue
            day, mon, year = int(m.group(1)), int(m.group(2)), m.group(3)
            cells = m.group(4).split()
            times = [c for c in cells if re.fullmatch(r'\d{1,2}:\d{2}', c)]
            if len(times) < 6:
                continue
            out[f'{year}-{mon:02d}-{day:02d}'] = {
                'fajr': times[0], 'sunrise': times[1], 'dhuhr': times[2], 'asr': times[3],
                'maghrib': times[4], 'isha': times[5], 'isha_hanafi': times[6] if len(times) > 6 else None}
    return out

rows = {}
for m in range(1, 13):
    part = parse(f'captures/fi-tampere-2026-{m:02d}.pdf', m)
    print(m, len(part))
    rows.update(part)
json.dump(rows, open('data/fi-tampere-2026.json', 'w'), indent=0, sort_keys=True)
print('total', len(rows), rows.get('2026-06-21'), rows.get('2026-11-10'))
