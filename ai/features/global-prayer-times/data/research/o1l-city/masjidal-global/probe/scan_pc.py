#!/usr/bin/env python3
"""Scan prayersconnect mosque pages for embedded Masjidal tenant ids.

usage: scan_pc.py <sitemap-url> <tag> <max-pages>
"""
import re, sys, random, urllib.request, json
from concurrent.futures import ThreadPoolExecutor

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
BASE = "$HOME/athan-gitree/census/o1l-city/masjidal-global/probe/pc"


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf8", "replace")


def main():
    sm, tag, mx = sys.argv[1], sys.argv[2], int(sys.argv[3])
    try:
        xml = open(f"{BASE}/{tag}.xml", encoding="utf8").read()
    except FileNotFoundError:
        xml = get(sm, 120)
        open(f"{BASE}/{tag}.xml", "w", encoding="utf8").write(xml)
    urls = re.findall(r"<loc>([^<]+)", xml)
    random.seed(7)
    random.shuffle(urls)
    urls = urls[:mx]

    pat = re.compile(r'masjidal\.com/[^\s"\'<>]*?masjid_id=([A-Za-z0-9]+)')
    apat = re.compile(r'athanplus\.com/[^\s"\'<>]*?masjid_id=([A-Za-z0-9]+)')

    def one(u):
        try:
            h = get(u)
        except Exception:
            return None
        ids = set(pat.findall(h))
        aids = set(apat.findall(h))
        if ids or aids:
            return {"page": u, "masjidal": sorted(ids), "athanplus": sorted(aids)}
        return None

    hits = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        for r in ex.map(one, urls):
            if r:
                hits.append(r)
    with open(f"{BASE}/{tag}.hits", "w", encoding="utf8") as f:
        for h in hits:
            f.write(json.dumps(h) + "\n")
    print(f"{len(urls)} pages scanned, {len(hits)} carry a masjidal widget")


if __name__ == "__main__":
    main()
