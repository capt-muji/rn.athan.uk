#!/usr/bin/env python3
"""Parse every athanpro city page in captures/ap-all into data/, one file per city.

The slug is the page's own path with the slash turned into a double underscore, so a country
slug that contains a hyphen survives intact.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import athanpro

DATA = os.path.join(ROOT, "data")
targets = [l.strip() for l in open(os.path.join(ROOT, "targets-fallback.tsv")) if l.strip()]
rows_out = []
for target in targets:
    country, city = target.split("/", 1)
    src = os.path.join(ROOT, "captures/ap-all", target.replace("/", "-") + ".html")
    if not os.path.exists(src):
        print("MISSING", target)
        continue
    p = athanpro.parse(src)
    if p.get("err"):
        print("ERR", target, p["err"])
        continue
    year, agree = athanpro.resolve_year(p["month_no"], p["rows"])
    if not year:
        print("NOYEAR", target, f"{agree}/{len(p['rows'])}")
        continue
    rows = {f"{year}-{p['month_no']:02d}-{d:02d}": {k: v[k] for k in
            ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")}
            for d, v in sorted(p["rows"].items())}
    slug = f"{country}__{city}"
    out = os.path.join(DATA, f"athanpro-{slug}.json")
    json.dump(dict(rows=rows, meta=dict(city=p["city"], country=country, month=p["month"],
                                        year=year, method=p["method"], tz=p["tz"],
                                        coord=p["coord"], today=p["today"],
                                        weekday_agree=f"{agree}/{len(p['rows'])}",
                                        source=os.path.basename(src),
                                        url=f"https://athanpro.com/countries/{country}/{city}")),
              open(out, "w"), indent=1, sort_keys=True)
    rows_out.append(dict(slug=slug, country=country, city=p["city"], n=len(rows),
                         first=min(rows), last=max(rows), wd=f"{agree}/{len(p['rows'])}",
                         coord=p["coord"], method=p["method"]))
json.dump(rows_out, open(os.path.join(ROOT, "parsed-index.json"), "w"), indent=1)
print(f"{len(rows_out)} pages parsed, {sum(r['n'] for r in rows_out)} rows")
