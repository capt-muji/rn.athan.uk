#!/usr/bin/env python3
"""Pull every coordinate field the banked Americas captures carry, one row per surface file."""
import json, os, re, glob

CENSUS = os.path.expanduser("~/athan-gitree/census")
OUT = os.path.expanduser("~/athan-gitree/census/o1l-city/coords-americas/data/banked.json")

def read(p):
    return open(p, encoding="utf-8", errors="replace").read()

def mawaqit_payload(path):
    h = read(path)
    lat = re.search(r'"latitude"\s*:\s*(-?[0-9.]+)', h)
    lon = re.search(r'"longitude"\s*:\s*(-?[0-9.]+)', h)
    name = re.search(r'"name"\s*:\s*"([^"]{2,80})"', h)
    addr = re.search(r'"address"\s*:\s*"([^"]{2,120})"', h)
    if not (lat and lon):
        return None
    return {"lat": float(lat.group(1)), "lon": float(lon.group(1)),
            "name": name.group(1) if name else None,
            "address": addr.group(1) if addr else None,
            "evidence": "mawaqit page payload (confData/meta latitude, longitude)",
            "capture": path}

def masjidal_info(path):
    try:
        d = json.load(open(path))
    except Exception:
        return None
    info = (d.get("data") or {}).get("masjid_info") or {}
    if not info:
        return None
    return {"name": info.get("name"), "address": info.get("location"),
            "website": info.get("website_url"),
            "evidence": "Masjidal masjid_info.location (platform API, masjid_detail=yes)",
            "capture": path}

def masjidbox_ld(path):
    h = read(path)
    out = {"name": None, "address": None, "geo": None}
    for m in re.finditer(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', h, re.S):
        try:
            blob = json.loads(m.group(1))
        except Exception:
            continue
        items = blob if isinstance(blob, list) else [blob]
        for it in items:
            if it.get("@type") in ("Mosque", "Place", "Organization"):
                out["name"] = out["name"] or it.get("name")
                a = it.get("address") or {}
                out["address"] = out["address"] or a.get("streetAddress")
                g = it.get("geo") or {}
                if g.get("latitude") is not None:
                    out["geo"] = {"lat": float(g["latitude"]), "lon": float(g["longitude"])}
            loc = it.get("location") or {}
            if isinstance(loc, dict) and loc.get("@type") == "Place":
                a = loc.get("address") or {}
                out["address"] = out["address"] or a.get("streetAddress")
    if not out["address"] and not out["geo"]:
        return None
    out["evidence"] = "Masjidbox page JSON-LD PostalAddress"
    out["capture"] = path
    return out

found = {}

# mawaqit pages
for p in glob.glob(f"{CENSUS}/o1l-city/us-states/captures/mawaqit_*.html") + \
         glob.glob(f"{CENSUS}/o1k-wide/americas2/captures/*_mawaqit.html"):
    r = mawaqit_payload(p)
    if r:
        found[os.path.basename(p)] = dict(r, platform="mawaqit")

# masjidal api payloads
for p in glob.glob(f"{CENSUS}/o1l-city/us-states/captures/masjidal_*_20*.json") + \
         glob.glob(f"{CENSUS}/o1k-wide/americas2/captures/masjidal_*.json"):
    r = masjidal_info(p)
    if r:
        found[os.path.basename(p)] = dict(r, platform="masjidal")

# masjidbox pages
for p in glob.glob(f"{CENSUS}/o1l-city/us-states/captures/masjidbox_*.html") + \
         glob.glob(f"{CENSUS}/o1k-wide/americas2/captures/mx_guadalajara_home.html"):
    r = masjidbox_ld(p)
    if r:
        found[os.path.basename(p)] = dict(r, platform="masjidbox")

json.dump(found, open(OUT, "w"), indent=1, sort_keys=True)
print(len(found), "captures carry a location field")
for k in sorted(found):
    v = found[k]
    print(f"{k:70s} {v['platform']:9s} {v.get('lat')} {v.get('lon')} | {v.get('address')}")
