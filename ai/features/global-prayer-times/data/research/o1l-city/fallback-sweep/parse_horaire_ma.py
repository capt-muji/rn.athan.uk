#!/usr/bin/env python3
"""Parse a horaire-de-priere.ma monthly table (DD/MM + 6 columns) into dated rows.

Usage: parse_horaire_ma.py <page.html> <out.json> <year> <month>
"""
import json
import re
import sys

src, out, year, month = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
h = open(src, encoding="utf-8", errors="replace").read()
i = h.find("<table")
seg = h[i:h.find("</table>", i)]
rows = {}
for r in re.findall(r"<tr[^>]*>(.*?)</tr>", seg, re.S):
    cells = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", c)).strip()
             for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, re.S)]
    if not cells or not re.match(r"^\d\d/\d\d$", cells[0]):
        continue
    dd, mm = cells[0].split("/")
    if int(mm) != month:
        continue
    v = cells[1:]
    if len(v) < 6:
        continue
    rows[f"{year}-{int(mm):02d}-{int(dd):02d}"] = dict(
        fajr=v[0], sunrise=v[1], dhuhr=v[2], asr=v[3], maghrib=v[4], isha=v[5])
json.dump(rows, open(out, "w"), indent=1, sort_keys=True)
print(out, len(rows), "rows", sorted(rows)[:1], sorted(rows)[-1:])
