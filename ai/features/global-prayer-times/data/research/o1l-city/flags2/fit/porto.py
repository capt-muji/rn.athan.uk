"""F4: Porto - the monthly convention sheet against the hub's own annual.
Reads the banked annual PDF (o1k-wide/iberia2) and the banked monthly JSON (o1l-22)."""
import pypdf, re, json, sys

HOME = '$HOME/athan-gitree'
ANNUAL = f'{HOME}/census/o1k-wide/iberia2/captures/pt-porto_2026.pdf'
LISBOA = f'{HOME}/census/o1k-wide/iberia2/captures/pt-lisboa_2026.pdf'
MONTHLY = f'{HOME}/census/o1l-city/o1l-22/data/pt-monthly-2026-11.json'


def annual_nov(path):
    t = pypdf.PdfReader(path).pages[10].extract_text()
    out = {}
    for m in re.finditer(
        r'^(\d{1,2})\s+(?:DOM|SEG|TER|QUA|QUI|SEX|S[ÁA]B)[^\n]*?(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})',
        t, re.M):
        g = m.groups()
        out[f'2026-11-{int(g[0]):02d}'] = dict(zip(['fajr', 'sunrise', 'zawal', 'dhuhr', 'asr', 'maghrib', 'isha12', 'isha80'], g[1:]))
    return out


def mins(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)


monthly = json.load(open(MONTHLY))['porto']
ann = annual_nov(ANNUAL)
lis = annual_nov(LISBOA)
print(f'annual rows parsed: porto {len(ann)}, lisboa {len(lis)}')

print('\n--- Porto: monthly minus annual, November 2026 ---')
for col in ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']:
    d = [mins(monthly[k][col]) - mins(ann[k][col]) for k in sorted(monthly) if k in ann]
    print(f'  {col:8s} n {len(d)} min {min(d):+3d} max {max(d):+3d} distinct {sorted(set(d))}')
d = [mins(monthly[k]['isha']) - mins(ann[k]['isha80']) for k in sorted(monthly) if k in ann]
print(f'  isha(monthly) minus isha80(annual) min {min(d):+3d} max {max(d):+3d}')

print('\n--- Porto monthly: distinct values per column (a convention sheet is a step ladder) ---')
for col in ['fajr', 'dhuhr', 'asr', 'isha']:
    vals = {}
    for k in sorted(monthly):
        vals.setdefault(monthly[k][col], []).append(k[8:])
    print(f'  {col:6s} {len(vals)} distinct: ' + '; '.join(f'{v} ({rs[0]}..{rs[-1]}, {len(rs)}d)' for v, rs in vals.items()))

print('\n--- Porto annual: distinct values per column ---')
for col in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha80']:
    vals = {ann[k][col] for k in ann}
    print(f'  {col:8s} {len(vals)} distinct across {len(ann)} rows')

print('\n--- the annual asr against the monthly, day by day ---')
for k in sorted(monthly):
    if k not in ann:
        continue
    print(f'  {k}  monthly fajr {monthly[k]["fajr"]:>5} dhuhr {monthly[k]["dhuhr"]:>5} asr {monthly[k]["asr"]:>5} isha {monthly[k]["isha"]:>5}'
          f'   | annual fajr {ann[k]["fajr"]:>5} dhuhr {ann[k]["dhuhr"]:>5} asr {ann[k]["asr"]:>5} maghrib {ann[k]["maghrib"]:>5} isha80 {ann[k]["isha80"]:>5}')

json.dump({'annual_porto_nov': ann, 'annual_lisboa_nov': lis}, open(f'{HOME}/census/o1l-city/flags2/data/porto-annual-nov.json', 'w'), indent=1, ensure_ascii=False)
