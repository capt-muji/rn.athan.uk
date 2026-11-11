#!/usr/bin/env python3
"""Merged coordinate table: gazetteer match, with curated fills for the gaps.
source: 'geonames:<name>' | 'manual:<note>' (uncertain, superseded by implied coords)."""
import json, os
W = os.path.expanduser("~/athan-gitree/census/o1l-city/egypt-82")
base = {c["i"]: c for c in json.load(open(f"{W}/data/city-coords.json", encoding="utf-8"))}

MANUAL = {
  11: (31.3529, 27.23725, "geonames:Marsa Matruh"),
  18: (22.22273, 36.64679, "geonames:Hala'ib"),
  21: (29.9361, 30.9188, "manual:6 October City core"),
  26: (29.5833, 32.6667, "manual:Ras Sedr"),
  30: (28.35831, 33.07829, "geonames:Ras Gharib"),
  32: (23.94556, 35.48417, "geonames:Barnis/Berenice"),
  33: (26.74906, 33.93891, "geonames:Safaga"),
  40: (25.48742, 28.97918, "geonames:Mut (Dakhla)"),
  41: (27.0568, 27.96979, "geonames:Qasr al Farafirah"),
  55: (22.5224, 31.96734, "geonames:Tushkah Sharq"),
  57: (28.56199, 33.95005, "geonames:Sant Katrina"),
  58: (30.36742, 30.50871, "geonames:Madinat as Sadat"),
  62: (30.0167, 31.7500, "manual:New Administrative Capital"),
  64: (28.82306, 30.89903, "geonames:Al Fashn"),
  65: (31.3667, 31.5500, "manual:New Mansoura (coastal)"),
  66: (30.6687, 30.07391, "geonames:An Nubariyah"),
  67: (30.136, 31.715, "geonames:Badr City"),
  68: (28.49456, 30.80526, "geonames:Bani Mazar"),
  69: (31.1833, 32.2833, "manual:New Port Said (Salam)"),
  70: (31.0167, 33.0167, "manual:Bir al-Abd"),
  71: (22.5224, 31.96734, "geonames:Tushkah Sharq"),
  72: (30.0500, 31.6500, "manual:Capital Gardens"),
  73: (31.39951, 30.41718, "geonames:Rosetta"),
  74: (31.28204, 34.23869, "geonames:Rafah"),
  75: (29.9500, 31.0500, "manual:Sphinx City"),
  76: (22.5833, 28.7167, "manual:East Oweinat"),
  77: (30.6500, 29.9500, "manual:West Nubaria"),
  80: (26.12039, 32.09543, "geonames:Abu Tisht"),
}

out = []
for i in sorted(base):
    c = base[i]
    if i in MANUAL:
        lat, lng, src = MANUAL[i]
        out.append({"i": i, "key": c["key"], "value": c["value"], "lat": lat, "lng": lng, "source": src})
    elif c["match"]:
        out.append({"i": i, "key": c["key"], "value": c["value"], "lat": c["match"]["lat"],
                    "lng": c["match"]["lng"], "source": "geonames:" + c["match"]["name"],
                    "rivals": c["match"]["rival"]})
    else:
        out.append({"i": i, "key": c["key"], "value": c["value"], "lat": None, "lng": None, "source": "UNRESOLVED"})
json.dump(out, open(f"{W}/data/coords.json", "w"), ensure_ascii=False, indent=1)
print("unresolved:", [o["i"] for o in out if o["lat"] is None])
print("manual:", sum(1 for o in out if o["source"].startswith("manual")))
