"""Derive each IFI city table's own coordinates from its solar columns, then
measure the implied twilight depression angles across the whole held year."""
import json, glob, os, sys
from datetime import date
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import solar

HORIZON = -0.833  # standard refraction + solar semi-diameter


def load(city):
    return json.load(open(f"data/ifi_{city}_2026.json"))


def tz_offset(d):
    """Real Europe/Dublin offsets for 2026: BST 29 Mar - 25 Oct inclusive of start."""
    if (d.month, d.day) >= (3, 29) and (d.month, d.day) < (10, 25):
        return 60
    return 0


def day_minutes(rec):
    return {k: solar.hhmm(v) for k, v in rec.items()}


def sun_event(d, lon, lat, altitude, morning):
    """Minutes UTC when the sun crosses `altitude`, by bisection on the hour angle."""
    decl, eot = solar._sun(solar._julian_day(d))
    noon = 720.0 - 4.0 * lon - eot
    lo, hi = 0.0, 720.0
    for _ in range(40):
        mid = (lo + hi) / 2
        a = solar.altitude(d, lon, lat, noon + (mid if not morning else -mid))
        if morning:
            if a > altitude:
                lo = mid
            else:
                hi = mid
        else:
            if a > altitude:
                lo = mid
            else:
                hi = mid
    return noon - mid if morning else noon + mid


def solar_error(city_rows, lat, lon):
    tot, n = 0.0, 0
    for iso, rec in city_rows.items():
        d = date.fromisoformat(iso)
        m = day_minutes(rec)
        off = tz_offset(d)
        tot += abs(sun_event(d, lon, lat, HORIZON, True) + off - m["sunrise"])
        tot += abs(sun_event(d, lon, lat, HORIZON, False) + off - m["maghrib"])
        n += 2
    return tot / n


def derive_coords(city_rows):
    days = sorted(city_rows)
    sample = {iso: city_rows[iso] for iso in days[::10]}
    # longitude from solar noon
    res = []
    for iso, rec in sample.items():
        d = date.fromisoformat(iso)
        m = day_minutes(rec)
        noon_utc = solar.solar_noon_utc(d, 0.0)
        res.append(m["dhuhr"] - tz_offset(d) - noon_utc)
    res.sort()
    lon = -res[len(res) // 2] / 4.0
    best = None
    for lat10 in range(500, 560):
        lat = lat10 / 10.0
        err = solar_error(sample, lat, lon)
        if best is None or err < best[0]:
            best = (err, lat)
    lat = best[1]
    for lat100 in range(int(lat * 100) - 10, int(lat * 100) + 11):
        cand = lat100 / 100.0
        err = solar_error(sample, cand, lon)
        if err < best[0]:
            best = (err, cand)
    lat = best[1]
    return lat, lon, best[0]


def measure(city_rows, lat, lon):
    """Implied depression angle per day for fajr and isha, plus column margins."""
    out = []
    for iso, rec in sorted(city_rows.items()):
        d = date.fromisoformat(iso)
        m = day_minutes(rec)
        off = tz_offset(d)
        fajr_alt = solar.altitude(d, lon, lat, m["fajr"] - off)
        isha_alt = solar.altitude(d, lon, lat, m["isha"] - off)
        noon = solar.solar_noon_utc(d, lon)
        out.append({
            "date": iso, "month": d.month,
            "fajr_angle": -fajr_alt, "isha_angle": -isha_alt,
            "dhuhr_margin": m["dhuhr"] - off - noon,
            "asr_min": m["asr"], "maghrib_margin": m["maghrib"] - off - solar.solar_noon_utc(d, lon),
        })
    return out


def main():
    summary = {}
    for path in sorted(glob.glob("data/ifi_*_2026.json")):
        if "printed" in path:
            continue
        city = os.path.basename(path).replace("ifi_", "").replace("_2026.json", "")
        rows = load(city)
        lat, lon, err = derive_coords(rows)
        meas = measure(rows, lat, lon)
        winter = [r for r in meas if r["month"] in (1, 2, 11, 12)]
        summer = [r for r in meas if r["month"] in (5, 6, 7)]
        fa = sorted(r["fajr_angle"] for r in winter)
        ia = sorted(r["isha_angle"] for r in winter)
        summary[city] = {
            "lat": round(lat, 2), "lon": round(lon, 2), "solar_rms_min": round(err, 2),
            "fajr_winter_median": round(fa[len(fa) // 2], 2),
            "isha_winter_median": round(ia[len(ia) // 2], 2),
            "fajr_summer_min": round(min(r["fajr_angle"] for r in summer), 2),
            "isha_summer_min": round(min(r["isha_angle"] for r in summer), 2),
            "rows": len(meas),
        }
        print(f"{city:14s} lat={lat:6.2f} lon={lon:7.2f} solar_err={err:5.2f}min "
              f"fajrW={summary[city]['fajr_winter_median']:5.2f} ishaW={summary[city]['isha_winter_median']:5.2f} "
              f"fajrSumMin={summary[city]['fajr_summer_min']:6.2f} ishaSumMin={summary[city]['isha_summer_min']:6.2f}")
    json.dump(summary, open("data/ifi_city_coords.json", "w"), indent=1, sort_keys=True)


if __name__ == "__main__":
    main()
