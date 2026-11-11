#!/usr/bin/env python3
"""Geocode each captured mosque address once and write coords.json.

The coordinates are fit inputs only: every fit's residuals are the check that they
are right, and a wrong city shows up as a failing sunrise column, not as a quiet
offset. Nominatim is public and needs no key.
"""
import os, re, json, time, glob, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "coords.json")
UA = "athan-census-research/1.0 (prayer times census)"


def addr_from(path):
    if path.endswith(".html"):
        h = open(path, encoding="utf-8", errors="replace").read()
        a = re.search(r'class="masjidAddress"[^>]*>([^<]*)', h)
        return a.group(1).strip() if a else None
    d = json.load(open(path))
    return d.get("address")


def geocode(q):
    url = ("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
           + urllib.parse.quote(q))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        rows = json.load(r)
    if not rows:
        return None
    return float(rows[0]["lat"]), float(rows[0]["lon"]), rows[0].get("display_name", "")


def main():
    coords = {}
    if os.path.exists(OUT):
        coords = json.load(open(OUT))
    # athanplus: first capture per masjid id
    for path in sorted(glob.glob(os.path.join(HERE, "captures", "athanplus", "*.html"))):
        m = re.match(r"(.+?)-([A-Za-z0-9]{8})-(\d{4})-(\d{2})\.html$", os.path.basename(path))
        if not m:
            continue
        key = f"{m.group(1)}|{m.group(2)}"
        if key in coords:
            continue
        a = addr_from(path)
        if not a:
            continue
        coords[key] = {"address": a, "geo": geocode(a)}
        print(key, coords[key]["geo"])
        time.sleep(1.2)
    # masjidbox: cached window files carry the address
    for path in sorted(glob.glob(os.path.join(HERE, "captures", "masjidbox", "*.json"))):
        d = json.load(open(path))
        slug = re.sub(r"-\d{4}-\d{2}-\d{2}\.json$", "", os.path.basename(path))
        key = f"mb|{slug}"
        if key in coords or not d.get("address"):
            continue
        coords[key] = {"address": d["address"], "geo": geocode(d["address"])}
        print(key, coords[key]["geo"])
        time.sleep(1.2)
    json.dump(coords, open(OUT, "w"), indent=1)


if __name__ == "__main__":
    main()
