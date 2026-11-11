"""Measure the IFI tables against published city coordinates: solar-column
residual (is the table a plain solar computation at that place?) and the
implied twilight depression angles day by day."""
import json, glob, os, sys, math
from datetime import date
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import solar

COORDS = {
    "dublin": (53.3498, -6.2603), "cork": (51.8985, -8.4756),
    "limerick": (52.6638, -8.6267), "waterford": (52.2592, -7.1101),
    "galway": (53.2707, -9.0568), "drogheda": (53.7179, -6.3561),
    "dundalk": (54.0090, -6.4049), "kilkenny": (52.6541, -7.2448),
    "sligo": (54.2766, -8.4761), "athlone": (53.4239, -7.9407),
    "ennis": (52.8436, -8.9864), "tralee": (52.2713, -9.7017),
    "wexford": (52.3369, -6.4633), "navan": (53.6528, -6.6813),
    "carlow": (52.8364, -6.9341), "portlaoise": (53.0341, -7.2994),
    "mullingar": (53.5254, -7.3387), "cavan": (53.9908, -7.3606),
    "ballyhaunis": (53.7553, -8.7622), "castlebar": (53.8567, -9.2994),
    "naas": (53.2158, -6.6669), "thurles": (52.6803, -7.8153),
    "clonmel": (52.3550, -7.7039), "letterkenny": (54.9500, -7.7333),
    "longford": (53.7272, -7.7938), "tullamore": (53.2739, -7.4889),
}
HORIZON = -0.833


def tz_offset(d):
    return 60 if (3, 29) <= (d.month, d.day) < (10, 25) else 0


def event(d, lon, lat, altitude, morning):
    decl, eot = solar._sun(solar._julian_day(d))
    noon = 720.0 - 4.0 * lon - eot
    cos_h = ((math.sin(altitude * solar.RAD) - math.sin(lat * solar.RAD) * math.sin(decl * solar.RAD))
             / (math.cos(lat * solar.RAD) * math.cos(decl * solar.RAD)))
    if abs(cos_h) > 1:
        return None
    h = math.degrees(math.acos(cos_h))
    return noon - 4.0 * h if morning else noon + 4.0 * h


def main():
    out = {}
    for path in sorted(glob.glob("data/ifi_*_2026.json")):
        if "printed" in path:
            continue
        city = os.path.basename(path).replace("ifi_", "").replace("_2026.json", "")
        if city not in COORDS:
            continue
        lat, lon = COORDS[city]
        rows = json.load(open(path))
        res, per_day = [], []
        for iso, rec in sorted(rows.items()):
            d = date.fromisoformat(iso)
            tz = tz_offset(d)
            sr = event(d, lon, lat, HORIZON, True)
            mg = event(d, lon, lat, HORIZON, False)
            noon = solar.solar_noon_utc(d, lon)
            r_sr = solar.hhmm(rec["sunrise"]) - tz - sr
            r_dh = solar.hhmm(rec["dhuhr"]) - tz - noon
            r_mg = solar.hhmm(rec["maghrib"]) - tz - mg
            res += [r_sr, r_dh, r_mg]
            per_day.append({
                "date": iso, "month": d.month, "day": d.day,
                "sunrise_res": r_sr, "dhuhr_res": r_dh, "maghrib_res": r_mg,
                "fajr_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["fajr"]) - tz),
                "isha_angle": -solar.altitude(d, lon, lat, solar.hhmm(rec["isha"]) - tz),
                "isha_minus_maghrib": solar.hhmm(rec["isha"]) - solar.hhmm(rec["maghrib"]),
            })
        rms = (sum(r * r for r in res) / len(res)) ** 0.5
        winter = [p for p in per_day if p["month"] in (1, 2, 11, 12)]
        fw = sorted(p["fajr_angle"] for p in winter)
        iw = sorted(p["isha_angle"] for p in winter)
        flat = [p for p in per_day if abs(p["isha_minus_maghrib"] - 90) <= 1]
        out[city] = {
            "lat": lat, "lon": lon, "solar_rms_min": round(rms, 2),
            "sunrise_res_med": round(sorted(p["sunrise_res"] for p in per_day)[len(per_day) // 2], 2),
            "dhuhr_res_med": round(sorted(p["dhuhr_res"] for p in per_day)[len(per_day) // 2], 2),
            "maghrib_res_med": round(sorted(p["maghrib_res"] for p in per_day)[len(per_day) // 2], 2),
            "fajr_winter_med": round(fw[len(fw) // 2], 2),
            "fajr_winter_p10": round(fw[len(fw) // 10], 2),
            "fajr_winter_p90": round(fw[9 * len(fw) // 10], 2),
            "isha_winter_med": round(iw[len(iw) // 2], 2),
            "isha_plus90_days": len(flat),
            "isha_plus90_first": flat[0]["date"] if flat else None,
            "isha_plus90_last": flat[-1]["date"] if flat else None,
            "rows": len(per_day),
        }
        json.dump(per_day, open(f"data/ifi_{city}_2026_measured.json", "w"), indent=0)
        s = out[city]
        print(f"{city:13s} rms={rms:4.2f} res[sr={s['sunrise_res_med']:5.1f} dh={s['dhuhr_res_med']:5.1f} "
              f"mg={s['maghrib_res_med']:5.1f}] fajrW={s['fajr_winter_med']:5.2f} "
              f"[{s['fajr_winter_p10']:5.2f}-{s['fajr_winter_p90']:5.2f}] ishaW={s['isha_winter_med']:5.2f} "
              f"isha+90={s['isha_plus90_days']:3d}d {s['isha_plus90_first']}..{s['isha_plus90_last']}")
    json.dump(out, open("data/ifi_city_measured.json", "w"), indent=1, sort_keys=True)


if __name__ == "__main__":
    main()
