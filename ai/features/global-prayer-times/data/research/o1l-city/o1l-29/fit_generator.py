"""Fit the IFI generator's own solar model: one horizon shared by sunrise and
sunset, one dhuhr margin, and the place. Four unknowns per city, 1095
observations. Once the place is pinned by the solar columns, the fajr/isha
columns give the twilight angles with no longitude ambiguity."""
import json, glob, os, sys, math
from datetime import date
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import solar

START = {"dublin": (53.35, -6.26), "cork": (51.90, -8.48), "limerick": (52.66, -8.63),
         "waterford": (52.26, -7.11), "galway": (53.27, -9.06), "drogheda": (53.72, -6.36),
         "dundalk": (54.01, -6.40), "kilkenny": (52.65, -7.24), "sligo": (54.28, -8.48),
         "athlone": (53.42, -7.94), "ennis": (52.84, -8.99), "tralee": (52.27, -9.70),
         "wexford": (52.34, -6.46), "navan": (53.65, -6.68), "carlow": (52.84, -6.93),
         "portlaoise": (53.03, -7.30), "mullingar": (53.53, -7.34), "cavan": (53.99, -7.36),
         "ballyhaunis": (53.76, -8.76), "castlebar": (53.86, -9.30), "naas": (53.22, -6.67),
         "thurles": (52.68, -7.82), "clonmel": (52.36, -7.70), "letterkenny": (54.95, -7.73),
         "longford": (53.73, -7.79), "tullamore": (53.27, -7.49)}


def tz(d):
    return 60 if (3, 29) <= (d.month, d.day) < (10, 25) else 0


def cross(d, lon, lat, altitude, morning):
    decl, eot = solar._sun(solar._julian_day(d))
    noon = 720.0 - 4.0 * lon - eot
    ch = ((math.sin(altitude * solar.RAD) - math.sin(lat * solar.RAD) * math.sin(decl * solar.RAD))
          / (math.cos(lat * solar.RAD) * math.cos(decl * solar.RAD)))
    if abs(ch) > 1:
        return None
    h = math.degrees(math.acos(ch))
    return noon - 4.0 * h if morning else noon + 4.0 * h


def cost(rows, lat, lon, horizon, dmargin):
    s = n = 0
    for iso, rec in rows.items():
        d = date.fromisoformat(iso)
        t = tz(d)
        sr = cross(d, lon, lat, horizon, True)
        mg = cross(d, lon, lat, horizon, False)
        if sr is None or mg is None:
            continue
        for obs, pred in ((solar.hhmm(rec["sunrise"]) - t, sr),
                          (solar.hhmm(rec["maghrib"]) - t, mg),
                          (solar.hhmm(rec["dhuhr"]) - t, solar.solar_noon_utc(d, lon) + dmargin)):
            s += (obs - pred) ** 2
            n += 1
    return s / n


def descend(rows, p, steps):
    best = cost(rows, *p)
    p = list(p)
    for step in steps:
        moved = True
        while moved:
            moved = False
            for i in range(len(p)):
                for sign in (1, -1):
                    cand = list(p)
                    cand[i] += sign * step
                    c = cost(rows, *cand)
                    if c < best - 1e-10:
                        best, p, moved = c, cand, True
    return p, best ** 0.5


def measure(rows, lat, lon):
    out = []
    for iso, rec in sorted(rows.items()):
        d = date.fromisoformat(iso)
        t = tz(d)
        out.append({"date": iso, "month": d.month, "day": d.day,
                    "fajr_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["fajr"]) - t),
                    "isha_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["isha"]) - t),
                    "fajr_gap": solar.hhmm(rec["sunrise"]) - solar.hhmm(rec["fajr"]),
                    "isha_gap": solar.hhmm(rec["isha"]) - solar.hhmm(rec["maghrib"])})
    return out


def main():
    out = {}
    for path in sorted(glob.glob("data/ifi_*_2026.json")):
        if "printed" in path:
            continue
        city = os.path.basename(path).replace("ifi_", "").replace("_2026.json", "")
        rows = json.load(open(path))
        keys = sorted(rows)[::3]
        sample = {k: rows[k] for k in keys}
        p, rms = descend(sample, [*START[city], -1.5, 2.0],
                         [0.4, 0.1, 0.02, 0.005, 0.001])
        p2, rms = descend(rows, p, [0.05, 0.02, 0.005, 0.001])
        lat, lon, horizon, dmargin = p2
        meas = measure(rows, lat, lon)
        win = [m for m in meas if m["month"] in (11, 12, 1, 2)]
        fa = sorted(m["fajr_angle"] for m in win)
        ia = sorted(m["isha_angle"] for m in win)
        out[city] = {"lat": round(lat, 2), "lon": round(lon, 2), "horizon": round(horizon, 2),
                     "dhuhr_margin": round(dmargin, 2), "solar_rms_min": round(rms, 2),
                     "fajr_winter": round(fa[len(fa) // 2], 2),
                     "isha_winter": round(ia[len(ia) // 2], 2), "rows": len(meas)}
        print(f"{city:13s} lat={lat:6.2f} lon={lon:7.2f} horizon={horizon:6.2f} "
              f"dhuhr+{dmargin:4.2f} rms={rms:4.2f}  fajrW={out[city]['fajr_winter']:5.2f} "
              f"ishaW={out[city]['isha_winter']:5.2f}")
    json.dump(out, open("data/ifi_generator_model.json", "w"), indent=1, sort_keys=True)


if __name__ == "__main__":
    main()
