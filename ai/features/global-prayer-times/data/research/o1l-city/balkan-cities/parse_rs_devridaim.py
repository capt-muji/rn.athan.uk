import re, html, json, sys, os

SRC = 'captures/rs_mesihat_devridaim2_2026-11-11.html'
h = open(SRC, encoding='utf-8', errors='replace').read()
tables = re.findall(r'<table.*?</table>', h, re.S)

MONTHS = ['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar']
# locate the heading preceding each table so months map to tables
marks = []
for m in re.finditer(r'<table.*?</table>', h, re.S):
    pre = h[:m.start()]
    hs = re.findall(r'<h[1-3][^>]*>([^<]+)</h[1-3]>', pre)
    marks.append(hs[-1].strip() if hs else '')

def cells(row):
    return [html.unescape(re.sub(r'<[^>]+>', '', c)).strip()
            for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.S)]

rows = {}
offsets = []
for t, mark in zip(tables, marks):
    trs = re.findall(r'<tr.*?</tr>', t, re.S)
    body = [cells(r) for r in trs]
    if mark == 'Vremenske razlike u odnosu na Novi Pazar':
        for c in body[1:]:
            if len(c) >= 4 and c[0]:
                offsets.append({'grad': c[0], 'zora_sunrise': int(c[1]), 'podne': int(c[2]), 'ikindija_aksam_jacija': int(c[3])})
        continue
    if mark not in MONTHS:
        continue
    mi = MONTHS.index(mark) + 1
    for c in body[1:]:
        if len(c) < 10 or not c[0].isdigit():
            continue
        d = int(c[0])
        vals = [re.sub(r'^[^0-9]+', '', v).replace(' ', '') for v in c[4:10]]
        if not all(re.fullmatch(r'\d{1,2}:\d{2}', v) for v in vals):
            print('SKIP', mark, c, file=sys.stderr)
            continue
        rows['2025-%02d-%02d' % (mi, d)] = dict(zip(['fajr','sunrise','dhuhr','asr','maghrib','isha'], vals))

out = {'source': 'https://mesihat.org/devridaim-2/', 'class': 'community (Mešihat IZ u Srbiji, Devridaim)',
       'place': 'Novi Pazar', 'edition': 'Devridaim 2025. / 1446 AH', 'year': 2025,
       'columns': ['fajr','sunrise','dhuhr','asr','maghrib','isha'], 'rows': dict(sorted(rows.items()))}
os.makedirs('data', exist_ok=True)
json.dump(out, open('data/rs_devridaim_2025_novipazar.json','w'), ensure_ascii=False, indent=1)
json.dump(offsets, open('data/rs_devridaim_2025_offsets.json','w'), ensure_ascii=False, indent=1)
print('novi pazar rows', len(rows), 'range', min(rows), max(rows))
print('offsets', len(offsets))
for o in offsets: print(o)
