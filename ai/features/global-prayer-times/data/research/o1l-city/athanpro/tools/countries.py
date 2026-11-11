#!/usr/bin/env python3
"""Capture every athanpro country page and lift its embedded city directory.

The country page is a static Next.js build; props.pageProps.cities carries one object per
city the platform serves, with its slug, coordinates and IANA zone. That is the universe.
"""
import json
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAP = os.path.join(ROOT, "captures", "countries")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return open(path, encoding="utf-8", errors="replace").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    open(path, "wb").write(body)
    time.sleep(0.4)
    return body.decode("utf-8", "replace")


def next_data(html):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None


def main():
    os.makedirs(CAP, exist_ok=True)
    slugs = [l.strip() for l in open(os.path.join(ROOT, "captures", "countries.txt")) if l.strip()]
    out = []
    fails = []
    for i, slug in enumerate(slugs, 1):
        path = os.path.join(CAP, f"{slug}.html")
        try:
            html = fetch(f"https://athanpro.com/countries/{slug}", path)
        except Exception as e:
            fails.append((slug, f"fetch:{e}"))
            continue
        d = next_data(html)
        if not d:
            fails.append((slug, "no-next-data"))
            continue
        pp = d.get("props", {}).get("pageProps", {})
        country = pp.get("country") or {}
        cities = pp.get("cities") or []
        if not cities:
            fails.append((slug, "no-cities"))
            continue
        for c in cities:
            out.append(dict(
                country_slug=slug,
                country=country.get("name_en") or slug,
                country_tz_label=country.get("timezone"),
                slug=c.get("slug"),
                name=c.get("name_en"),
                lat=c.get("latitude"),
                lon=c.get("longitude"),
                tz=c.get("timezone"),
                priority=c.get("priority"),
            ))
        print(f"{i}/{len(slugs)} {slug}: {len(cities)}", flush=True)
    with open(os.path.join(ROOT, "data", "universe.json"), "w") as f:
        json.dump(out, f, indent=1)
    with open(os.path.join(ROOT, "data", "universe.tsv"), "w") as f:
        for r in out:
            f.write("\t".join(str(r[k]) for k in
                    ("country_slug", "country", "slug", "name", "lat", "lon", "tz", "priority")) + "\n")
    print(f"TOTAL {len(out)} cities, {len(fails)} failures")
    for x in fails:
        print("FAIL", x)


if __name__ == "__main__":
    main()
