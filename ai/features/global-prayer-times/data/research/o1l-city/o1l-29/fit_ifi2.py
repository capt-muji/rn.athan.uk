"""Joint solar fit per IFI city table: recover (lat, lon) plus the printed
convention offsets for sunrise, dhuhr and maghrib, then read the twilight
depression angles straight off the fajr/isha columns."""
import json, glob, os, sys
from datetime import date
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import solar

HORIZON = -0.833


def tz_offset(d):
    return 60 if (3, 29) <= (d.month, d.day) < (10, 25) else 0


def event(d, lon, lat, altitude, morning):
    import math
    decl, eot = solar._sun(solar._julian_day(d))
    noon = 720.0 - 4.0 * lon - eot
    cos_h = ((math.sin(altitude * solar.RAD) - math.sin(lat * solar.RAD) * math.sin(decl * solar.RAD))
             / (math.cos(lat * solar.RAD) * math.cos(decl * solar.RAD)))
    if cos_h > 1 or cos_h < -1:
        return None
    h = math.degrees(math.acos(cos_h))
    return noon - 4.0 * h if morning else noon + 4.0 * h


def residuals(rows, lat, lon, off_s, off_d, off_m):
    out = []
    for iso, rec in rows.items():
        d = date.fromisoformat(iso)
        tz = tz_offset(d)
        sr = event(d, lon, lat, HORIZON, True)
        mg = event(d, lon, lat, HORIZON, False)
        if sr is None or mg is None:
            continue
        out.append(solar.hhmm(rec["sunrise"]) - tz - (sr + off_s))
        out.append(solar.hhmm(rec["dhuhr"]) - tz - (solar.solar_noon_utc(d, lon) + off_d))
        out.append(solar.hhmm(rec["maghrib"]) - tz - (mg + off_m))
    return out


def cost(rows, p):
    r = residuals(rows, *p)
    return sum(x * x for x in r) / len(r)


def refine(rows, p, steps):
    best = cost(rows, p)
    p = list(p)
    for step in steps:
        improved = True
        while improved:
            improved = False
            for i in range(len(p)):
                for sign in (1, -1):
                    cand = list(p)
                    cand[i] += sign * step
                    c = cost(rows, cand)
                    if c < best - 1e-9:
                        best, p, improved = c, cand, True
    return p, best


def fit_city(rows):
    keys = sorted(rows)[::4]
    rows = {k: rows[k] for k in keys}
    lat, lon = 53.4, -7.5
    off_s, off_d, off_m = 0.0, 2.0, 0.0
    p, c = refine(rows, [lat, lon, off_s, off_d, off_m],
                  [0.5, 0.1, 0.02, 0.01, 0.005, 0.001])
    return p, c ** 0.5


def measure(rows, lat, lon):
    out = []
    for iso, rec in rows.items():
        d = date.fromisoformat(iso)
        tz = tz_offset(d)
        out.append({
            "date": iso, "month": d.month, "day": d.day,
            "fajr_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["fajr"]) - tz),
            "isha_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["isha"]) - tz),
            "isha_minus_maghrib": solar.hhmm(rec["isha"]) - solar.hhmm(rec["maghrib"]),
            "asr_min": solar.hhmm(rec["asr"]),
            "dhuhr_min": solar.hhmm(rec["dhuhr"]),
        })
    return out


def main():
    summary = {}
    for path in sorted(glob.glob("data/ifi_*_2026.json")):
        if "printed" in path:
            continue
        city = os.path.basename(path).replace("ifi_", "").replace("_2026.json", "")
        rows = json.load(open(path))
        p, rms = fit_city(rows)
        lat, lon, off_s, off_d, off_m = p
        meas = measure(rows, lat, lon)
        winter = [m for m in meas if m["month"] in (1, 2, 11, 12)]
        june = [m for m in meas if m["month"] in (6, 7)]
        fa = sorted(m["fajr_angle"] for m in winter)
        ia = sorted(m["isha_angle"] for m in winter)
        ninety = sum(1 for m in meas if abs(m["isha_minus_maghrib"] - 90) <= 1)
        summary[city] = {
            "lat": round(lat, 3), "lon": round(lon, 3), "rms_min": round(rms, 3),
            "off_sunrise": round(off_s, 2), "off_dhuhr": round(off_d, 2),
            "off_maghrib": round(off_m, 2),
            "fajr_winter_med": round(fa[len(fa) // 2], 2),
            "isha_winter_med": round(ia[len(ia) // 2], 2),
            "fajr_june_min": round(min(m["fajr_angle"] for m in june), 2),
            "isha_june_min": round(min(m["isha_angle"] for m in june), 2),
            "days_isha_maghrib_plus90": ninety,
            "rows": len(meas),
        }
        s = summary[city]
        print(f"{city:13s} lat={lat:6.2f} lon={lon:7.2f} rms={rms:4.2f} "
              f"off[s={off_s:5.2f} d={off_d:5.2f} m={off_m:5.2f}] "
              f"fajrW={s['fajr_winter_med']:5.2f} ishaW={s['isha_winter_med']:5.2f} "
              f"fajrJunMin={s['fajr_june_min']:6.2f} isha+90days={ninety:3d}")
    json.dump(summary, open("data/ifi_city_fits.json", "w"), indent=1, sort_keys=True)


if __name__ == "__main__":
    main()
