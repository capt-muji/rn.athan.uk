"""Margins of the Granada mosque table at its published location.

Spain runs UTC+1/+2, so the DST shift is read against the same last-Sunday rule with a 60-minute
base offset on top.""" 
import json, math, sys
from datetime import date
sys.path.insert(0, "$HOME/athan-gitree/census/o1k-wide/benelux2")
import solar
from analyze_pt import mins, dst_shift

LAT, LON = 37.1761, -3.5943   # Plaza de San Nicolás, Albayzín


def shift(d):
    return dst_shift(d) + 60


def analyze(path):
    rows = json.load(open(path))
    cols = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
    out = []
    for k in sorted(rows):
        d = date.fromisoformat(k)
        v = rows[k]
        t = {}
        for name, val in zip(cols, v):
            t[name] = mins(val)
        s = shift(d)
        rec = {"d": k,
               "sunrise": t["sunrise"] - (solar.sunrise_sunset(d, LAT, LON)[0] + s),
               "magrib": t["magrib"] - (solar.sunrise_sunset(d, LAT, LON)[1] + s),
               "dhuhr": t["dhuhr"] - (solar.transit_minutes(d, LON) + s),
               "asr": t["asr"] - (solar.asr(d, LAT, LON) + s),
               "isha_int": t["isha"] - t["magrib"]}
        for a in (15.0, 16.0, 17.0, 18.0, 18.5, 19.0, 20.0):
            x = solar.time_at_angle(d, LAT, LON, a, True)
            rec[f"fajr_{a}"] = None if x is None else t["fajr"] - (x + s)
        for a in (12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0):
            x = solar.time_at_angle(d, LAT, LON, a, False)
            rec[f"isha_{a}"] = None if x is None else t["isha"] - (x + s)
        out.append(rec)
    print(f"== {path} rows={len(out)} {out[0]['d']}..{out[-1]['d']}")
    for c in [k for k in out[0] if k != "d"]:
        vals = sorted(r[c] for r in out if r[c] is not None)
        if not vals:
            continue
        mean = sum(vals) / len(vals)
        sd = (sum((x - mean) ** 2 for x in vals) / len(vals)) ** 0.5
        print(f"   {c:12s} med={vals[len(vals)//2]:7.2f} mean={mean:7.2f} sd={sd:5.2f} min={vals[0]:7.2f} max={vals[-1]:7.2f}")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        analyze(p)
