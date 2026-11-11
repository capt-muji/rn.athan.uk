#!/usr/bin/env python3
"""Match the 82 ESA city options to GeoNames EG coordinates."""
import re, json, sys

W = __import__("os").path.expanduser("~/athan-gitree/census/o1l-city/egypt-82")

def norm(s):
    s = s.replace("\u0640", "")            # tatweel
    s = re.sub(r"[\u064B-\u0652]", "", s)   # harakat
    s = re.sub(r"[أإآٱ]", "ا", s)
    s = s.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    s = re.sub(r"[\s\-()]+", "", s)
    return s

def strip_al(s):
    return s[2:] if s.startswith("ال") and len(s) > 3 else s

rows = [l.rstrip("\n").split("\t") for l in open(f"{W}/data/EG.txt", encoding="utf-8")]
places = []
for r in rows:
    if r[6] != "P":
        continue
    alts = [a for a in r[3].split(",") if a]
    names = {norm(r[1]), norm(r[2])} | {norm(a) for a in alts}
    names |= {strip_al(n) for n in list(names)}
    places.append({
        "id": r[0], "name": r[1], "lat": float(r[4]), "lng": float(r[5]),
        "cls": r[6], "code": r[7], "pop": int(r[14] or 0), "names": names,
    })

state = json.load(open(f"{W}/captures/eg-formstate.json", encoding="utf-8"))
out, unmatched = [], []
for i, c in enumerate(state["cities"]):
    key = norm(c["key"])
    cands = [p for p in places if key in p["names"] or strip_al(key) in p["names"]]
    if not cands:
        unmatched.append((i, c["key"]))
        out.append({"i": i, "key": c["key"], "value": c["value"], "match": None})
        continue
    cands.sort(key=lambda p: -p["pop"])
    best = cands[0]
    out.append({"i": i, "key": c["key"], "value": c["value"],
                "match": {"name": best["name"], "lat": best["lat"], "lng": best["lng"],
                          "pop": best["pop"], "n": len(cands),
                          "rival": [f'{p["name"]}@{p["lat"]},{p["lng"]}({p["pop"]})' for p in cands[1:4]]}})

json.dump(out, open(f"{W}/data/city-coords.json", "w"), ensure_ascii=False, indent=1)
print(f"matched {len(out)-len(unmatched)}/{len(out)}")
for i, k in unmatched:
    print("UNMATCHED", i, k)
