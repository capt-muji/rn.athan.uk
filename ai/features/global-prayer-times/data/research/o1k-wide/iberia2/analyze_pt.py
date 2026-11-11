"""Recover each hsalah edition's own coordinates and implied margins from its printed columns.

The printed Zawal is true solar noon in local clock, so a year of Zawal fixes longitude;
the (Nascer, Zawal, Assr) shape fixes latitude. With those recovered, each column's margin
over the corresponding solar event is read straight off the table.
"""
import json, math, sys
from datetime import date, datetime, timedelta
from parse_pt import parse
sys.path.insert(0, "$HOME/athan-gitree/census/o1k-wide/benelux2")
import solar


def mins(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def last_sunday(year, month):
    d = date(year, month, 31)
    return d - timedelta(days=(d.weekday() + 1) % 7)


def dst_shift(d):
    y = d.year
    start = last_sunday(y, 3)
    end = last_sunday(y, 10)
    return 60 if (start <= d < end) else 0


def local_minutes(d, utc_minutes):
    return utc_minutes + dst_shift(d)


def fit_coords(rows):
    """Grid-search lat/lon that best reproduce zawal + nascer + assr(1x) after per-column offsets."""
    samples = []
    for k, v in rows.items():
        d = date.fromisoformat(k)
        samples.append((d, mins(v["zawal"]), mins(v["sunrise"]), mins(v["asr"])))
    best = None
    lat = 36.5
    while lat <= 42.5:
        lon = -10.0
        while lon <= -6.0:
            rz, rn, ra = [], [], []
            for d, z, n, a in samples:
                tz = local_minutes(d, solar.transit_minutes(d, lon))
                tn = local_minutes(d, solar.sunrise_sunset(d, lat, lon)[0])
                ta = local_minutes(d, solar.asr(d, lat, lon))
                rz.append(z - tz)
                rn.append(n - tn)
                ra.append(a - ta)
            # per-column offsets absorb the publisher's margins; the spread is the shape error
            key = sum((x - sum(rz) / len(rz)) ** 2 for x in rz) \
                + sum((x - sum(rn) / len(rn)) ** 2 for x in rn) \
                + sum((x - sum(ra) / len(ra)) ** 2 for x in ra)
            if best is None or key < best[0]:
                best = (key, lat, lon)
            lon += 0.05
        lat += 0.05
    _, lat, lon = best
    return lat, lon


def margins(rows, lat, lon):
    out = {}
    for k in sorted(rows):
        d = date.fromisoformat(k)
        v = rows[k]
        z = local_minutes(d, solar.transit_minutes(d, lon))
        sr = local_minutes(d, solar.sunrise_sunset(d, lat, lon)[0])
        ss = local_minutes(d, solar.sunrise_sunset(d, lat, lon)[1])
        fa = local_minutes(d, solar.time_at_angle(d, lat, lon, 18.0, True))
        i125 = local_minutes(d, solar.time_at_angle(d, lat, lon, 12.5, False))
        out[k] = {
            "sunrise_vs_horizon": mins(v["sunrise"]) - sr,
            "zawal_vs_noon": mins(v["zawal"]) - z,
            "dhuhr_vs_zawal": mins(v["dhuhr"]) - mins(v["zawal"]),
            "magrib_vs_sunset": mins(v["magrib"]) - ss,
            "fajr_vs_18deg": mins(v["fajr"]) - fa,
            "isha_vs_magrib": mins(v["isha"]) - mins(v["magrib"]),
            "isha_alt_vs_maghrib": (mins(v["isha_alt"]) - mins(v["magrib"])) if "isha_alt" in v else None,
        }
    return out


def summarize(name, path):
    rows = parse(path)
    lat, lon = fit_coords(rows)
    m = margins(rows, lat, lon)
    keys = ["sunrise_vs_horizon", "zawal_vs_noon", "dhuhr_vs_zawal", "magrib_vs_sunset", "fajr_vs_18deg", "isha_vs_magrib", "isha_alt_vs_maghrib"]
    print(f"\n== {name}  rows={len(rows)}  fitted lat={lat:.2f} lon={lon:.2f}")
    for k in keys:
        vals = [v[k] for v in m.values() if v[k] is not None]
        if not vals:
            continue
        vals_sorted = sorted(vals)
        med = vals_sorted[len(vals) // 2]
        mean = sum(vals) / len(vals)
        print(f"   {k:22s} median={med:7.2f} mean={mean:7.2f} min={min(vals):7.2f} max={max(vals):7.2f} sd={(sum((x-mean)**2 for x in vals)/len(vals))**0.5:5.2f}")
    return rows, m, (lat, lon)


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        name, path = arg.split("=", 1)
        summarize(name, path)
