import json, os, re, sys, time, urllib.request

CAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'captures')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')

TOWNS = {
    'banda_aceh': 12, 'bandung': 14, 'surabaya': 265, 'medan': 151, 'makassar': 140,
    'jayapura': 84, 'yogyakarta': 307, 'semarang': 232, 'denpasar': 66,
    'pontianak': 203, 'padang': 171, 'palembang': 177, 'banjarmasin': 21,
    'manado': 490, 'mataram': 149, 'kupang': 117, 'ambon': 2, 'ternate': 289,
    'pekanbaru': 548, 'samarinda': 225, 'tanjung_pinang': 277, 'serang': 234,
    'bengkulu': 38, 'bandar_lampung': 335, 'pangkal_pinang': 539, 'gorontalo': 79,
    'jambi': 83, 'kendari': 101, 'palu': 179, 'mamuju': 142, 'tanjung_selor': 279,
    'sorong': 253, 'manokwari': 144, 'nabire': 165, 'wamena': 300,
    'merauke': 155, 'jakarta_pusat': 308, 'sleman': 247,
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read()


def parse(html):
    t = re.search(r'<table.*?</table>', html, re.S)
    if not t:
        return []
    out = []
    for row in re.findall(r'<tr.*?</tr>', t.group(0), re.S):
        c = [re.sub(r'<[^>]+>', '', x).strip()
             for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
        if len(c) < 10 or not re.match(r'^\d{2}', c[0]):
            continue
        out.append({'day': int(c[0][:2]), 'imsak': c[2], 'fajr': c[3], 'sunrise': c[4],
                    'dhuha': c[5], 'dhuhr': c[6], 'asr': c[7], 'maghrib': c[8], 'isha': c[9]})
    return out


def main():
    jobs = []
    for name, tid in TOWNS.items():
        for y in (2026,):
            for m in range(1, 13):
                jobs.append((name, tid, y, m))
    # span probes: past and future years on four cities
    for name in ('bandung', 'surabaya', 'medan', 'makassar', 'jayapura', 'banda_aceh'):
        for y in (2024, 2025, 2027, 2028):
            for m in (1, 7):
                jobs.append((name, TOWNS[name], y, m))

    rows = {}
    for name, tid, y, m in jobs:
        fn = os.path.join(CAP, f'jsorg-{name}-{y}-{m:02d}.html')
        if os.path.exists(fn) and os.path.getsize(fn) > 20000:
            html = open(fn, encoding='utf-8', errors='replace').read()
        else:
            url = f'https://jadwalsholat.org/adzan/monthly.php?id={tid}&m={m}&y={y}'
            try:
                code, body = get(url)
            except Exception as e:
                print('ERR', name, y, m, e, flush=True)
                time.sleep(2)
                continue
            html = body.decode('utf-8', 'replace')
            open(fn, 'w', encoding='utf-8').write(html)
            time.sleep(0.4)
        parsed = parse(html)
        if not parsed:
            print('EMPTY', name, y, m, flush=True)
            continue
        rows.setdefault(name, {})[f'{y}-{m:02d}'] = parsed
        print(name, y, m, len(parsed), flush=True)

    json.dump(rows, open(os.path.join(os.path.dirname(CAP), 'data', 'jsorg-raw.json'), 'w'),
              ensure_ascii=False)


if __name__ == '__main__':
    main()
