"""Enumerate every city index islamichina.com serves and every year article under it.

The home page's A-Z carries the served city set; each city index carries the year
articles (2025 and 2026 today, 2027-2029 for the two cities the RSS feed showed).
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


def get(url, out):
    cmd = ['curl', '-sS', '-L', '-o', str(out), '-w', '%{http_code}', '-A', UA,
           '--max-time', '90', url]
    return subprocess.run(cmd, capture_output=True, text=True).stdout.strip()


def slugs():
    home = (CAP / "islamichina_home.html").read_text(encoding='utf-8', errors='replace')
    found = re.findall(r'href="/([A-Za-z0-9\'-]+)-prayer-times\.html', home)
    return sorted({s.lower() for s in found})


def main():
    out = {}
    for slug in slugs():
        idx = CAP / f"islamichina_{slug}_index.html"
        if not idx.exists() or idx.stat().st_size < 5000:
            code = get(f"https://www.islamichina.com/{slug}-prayer-times.html", idx)
        else:
            code = '200'
        page = idx.read_text(encoding='utf-8', errors='replace') if idx.exists() else ''
        years = {}
        for m in re.finditer(r'href="/([a-z0-9\'-]+)-prayer-times/(\d+)-(\d{4})\.html"', page):
            years.setdefault(int(m.group(3)), f"/{m.group(1)}-prayer-times/{m.group(2)}-{m.group(3)}.html")
        out[slug] = {'index': code, 'years': {str(k): v for k, v in sorted(years.items())}}
        print(f"{slug:14s} {code} years={sorted(years)}")
        (DATA / 'islamichina-city-years.json').write_text(
            json.dumps(out, ensure_ascii=False, indent=1))
        time.sleep(1)


if __name__ == '__main__':
    main()
