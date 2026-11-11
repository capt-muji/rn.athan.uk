"""Harvest every dated year table islamichina.com serves, per city.

Years come from data/islamichina-city-years.json (the city index enumeration).
Every page is saved raw; every parsed row set is written to data/.
"""
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).parent
CAP = ROOT / "captures"
DATA = ROOT / "data"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
TIME = r'([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM))'
KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def get(url, out):
    cmd = ['curl', '-sS', '-L', '-o', str(out), '-w', '%{http_code}', '-A', UA,
           '--max-time', '120', url]
    return subprocess.run(cmd, capture_output=True, text=True).stdout.strip()


CELL = (r'<(?:td|div)[^>]*>\s*(\d{1,2}|' + TIME + r')\s*</(?:td|div)>')


def parse(page, year):
    months = [(m.start(), MONTHS.index(m.group(1)) + 1)
              for m in re.finditer(r'>\s*(' + '|'.join(MONTHS) + r')\s+' + str(year), page)]
    cells = [(m.start(), m.group(1)) for m in re.finditer(CELL, page)]
    rows, month = [], None
    for i, (pos, val) in enumerate(cells):
        if not re.fullmatch(r'\d{1,2}', val):
            continue
        blob = [v for _, v in cells[i + 1:i + 7]]
        if len(blob) != 6 or not all(re.fullmatch(TIME, b) for b in blob):
            continue
        for mpos, mnum in months:
            if mpos < pos:
                month = mnum
        if month is None:
            continue
        rows.append({'month': month, 'day': int(val), **dict(zip(KEYS, blob))})
    seen, uniq = set(), []
    for r in rows:
        k = (r['month'], r['day'])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq


def main():
    index = json.loads((DATA / 'islamichina-city-years.json').read_text())
    log = {}
    for slug, rec in sorted(index.items()):
        log[slug] = {}
        for year, rel in sorted(rec['years'].items()):
            out = CAP / f"islamichina_{slug}_{year}.html"
            if out.exists() and out.stat().st_size > 100000:
                code = 'cached'
            else:
                code = get(f"https://www.islamichina.com{rel}", out)
                time.sleep(0.6)
            rows = parse(out.read_text(encoding='utf-8', errors='replace'), int(year)) \
                if out.exists() else []
            (DATA / f"islamichina_{slug}_{year}.json").write_text(json.dumps({
                'city_slug': slug, 'source': f"https://www.islamichina.com{rel}",
                'tier': 'platform (commercial travel site embedding a calculator widget)',
                'year': int(year), 'rows': rows}, ensure_ascii=False, indent=1))
            log[slug][year] = {'code': code, 'url': rel, 'rows': len(rows)}
            print(f"{slug:14s} {year} {code:7s} rows={len(rows):3d}")
            (DATA / 'islamichina-harvest-log.json').write_text(
                json.dumps(log, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
