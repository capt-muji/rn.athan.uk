#!/usr/bin/env python3
"""Parse a Tawkit city page into dated rows. Usage: parse-tawkit.py <html> <out.json>"""
import json
import re
import sys

html = open(sys.argv[1], encoding="utf-8", errors="replace").read()

m = re.search(r"Prayer timetable,?\s*(\d{1,2})-(\d{4})", html)
if not m:
    sys.exit("no month header")
month, year = int(m.group(1)), int(m.group(2))

coords = re.search(r'"latitude"\s*:\s*(-?\d+\.\d+).*?"longitude"\s*:\s*(-?\d+\.\d+)', html, re.S)
if not coords:
    coords = re.search(r"lat[^0-9-]{0,12}(-?\d+\.\d+)[^0-9-]{1,20}(-?\d+\.\d+)", html)

rows = re.findall(
    r"<th scope=\"row\">(\d{1,2})</th>\s*((?:<td>[^<]*</td>\s*){6})", html
)
if not rows:
    sys.exit("no table rows")

cols = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
out = {}
for day, cells in rows:
    vals = re.findall(r"<td>([^<]*)</td>", cells)
    if len(vals) != 6:
        sys.exit(f"row {day}: {len(vals)} cells")
    out[f"{year:04d}-{month:02d}-{int(day):02d}"] = vals

doc = {
    "source": "tawkit.net",
    "tier": "platform",
    "month": f"{year:04d}-{month:02d}",
    "columns": cols,
    "rows": out,
}
if coords:
    doc["lat"], doc["lon"] = float(coords.group(1)), float(coords.group(2))
json.dump(doc, open(sys.argv[2], "w"), indent=1, sort_keys=True)
print(f"{sys.argv[2]}: {len(out)} rows, {doc['month']}, lat={doc.get('lat')} lon={doc.get('lon')}")
