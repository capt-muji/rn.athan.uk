#!/usr/bin/env python3
"""fi.py <glob> — the FORM-MAP interval test: F = sunrise-fajr, I = isha-maghrib, delta vs LUPT."""
import json, sys, glob, pathlib, os, collections

LUPT = json.loads(pathlib.Path(os.path.expanduser(
    "~/athan-gitree/census/o1k-wide/fit14/lupt_fi.json")).read_text())


def mins(hhmm):
    h, m = map(int, hhmm.split(":")[:2])
    return h * 60 + m


def test(rows):
    out = {"F": [], "I": []}
    for date, r in sorted(rows.items()):
        try:
            mmdd = date[5:]
            if mmdd not in LUPT["F"]:
                continue
            if r["fajr"] in ("00:00", "") or r["isha"] in ("00:00", ""):
                continue
            f = mins(r["sunrise"]) - mins(r["fajr"])
            i = mins(r["isha"]) - mins(r["maghrib"])
            out["F"].append(f - LUPT["F"][mmdd])
            out["I"].append(i - LUPT["I"][mmdd])
        except (KeyError, ValueError):
            continue
    res = {}
    for side, deltas in out.items():
        if not deltas:
            continue
        c = collections.Counter(deltas)
        mode, n = c.most_common(1)[0]
        res[side] = {"n": len(deltas), "mode": mode,
                     "share": round(100 * sum(1 for d in deltas if abs(d - mode) <= 1) / len(deltas)),
                     "span": (min(deltas), max(deltas))}
    return res


def main():
    for path in sorted(glob.glob(sys.argv[1])):
        payload = json.loads(pathlib.Path(path).read_text())
        rows = payload.get("rows", payload)
        r = test(rows)
        tag = pathlib.Path(path).stem[:30]
        parts = []
        for side in ("F", "I"):
            if side in r:
                v = r[side]
                parts.append(f"{side} {v['mode']:+4d} ({v['share']:3d}% of {v['n']:3d})")
            else:
                parts.append(f"{side} --")
        print(f"{tag:30} {' | '.join(parts)}")


main()
