"""Job 1: Netherlands - verify the stated VIN consensus (fajr 18deg + 03:30 floor,
isha 17deg + 23:30 cap) at three cities across ALL years held (2025+2026, one span).
Coordinates as ordered: Amsterdam 52.3702,4.8952; Rotterdam 51.9244,4.4777;
Utrecht 52.0907,5.1214; zone Europe/Amsterdam.
"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9"))
import solar
from kit import mins, rmin, floor_min, tzoff, local, load_dated, score_hist, fit_angle, season_amplitude

BASE = os.path.expanduser("~/athan-gitree/census/o1k-wide/benelux2/data")
TZ = "Europe/Amsterdam"
CITIES = {"amsterdam": (52.3702, 4.8952), "rotterdam": (51.9244, 4.4777),
          "utrecht": (52.0907, 5.1214)}
FAJR_CAP, ISHA_CAP = 3 * 60 + 30, 23 * 60 + 30
out = {"recipe": {"fajr": "18 deg rising, floored at 03:30 local",
                  "isha": "17 deg setting, capped at 23:30 local"}}


def nl_fajr(dt, lat, lon):
    t = solar.time_at_angle(dt, lat, lon, 18.0, True)
    raw = None if t is None else t + tzoff(dt, TZ)
    return FAJR_CAP if raw is None else max(raw, FAJR_CAP) % 1440


def nl_isha(dt, lat, lon):
    t = solar.time_at_angle(dt, lat, lon, 17.0, False)
    raw = None if t is None else t + tzoff(dt, TZ)
    return ISHA_CAP if raw is None else min(raw, ISHA_CAP) % 1440


def city_report(city, lat, lon):
    rows_all = {}
    for year in (2025, 2026):
        rows_all.update(load_dated(f"{BASE}/nl-{city}-{year}.json"))
    r = {"years": {}, "span": {}, "caps": {}, "free_angle_fit": {}, "amplitude": {}}
    for col, comp in (("fajr", lambda dt: nl_fajr(dt, lat, lon)),
                      ("isha", lambda dt: nl_isha(dt, lat, lon))):
        full = score_hist(rows_all, lat, lon, TZ, col, comp)
        r["span"][col] = full
        for year in (2025, 2026):
            rows = load_dated(f"{BASE}/nl-{city}-{year}.json")
            r["years"].setdefault(str(year), {})[col] = score_hist(rows, lat, lon, TZ, col, comp)
        # cap-bind days: printed at cap, and uncapped computed breaching
        printed = sorted(dt for dt, v in rows_all.items() if mins(v[col]) == (FAJR_CAP if col == "fajr" else ISHA_CAP))
        breach = []
        for dt in sorted(rows_all):
            t = solar.time_at_angle(dt, lat, lon, 18.0 if col == "fajr" else 17.0, col == "fajr")
            c = local(t, dt, TZ) if t is not None else None
            if c is None or (c < FAJR_CAP if col == "fajr" else c > ISHA_CAP):
                breach.append(str(dt))
        r["caps"][col] = {"printed_at_cap": len(printed),
                          "printed_span": [str(printed[0]), str(printed[-1])] if printed else None,
                          "computed_bind": len(breach),
                          "computed_span": [breach[0], breach[-1]] if breach else None}
        # free-angle fit on non-cap days only
        noncap = {dt: v for dt, v in rows_all.items() if mins(v[col]) != (FAJR_CAP if col == "fajr" else ISHA_CAP)}
        a, rms, bias = fit_angle(noncap, lat, lon, TZ, col, col == "fajr", 15.5, 19.5)
        r["free_angle_fit"][col] = {"angle": round(a, 2), "rms": round(rms, 2), "bias": round(bias, 2),
                                    "days": len(noncap)}
        r["amplitude"][col] = season_amplitude(rows_all, lat, lon, TZ, col, col == "fajr",
                                               18.0 if col == "fajr" else 17.0)
    # rounding-convention check on all six columns, full span
    conv = {}
    for col in ("fajr", "sunrise", "dhuhr", "asr", "isha"):
        rising = col in ("fajr", "sunrise")
        ang = {"fajr": 18.0, "isha": 17.0}.get(col)
        near = floor_ = 0
        for dt, v in rows_all.items():
            if ang is not None:
                t = solar.time_at_angle(dt, lat, lon, ang, rising)
                if t is None or mins(v[col]) == (FAJR_CAP if col == "fajr" else ISHA_CAP):
                    continue
            elif col == "sunrise":
                t = solar.sunrise_sunset(dt, lat, lon)[0]
            elif col == "dhuhr":
                t = solar.transit_minutes(dt, lon)
            else:
                t = solar.asr(dt, lat, lon)
            c = local(t, dt, TZ)
            p = mins(v[col])
            near += p == rmin(c)
            floor_ += p == floor_min(c)
        conv[col] = {"nearest": near, "floor": floor_}
    r["rounding_convention"] = conv
    return r


for city, (lat, lon) in CITIES.items():
    out[city] = city_report(city, lat, lon)
    c = out[city]
    print(f"{city}: span fajr exact {c['span']['fajr']['exact']}/{c['span']['fajr']['n']} "
          f"within1 {c['span']['fajr']['within1']} worst {c['span']['fajr']['worst']} | "
          f"isha exact {c['span']['isha']['exact']}/{c['span']['isha']['n']} "
          f"within1 {c['span']['isha']['within1']} worst {c['span']['isha']['worst']}")
    print(f"  caps fajr printed {c['caps']['fajr']['printed_at_cap']} computed {c['caps']['fajr']['computed_bind']} "
          f"span {c['caps']['fajr']['computed_span']} | isha printed {c['caps']['isha']['printed_at_cap']} "
          f"computed {c['caps']['isha']['computed_bind']} span {c['caps']['isha']['computed_span']}")
    print(f"  free fit fajr {c['free_angle_fit']['fajr']} isha {c['free_angle_fit']['isha']}")
    print(f"  rounding {c['rounding_convention']}")

json.dump(out, open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/job1_nl.json"), "w"), indent=1)
print("job1_nl.json written")
