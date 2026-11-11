#!/usr/bin/env python3
"""Extract a mawaqit page's confData calendar (12 months, no year marker) into dated rows.

Usage: mawaqit_extract.py <page.html> <out.json> <year> [label]
Writes {'YYYY-MM-DD': {fajr,sunrise,dhuhr,asr,maghrib,isha}} plus a sidecar meta.
"""
import json
import re
import sys


def load(path):
    h = open(path, encoding="utf-8", errors="replace").read()
    m = re.search(r"let confData = (\{)", h)
    if not m:
        raise SystemExit(f"no confData in {path}")
    obj, _ = json.JSONDecoder().raw_decode(h[m.start(1):])
    return obj, h


DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def flatten(cal, year):
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    rows = {}
    for mi in range(12):
        month = cal[mi] if mi < len(cal) else {}
        dim = 29 if (mi == 1 and leap) else DIM[mi]
        for d in range(1, dim + 1):
            r = month.get(str(d))
            if not r:
                continue
            rows[f"{year}-{mi + 1:02d}-{d:02d}"] = dict(
                fajr=r[0], sunrise=r[1], dhuhr=r[2], asr=r[3], maghrib=r[4], isha=r[5])
    return rows


if __name__ == "__main__":
    src, out, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
    label = sys.argv[4] if len(sys.argv) > 4 else ""
    obj, h = load(src)
    rows = flatten(obj["calendar"], year)
    json.dump(rows, open(out, "w"), indent=1, sort_keys=True)
    meta = dict(label=label, name=obj.get("name"), url=obj.get("url"),
                latitude=obj.get("latitude"), longitude=obj.get("longitude"),
                timezone=obj.get("timezone"), countryCode=obj.get("countryCode"),
                site=obj.get("site"), rows=len(rows))
    json.dump(meta, open(out.replace(".json", ".meta.json"), "w"), indent=1)
    print(json.dumps(meta, ensure_ascii=False))
