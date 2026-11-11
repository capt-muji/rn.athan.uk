import json, re, sys, html

src, out = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8', errors='replace').read()
months = {'OCAK':1,'ŞUBAT':2,'MART':3,'NİSAN':4,'MAYIS':5,'HAZİRAN':6,'TEMMUZ':7,
          'AĞUSTOS':8,'EYLÜL':9,'EKİM':10,'KASIM':11,'ARALIK':12}

rows = {}
cur = None
for m in re.finditer(r'([A-ZÇĞİÖŞÜ]+)\s+(20\d\d)</td>|<td[^>]*class="zzz"[^>]*>\s*(\d{1,2})\s+\w+\s*</td>((?:\s*<td[^>]*>\s*\d\d:\d\d\s*</td>){8})', t):
    if m.group(1):
        name = html.unescape(m.group(1)).replace('&#304;','İ')
        cur = (months.get(name), int(m.group(2)))
        continue
    if cur is None:
        continue
    day = int(m.group(3))
    vals = re.findall(r'(\d\d:\d\d)', m.group(4))
    if len(vals) != 8:
        continue
    imsak, sabah, gunes, israk, ogle, ikindi, aksam, yatsi = vals
    key = f'{cur[1]:04d}-{cur[0]:02d}-{day:02d}'
    rows[key] = {'fajr': sabah, 'sunrise': gunes, 'dhuhr': ogle, 'asr': ikindi,
                 'maghrib': aksam, 'isha': yatsi, 'imsak': imsak, 'israk': israk}

json.dump(rows, open(out, 'w'), indent=1, sort_keys=True)
print(out, len(rows), 'rows', min(rows) if rows else '-', max(rows) if rows else '-')
