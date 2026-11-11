import json, re, sys, html, glob

MONTHS = {'januar': 1, 'februar': 2, 'marts': 3, 'april': 4, 'maj': 5, 'juni': 6,
          'juli': 7, 'august': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12}
ROW = re.compile(r'^(Man|Tirs|Ons|Tors|Fre|Lør|Søn)\s+(\d+)\.$')

def lines_of(path):
    s = open(path, encoding='utf-8', errors='replace').read()
    t = re.sub(r'<script[\s\S]*?</script>', '', s)
    t = re.sub(r'<style[\s\S]*?</style>', '', t)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t))
    return [x.strip() for x in t.split('\n') if x.strip()]

def month_rows(path):
    L = lines_of(path)
    out = {}
    month = year = None
    for i, x in enumerate(L):
        m = re.fullmatch(r'([A-Za-zæøå]+)\s+(\d{4})', x)
        if m and m.group(1).lower() in MONTHS:
            month, year = MONTHS[m.group(1).lower()], int(m.group(2))
        r = ROW.match(x)
        if r and month and i + 9 < len(L):
            cells = L[i + 1:i + 9]
            if cells and cells[0] == 'i dag':
                cells = L[i + 2:i + 10]
            if all(re.fullmatch(r'\d{1,2}:\d{2}', c) for c in cells[:7]):
                out[f'{year}-{month:02d}-{int(r.group(2)):02d}'] = {
                    'imsak': cells[0], 'fajr': cells[1], 'dhuhr': cells[2], 'asr': cells[3],
                    'maghrib': cells[4], 'isha': cells[5], 'sunrise': cells[6]}
    return out

for city in sys.argv[1:]:
    rows = {}
    for f in sorted(glob.glob(f'captures/dk-adan-{city}-2026-*.html')):
        rows.update(month_rows(f))
    json.dump(rows, open(f'data/dk-adan-{city}-2026.json', 'w'), indent=0, sort_keys=True)
    print(city, len(rows), rows.get('2026-01-01'), '|', rows.get('2026-06-21'))
