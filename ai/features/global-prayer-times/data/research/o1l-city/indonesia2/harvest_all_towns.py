import json, os, re, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(HERE, 'captures', 'jsorg-all')
os.makedirs(CAP, exist_ok=True)
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')

towns = json.load(open(os.path.join(HERE, 'data', 'jadwalsholat-towns.json')))
out = {}
for tid, name in towns:
    fn = os.path.join(CAP, f'{tid}.html')
    if os.path.exists(fn) and os.path.getsize(fn) > 20000:
        html = open(fn, encoding='utf-8', errors='replace').read()
    else:
        url = f'https://jadwalsholat.org/adzan/monthly.php?id={tid}&m=11&y=2026'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                html = r.read().decode('utf-8', 'replace')
        except Exception as e:
            print('ERR', tid, name, e, flush=True)
            time.sleep(1)
            continue
        open(fn, 'w', encoding='utf-8').write(html)
        time.sleep(0.3)
    t = re.search(r'<table.*?</table>', html, re.S)
    if not t:
        print('NOTABLE', tid, name, flush=True)
        continue
    rows = []
    for row in re.findall(r'<tr.*?</tr>', t.group(0), re.S):
        c = [re.sub(r'<[^>]+>', '', x).strip()
             for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
        if len(c) < 10 or not re.match(r'^\d{2}', c[0]):
            continue
        rows.append({'day': int(c[0][:2]), 'fajr': c[3], 'sunrise': c[4],
                     'dhuhr': c[6], 'asr': c[7], 'maghrib': c[8], 'isha': c[9]})
    out[name] = rows
    print(name, len(rows), flush=True)

json.dump(out, open(os.path.join(HERE, 'data', 'jsorg-nov2026-all.json'), 'w'), ensure_ascii=False)
print('TOWNS', len(out))
