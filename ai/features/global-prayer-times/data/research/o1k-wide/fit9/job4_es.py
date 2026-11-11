"""Job 4: Spain - does Madrid's CCIM recipe (fajr 18.25+1, sunrise -2, dhuhr noon+1,
asr Shafi+1, maghrib sunset+2, isha 17+1) hold across Granada (502 rows, hijri 1447
complete + 1448 to 2026-11-10) and Malaga (30-row poster, 2026-11)?
Granada prints Shuruq where Madrid prints sunrise (Granada's own convention is
sunrise+5 per the capture report); scored under the recipe and under its own reading.
Coordinates: Granada 37.1773,-3.5986; Malaga 36.7213,-4.4213; Europe/Madrid.
"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9"))
import solar
from kit import mins, rel, tzoff, load_dated, load_dated_list, score_hist, score

BASE = os.path.expanduser("~/athan-gitree/census/o1k-wide/iberia2/data")
TZ = "Europe/Madrid"
REC = {"fajr": (18.25, 1), "isha": (17.0, 1), "shuruq": (-2.0, 0),
       "dhuhr": (1.0,), "asr": (1.0,), "maghrib": (2.0,)}
out = {"recipe": "fajr 18.25deg+1, sunrise -2 (Granada column: shuruq), dhuhr noon+1, "
                 "asr Shafi+1, maghrib sunset+2, isha 17deg+1", "zone": TZ}

GCOLS = ["fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"]


def comp_city(lat, lon):
    def comp(col):
        return {
            "fajr": lambda dt: (lambda t: t + 1 if t is not None else None)(
                (lambda r: r + tzoff(dt, TZ))(solar.time_at_angle(dt, lat, lon, 18.25, True))),
            "isha": lambda dt: (lambda t: t + 1 if t is not None else None)(
                (lambda r: r + tzoff(dt, TZ))(solar.time_at_angle(dt, lat, lon, 17.0, False))),
            "shuruq_recipe": lambda dt: (lambda t: t - 2 if t is not None else None)(
                (lambda r: r + tzoff(dt, TZ))(solar.sunrise_sunset(dt, lat, lon)[0])),
            "shuruq_own": lambda dt: (lambda t: t + 5 if t is not None else None)(
                (lambda r: r + tzoff(dt, TZ))(solar.sunrise_sunset(dt, lat, lon)[0])),
            "dhuhr": lambda dt: solar.transit_minutes(dt, lon) + 1 + tzoff(dt, TZ),
            "asr": lambda dt: solar.asr(dt, lat, lon, 1) + 1 + tzoff(dt, TZ),
            "maghrib": lambda dt: solar.sunrise_sunset(dt, lat, lon)[1] + 2 + tzoff(dt, TZ),
        }[col]
    return comp


def free_margins(rows, lat, lon, cols=("fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha")):
    """Mean margin of each column against the plain solar model (no recipe margins)."""
    res = {}
    for col in cols:
        for dt in sorted(rows):
            if col in ("fajr",):
                t = solar.time_at_angle(dt, lat, lon, 18.0, True)
            elif col == "isha":
                t = solar.time_at_angle(dt, lat, lon, 17.0, False)
            elif col in ("shuruq", "sunrise"):
                t = solar.sunrise_sunset(dt, lat, lon)[0]
            elif col == "dhuhr":
                t = solar.transit_minutes(dt, lon)
            elif col == "asr":
                t = solar.asr(dt, lat, lon, 1)
            else:
                t = solar.sunrise_sunset(dt, lat, lon)[1]
            if t is None:
                continue
            vals = res.setdefault(col, [])
            vals.append(rel(mins(rows[dt][col]), (t + tzoff(dt, TZ)) % 1440))
    out2 = {}
    for col, vals in res.items():
        mu = sum(vals) / len(vals)
        out2[col] = {"mean": round(mu, 2),
                     "rms": round((sum((x - mu) ** 2 for x in vals) / len(vals)) ** 0.5, 2)}
    return out2


comp = comp_city(37.1773, -3.5986)
g_all = {}
for hy, start in (("1447", 2025), ("1448", 2026)):
    rows = load_dated_list(f"{BASE}/es-granada-hijri{hy}.json", GCOLS)
    g_all.update(rows)
    per = {}
    for col in GCOLS:
        key = "shuruq_recipe" if col == "shuruq" else col
        per[col] = score_hist(rows, 37.1773, -3.5986, TZ, col, comp(key))
    out[f"granada_{hy}"] = {"rows": len(rows), "scores": per,
                            "free_margins": free_margins(rows, 37.1773, -3.5986)}
    print(f"granada {hy} ({len(rows)} rows):",
          {c: f"{p['exact']}/{p['n']}(w{p['worst']})" for c, p in per.items()})
    print("   free margins:", out[f"granada_{hy}"]["free_margins"])
per = {}
for col in GCOLS:
    key = "shuruq_recipe" if col == "shuruq" else col
    per[col] = score_hist(g_all, 37.1773, -3.5986, TZ, col, comp(key))
out["granada_span"] = {"rows": len(g_all), "scores": per,
                       "free_margins": free_margins(g_all, 37.1773, -3.5986)}
print(f"granada span ({len(g_all)} rows):",
      {c: f"{p['exact']}/{p['n']}(w{p['worst']})" for c, p in per.items()})

# seasonal amplitude on the printed fajr/isha arc at Granada
amp = {}
for col, rising, ang in (("fajr", True, 18.0), ("isha", False, 17.0)):
    vals = {}
    for dt in g_all:
        t = solar.time_at_angle(dt, 37.1773, -3.5986, ang, rising)
        if t is not None:
            vals[dt] = (t + tzoff(dt, TZ)) % 1440
    jan15 = vals.get(solar.date(2026, 1, 15))
    jul = [v for d, v in vals.items() if d.month == 7]
    amp[col] = {"exists_days": len(vals), "jan15": round(jan15, 1) if jan15 else None,
                "jul_min": round(min(jul), 1) if jul else None,
                "amplitude": round(max(vals.values()) - min(vals.values()), 1)}
out["granada_amplitude"] = amp
print("granada amplitude:", json.dumps(amp))

# Malaga poster (keys: fajr, sunrise, dhuhr, asr, magrib, isha)
mrows = load_dated(f"{BASE}/es-malaga-2026-11.json")
comp_m = comp_city(36.7213, -4.4213)
mper = {}
for col in ("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"):
    if col == "sunrise":
        mper[col] = score_hist(mrows, 36.7213, -4.4213, TZ, col, comp_m("shuruq_recipe"))
    elif col == "magrib":
        mper[col] = score_hist(mrows, 36.7213, -4.4213, TZ, col, comp_m("maghrib"))
    else:
        mper[col] = score_hist(mrows, 36.7213, -4.4213, TZ, col, comp_m(col))
out["malaga"] = {"rows": len(mrows), "scores_recipe": mper,
                 "free_margins": free_margins(mrows, 36.7213, -4.4213,
                                              cols=("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"))}
print(f"malaga ({len(mrows)} rows) under Madrid recipe:",
      {c: f"{p['exact']}/{p['n']}(w{p['worst']})" for c, p in mper.items()})
print("   free margins:", out["malaga"]["free_margins"])

json.dump(out, open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/job4_es.json"), "w"), indent=1)
print("job4_es.json written")
