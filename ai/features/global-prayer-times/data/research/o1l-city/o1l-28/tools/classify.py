#!/usr/bin/env python3
"""classify.py <tag> <data-file> <lat> <lng> — implied twilight depression per side, FORM-MAP style."""
import json, math, sys, datetime, zoneinfo

tz = zoneinfo.ZoneInfo("Europe/London")
rad = math.pi / 180

def solar_altitude(dt_utc, lat, lng):
    doy = dt_utc.timetuple().tm_yday
    frac = (dt_utc.hour * 60 + dt_utc.minute) / 1440
    g = 2 * math.pi / 365 * (doy - 1 + frac)
    eot = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g)
                    - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g)
            - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g)) / rad
    tst = (dt_utc.hour * 60 + dt_utc.minute + eot + 4 * lng) % 1440
    ha = (tst / 4 - 180)
    alt = math.asin(math.sin(lat * rad) * math.sin(decl * rad)
                    + math.cos(lat * rad) * math.cos(decl * rad) * math.cos(ha * rad)) / rad
    return alt

def stat(v):
    m = sum(v) / len(v)
    sd = math.sqrt(sum((x - m) ** 2 for x in v) / len(v))
    return {"mean": round(m, 2), "sd": round(sd, 2), "min": round(min(v), 2), "max": round(max(v), 2)}

def main():
    tag, path, lat, lng = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
    payload = json.load(open(path))
    rows = payload.get("rows", payload)
    months = {}
    for date, r in sorted(rows.items()):
        if not r.get("fajr") or not r.get("isha"):
            continue
        try:
            d = datetime.date.fromisoformat(date)
        except ValueError:
            continue
        def alt(hhmm):
            h, m = map(int, hhmm.split(":")[:2])
            local = datetime.datetime(d.year, d.month, d.day, h % 24, m, tzinfo=tz)
            return solar_altitude(local.astimezone(datetime.timezone.utc), lat, lng)
        months.setdefault(date[:7], []).append((-alt(r["fajr"]), -alt(r["isha"])))
    out = {"tag": tag, "days": sum(len(v) for v in months.values()), "months": {}}
    for m, arr in sorted(months.items()):
        out["months"][m] = {"fajrDep": stat([x[0] for x in arr]),
                            "ishaDep": stat([x[1] for x in arr])}
    core = [x for m in ("2025-11", "2025-12", "2026-01", "2026-02", "2026-11", "2026-12")
            for x in months.get(m, [])]
    if core:
        out["core"] = {"days": len(core), "fajr": stat([x[0] for x in core]),
                       "isha": stat([x[1] for x in core])}
    jan = [x[0] for x in months.get("2026-01", [])]
    jul = [x[0] for x in months.get("2026-07", [])]
    out["amplitude"] = ({"jan": stat(jan)["mean"], "jul": stat(jul)["mean"]} if jan and jul else None)
    print(json.dumps(out))

if __name__ == "__main__":
    main()
