"""Harvest the islamichina.com dated 2026 city tables for the provincial capitals.

Third-tier surface: a commercial China travel site that embeds a calculator widget.
It is captured because it is the only DATED city table the Chinese open web serves for
most capitals, and because its recipe can be measured against the same solar engine.
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
CAP = ROOT / "captures"
DATA = ROOT / "data"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

SLUGS = ['beijing', 'shanghai', 'tianjin', 'chongqing', 'guangzhou', 'kunming',
         'urumqi', 'yinchuan', 'lanzhou', 'xining', 'xian', 'zhengzhou', 'jinan',
         'shenyang', 'changchun', 'harbin', 'hohhot', 'chengdu', 'wuhan', 'changsha',
         'nanjing', 'hangzhou', 'fuzhou', 'nanning', 'guiyang', 'hefei',
         'shijiazhuang', 'taiyuan', 'lhasa']


def get(url, out):
    cmd = ['curl', '-sS', '-L', '-o', str(out), '-w', '%{http_code}', '-A', UA,
           '--max-time', '90', url]
    code = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
    return code


TIME = r'([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM))'


def parse(page):
    months = [(m.start(), m.group(1)) for m in re.finditer(r'>\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+2026', page)]
    cells = [(m.start(), m.group(1)) for m in re.finditer(r'<td[^>]*>\s*(\d{1,2}|' + TIME + r')\s*</td>', page)]
    rows = []
    for i, (pos, val) in enumerate(cells):
        if not re.fullmatch(r'\d{1,2}', val):
            continue
        blob = [v for p2, v in cells[i + 1:i + 7]]
        if len(blob) != 6 or not all(re.fullmatch(TIME, b) for b in blob):
            continue
        month = None
        for mpos, mname in months:
            if mpos < pos:
                month = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                         'August', 'September', 'October', 'November', 'December'].index(mname) + 1
        if month is None:
            continue
        keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
        rows.append({'month': month, 'day': int(val), **dict(zip(keys, blob))})
    seen, uniq = set(), []
    for r in rows:
        k = (r['month'], r['day'])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq


def main():
    log = {}
    for slug in SLUGS:
        idx = CAP / f"islamichina_{slug}_index.html"
        code = get(f"https://www.islamichina.com/{slug}-prayer-times.html", idx)
        page = idx.read_bytes().decode('utf-8', 'replace')
        m = re.search(r'href="(/[a-z\'-]*prayer-times/(\d+)-2026\.html)"', page)
        if not m:
            log[slug] = {'index': code, 'note': 'no 2026 link found'}
            print(f"{slug:14s} index={code} NO 2026 LINK")
            (DATA / 'islamichina-fetch-log.json').write_text(json.dumps(log, ensure_ascii=False, indent=1))
            continue
        rel, year_id = m.group(1), m.group(2)
        yearly = CAP / f"islamichina_{slug}_2026.html"
        code2 = get(f"https://www.islamichina.com{rel}", yearly)
        rows = parse(yearly.read_bytes().decode('utf-8', 'replace')) if code2 == '200' else []
        (DATA / f"islamichina_{slug}_2026.json").write_text(json.dumps(
            {'city_slug': slug, 'source': f"https://www.islamichina.com{rel}",
             'tier': 'platform (commercial travel site embedding a calculator widget)',
             'year': 2026, 'rows': rows}, ensure_ascii=False, indent=1))
        log[slug] = {'index': code, 'yearly': code2, 'url': rel, 'rows': len(rows)}
        print(f"{slug:14s} index={code} yearly={code2} rows={len(rows):3d} {rel}")
        (DATA / 'islamichina-fetch-log.json').write_text(json.dumps(log, ensure_ascii=False, indent=1))
        time.sleep(1)


if __name__ == '__main__':
    main()
