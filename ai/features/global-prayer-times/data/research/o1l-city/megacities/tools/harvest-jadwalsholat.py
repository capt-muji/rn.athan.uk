import json, re, subprocess, sys

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
CITY, CID, YEAR = 'jakarta-pusat', 308, 2026
MON = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

rows = {}
for m in range(1, 13):
    url = f'https://jadwalsholat.org/jadwal-sholat/monthly.php?type=2&id={CID}&m={m}&y={YEAR}'
    path = f'captures/jadwalsholat-{CITY}-{YEAR}-{m:02d}.html'
    subprocess.run(['curl', '-sS', '-L', '--compressed', '-A', UA, '-m', '45', '-o', path, url], check=True)
    t = open(path, encoding='utf-8', errors='replace').read()
    if MON[m - 1] not in t:
        print('month header missing', m, file=sys.stderr)
    trs = re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.S)
    got = 0
    for r in trs:
        cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
        if len(cells) == 9 and re.fullmatch(r'\d{2}', cells[0]):
            day = int(cells[0])
            _, imsyak, shubuh, terbit, dhuha, dzuhur, ashr, maghrib, isya = cells
            rows[f'{YEAR}-{m:02d}-{day:02d}'] = {
                'fajr': shubuh, 'sunrise': terbit, 'dhuhr': dzuhur, 'asr': ashr,
                'maghrib': maghrib, 'isha': isya, 'imsak': imsyak, 'dhuha': dhuha}
            got += 1
    print(m, got)

json.dump(rows, open(f'data/id-{CITY}-jadwalsholat-{YEAR}.json', 'w'), indent=1, sort_keys=True)
print('total', len(rows), min(rows), max(rows))
