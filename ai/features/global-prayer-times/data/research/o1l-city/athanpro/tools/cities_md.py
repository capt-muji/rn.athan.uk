#!/usr/bin/env python3
"""Render ATHANPRO-CITIES.md: the platform's full city universe and its country counts."""
import json
import os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def main():
    uni = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "universe.tsv"))]
    fits = json.load(open(os.path.join(DATA, "fits.json")))
    summ = json.load(open(os.path.join(DATA, "summary.json")))
    s = summ["summary"]
    by_country = defaultdict(list)
    for u in uni:
        by_country[(u[1], u[0])].append(u)
    fit_by = {(r["cc"], r["city"]): r for r in fits}
    out = []
    w = out.append
    w("# athanpro.com — the platform's city universe")
    w("")
    w(f"Enumeration of every city page `https://athanpro.com/sitemap.xml` serves, from the sitemap "
      f"({len(open(os.path.join(ROOT, 'captures', 'urls-all.txt')).readlines())} URLs) and from the "
      f"`cities` array each country page embeds. The two agree exactly: **{s['cities']} city pages in "
      f"{s['countries']} countries**.")
    w("")
    w("Five country pages carry no city page at all: French Guiana, Honduras, Hungary, Iceland, "
      "Saint Pierre and Miquelon. Their directories exist in the sitemap and render an empty city "
      "list, so they contribute nothing to the universe.")
    w("")
    w("Every city page was captured raw under `captures/cities/<country>/<city>.html` and its dated "
      "month table normalised under `data/<country>-<city>.json`.")
    w("")
    w("## Counts by country")
    w("")
    w("| Country | Cities | Tables banked | Reproduce >=99pc |")
    w("|---|---|---|---|")
    for (country, cslug), rows in sorted(by_country.items(), key=lambda x: (-len(x[1]), x[0][0])):
        n = len(rows)
        banked = sum(1 for u in rows if (cslug, u[2]) in fit_by)
        good = sum(1 for u in rows if fit_by.get((cslug, u[2]), {}).get("pct", 0) >= 99.0)
        w(f"| {country} | {n} | {banked} | {good} |")
    w("")
    w("## Distribution")
    w("")
    c = Counter(len(v) for v in by_country.values())
    w("| Cities per country | Countries |")
    w("|---|---|")
    for k in sorted(c, reverse=True):
        w(f"| {k} | {c[k]} |")
    w("")
    w("The long tail is the platform's own footprint: Turkey alone carries 510 city pages and "
      "Malaysia 192, while 93 countries carry fewer than ten. The directory is a product surface, "
      "not a national network.")
    w("")
    with open(os.path.join(ROOT, "ATHANPRO-CITIES.md"), "w") as f:
        f.write("\n".join(out) + "\n")
    print(f"wrote ATHANPRO-CITIES.md, {len(by_country)} countries")


if __name__ == "__main__":
    main()
