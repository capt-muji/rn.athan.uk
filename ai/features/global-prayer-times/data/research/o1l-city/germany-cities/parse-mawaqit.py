import re, json

COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def calendar(html):
    i = html.find('"calendar":[')
    j = i + len('"calendar":')
    depth = 0
    for k in range(j, len(html)):
        if html[k] == '[':
            depth += 1
        elif html[k] == ']':
            depth -= 1
            if depth == 0:
                return json.loads(html[j:k + 1])
    raise SystemExit('no calendar')


def year_of(cal):
    # DST change days identify the year: the March jump day is the last Sunday of March.
    mar = cal[2]
    mins = lambda v: int(v.split(':')[0]) * 60 + int(v.split(':')[1])
    prev = None
    for d in range(1, len(mar) + 1):
        v = mar[str(d)][2]
        if prev is not None and abs(mins(v) - mins(prev)) > 30:
            return d
        prev = v
    return None


for name, tag in [('mawaqit-ali-duisburg', 'duisburg-ali'), ('mawaqit-ditib-hannover', 'hannover-ditib')]:
    html = open(f'captures/{name}.html', encoding='utf-8', errors='replace').read()
    cal = calendar(html)
    jump = year_of(cal)
    # 2026 DST starts 29 March and ends 25 October.
    year = 2026 if jump == 29 else None
    rows = {}
    for mi, month in enumerate(cal, start=1):
        for dk, vals in month.items():
            rows[f'{year}-{mi:02d}-{int(dk):02d}'] = dict(zip(COLS, vals))
    json.dump(rows, open(f'data/mawaqit-{tag}-{year}.json', 'w'), indent=0)
    print(f'{tag}: year {year} (March DST jump day {jump}), {len(rows)} rows, feb {len(cal[1])} days')
