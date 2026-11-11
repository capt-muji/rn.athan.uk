"""Margins read off a hsalah edition with no assumption about the publisher's coordinates.

Latitude comes from the table's own shape (Nascer/Zawal/Assr spread). Longitude is anchored
per day on the printed Zawal, so every solar event is evaluated at the publisher's own noon and
each column's departure is the margin itself.
"""
import math, sys
from datetime import date
sys.path.insert(0, "$HOME/athan-gitree/census/o1k-wide/benelux2")
import solar
from parse_pt import parse
from analyze_pt import mins, dst_shift


def fit_lat(rows):
    samples = [(date.fromisoformat(k), mins(v["zawal"]), mins(v["sunrise"]),
                mins(v["asr"]), dst_shift(date.fromisoformat(k))) for k, v in rows.items()]
    best = None
    lat = 36.0
    while lat <= 43.0:
        lon = -9.0
        rz, rn, ra = [], [], []
        for d, z, n, a, dst in samples:
            lon_eff = (720 - solar.decl_eot(d)[1] - (z - dst)) / 4.0
            rz.append(z - (solar.transit_minutes(d, lon_eff) + dst))
            rn.append(n - (solar.sunrise_sunset(d, lat, lon_eff)[0] + dst))
            ra.append(a - (solar.asr(d, lat, lon_eff) + dst))
        key = sum((x - sum(rz) / len(rz)) ** 2 for x in rz) \
            + sum((x - sum(rn) / len(rn)) ** 2 for x in rn) \
            + sum((x - sum(ra) / len(ra)) ** 2 for x in ra)
        if best is None or key < best[0]:
            best = (key, lat)
        lat += 0.02
    return best[1]


def margins(rows, lat):
    out = []
    for k in sorted(rows):
        d = date.fromisoformat(k)
        v = rows[k]
        dst = dst_shift(d)
        lon_eff = (720 - solar.decl_eot(d)[1] - (mins(v["zawal"]) - dst)) / 4.0
        sr = solar.sunrise_sunset(d, lat, lon_eff)[0] + dst
        ss = solar.sunrise_sunset(d, lat, lon_eff)[1] + dst
        rec = {
            "d": k,
            "sunrise": mins(v["sunrise"]) - sr,
            "magrib": mins(v["magrib"]) - ss,
            "zawal": mins(v["zawal"]) - (solar.transit_minutes(d, lon_eff) + dst),
            "dhuhr": mins(v["dhuhr"]) - (solar.transit_minutes(d, lon_eff) + dst),
            "asr1": mins(v["asr"]) - (solar.asr(d, lat, lon_eff) + dst),
        }
        for ang in (15.0, 17.0, 18.0, 18.5, 19.0):
            t = solar.time_at_angle(d, lat, lon_eff, ang, True)
            rec[f"fajr_{ang}"] = None if t is None else mins(v["fajr"]) - (t + dst)
        for ang in (12.0, 12.5, 13.0, 15.0, 17.0):
            t = solar.time_at_angle(d, lat, lon_eff, ang, False)
            rec[f"isha_{ang}"] = None if t is None else mins(v["isha"]) - (t + dst)
        rec["isha_int"] = mins(v["isha"]) - mins(v["magrib"])
        rec["isha_alt_int"] = (mins(v["isha_alt"]) - mins(v["magrib"])) if "isha_alt" in v else None
        out.append(rec)
    return out


def report(name, path):
    rows = parse(path)
    lat = fit_lat(rows)
    m = margins(rows, lat)
    print(f"\n== {name} rows={len(rows)} lat={lat:.2f}")
    cols = ["sunrise", "magrib", "zawal", "dhuhr", "asr1", "fajr_15.0", "fajr_17.0", "fajr_18.0",
            "fajr_18.5", "fajr_19.0", "isha_12.0", "isha_12.5", "isha_13.0", "isha_15.0",
            "isha_17.0", "isha_int", "isha_alt_int"]
    for c in cols:
        vals = [r[c] for r in m if r[c] is not None]
        if not vals:
            continue
        vals.sort()
        med = vals[len(vals) // 2]
        mean = sum(vals) / len(vals)
        sd = (sum((x - mean) ** 2 for x in vals) / len(vals)) ** 0.5
        print(f"   {c:14s} med={med:7.2f} mean={mean:7.2f} sd={sd:5.2f} min={vals[0]:7.2f} max={vals[-1]:7.2f}")
    return rows, m, lat


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        name, path = arg.split("=", 1)
        report(name, path)
