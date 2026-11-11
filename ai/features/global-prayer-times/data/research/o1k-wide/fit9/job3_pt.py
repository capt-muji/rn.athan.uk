"""Job 3: Portugal - fit lisboa (38.7223, -9.1393, Europe/Lisbon) across the FULL held
span (2023, 2026, 2027 - one recipe) with the stated rule:
  isha = 12 deg + 3 min (labelled column; 2026/2027 editions only)
  isha_alt = maghrib + 77 (the 01:20 interval column; in 2023 it is the only isha)
  dhuhr = solar noon + 5, maghrib = sunset + 3, fajr = 18 deg, sunrise = raw horizon,
  asr school fitted.
Frames: (a) absolute at the given coordinates; (b) zawal-anchored (publisher's own noon
per day, latitude fitted per edition) - the engine-free frame the stability claim needs.
"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9"))
import solar
from kit import mins, rel, tzoff, load_dated, score_hist

BASE = os.path.expanduser("~/athan-gitree/census/o1k-wide/iberia2/data")
TZ = "Europe/Lisbon"
LAT, LON = 38.7223, -9.1393
YEARS = (2023, 2026, 2027)
out = {"coords": [LAT, LON], "tz": TZ, "years": list(YEARS)}
data = {y: load_dated(f"{BASE}/pt-lisboa-{y}.json") for y in YEARS}
rows_all = {}
for y in YEARS:
    rows_all.update(data[y])


def raw(dt, lat, lon, angle, rising):
    t = solar.time_at_angle(dt, lat, lon, angle, rising)
    return None if t is None else t + tzoff(dt, TZ)


def sunset(dt, lat=LAT, lon=LON):
    return solar.sunrise_sunset(dt, lat, lon)[1] + tzoff(dt, TZ)


def sunrise(dt, lat=LAT, lon=LON):
    return solar.sunrise_sunset(dt, lat, lon)[0] + tzoff(dt, TZ)


def noon(dt, lon=LON):
    return solar.transit_minutes(dt, lon) + tzoff(dt, TZ)


def asr_f(dt, lat=LAT, lon=LON, factor=1):
    return solar.asr(dt, lat, lon, factor) + tzoff(dt, TZ)


# ---------- frame (a): absolute at the given coordinates ----------
margins_abs = {}
def margin(col, compute, years=YEARS):
    res = []
    for y in years:
        for dt, v in sorted(data[y].items()):
            if col not in v:
                continue
            c = compute(dt)
            if c is None:
                continue
            res.append(rel(mins(v[col]), c % 1440))
    mu = sum(res) / len(res)
    return {"n": len(res), "mean": round(mu, 2),
            "rms": round((sum((x - mu) ** 2 for x in res) / len(res)) ** 0.5, 2),
            "min": round(min(res), 2), "max": round(max(res), 2)}


margins_abs["fajr_18"] = margin("fajr", lambda dt: raw(dt, LAT, LON, 18.0, True))
margins_abs["sunrise"] = margin("sunrise", sunrise)
margins_abs["dhuhr_noon"] = margin("dhuhr", noon)
margins_abs["asr_shafi"] = margin("asr", asr_f)
margins_abs["asr_hanafi"] = margin("asr", lambda dt: asr_f(dt, factor=2))
margins_abs["magrib_sunset"] = margin("magrib", sunset)
margins_abs["isha12_plus3"] = margin("isha", lambda dt: (lambda r: r + 3 if r is not None else None)(raw(dt, LAT, LON, 12.0, False)), years=(2026, 2027))
margins_abs["interval_plus77"] = margin("isha_alt", lambda dt: sunset(dt) + 77, years=(2026, 2027))
margins_abs["isha2023_as_interval"] = margin("isha", lambda dt: sunset(dt) + 77, years=(2023,))
print("absolute margins (stated integers):")
for k, v in margins_abs.items():
    print(f"  {k:22s} {v}")
out["absolute_margins"] = margins_abs

# free-angle confirmation over the span (angle column only)
best = None
x = 10.0
while x <= 16.0 + 1e-9:
    res = []
    for y in (2026, 2027):
        for dt, v in data[y].items():
            r = raw(dt, LAT, LON, x, False)
            if r is None:
                res = None
                break
            res.append(rel(mins(v["isha"]), r % 1440))
        if res is None:
            break
    if res:
        mu = sum(res) / len(res)
        rr = (sum((z - mu) ** 2 for z in res) / len(res)) ** 0.5
        if best is None or rr < best[1]:
            best = (x, rr, mu)
    x += 0.02
out["isha_free_angle_abs"] = {"angle": round(best[0], 2), "rms": round(best[1], 2), "bias": round(best[2], 2)}
print("isha free angle (abs frame, 2026+2027):", out["isha_free_angle_abs"])

best = None
x = 15.0
while x <= 21.0 + 1e-9:
    res = [rel(mins(v["fajr"]), raw(dt, LAT, LON, x, True) % 1440)
           for y in YEARS for dt, v in data[y].items()]
    mu = sum(res) / len(res)
    rr = (sum((z - mu) ** 2 for z in res) / len(res)) ** 0.5
    if best is None or rr < best[1]:
        best = (x, rr, mu)
    x += 0.02
out["fajr_free_angle_abs"] = {"angle": round(best[0], 2), "rms": round(best[1], 2), "bias": round(best[2], 2)}
print("fajr free angle (abs frame):", out["fajr_free_angle_abs"])


# ---------- frame (b): zawal-anchored ----------
def anchored(y, lat):
    """Per-day effective longitude from the printed zawal (dhuhr - 5); returns margins."""
    rows = data[y]
    acc = {}
    eff = {}
    for dt, v in sorted(rows.items()):
        dst = tzoff(dt, TZ)
        z = mins(v["dhuhr"]) - 5
        lon_eff = (720 - solar.decl_eot(dt)[1] - (z - dst)) / 4.0
        eff[dt] = lon_eff
        acc.setdefault("zawal_vs_noon", []).append(z - (solar.transit_minutes(dt, lon_eff) + dst))
        acc.setdefault("dhuhr_m_zawal", []).append(mins(v["dhuhr"]) - z)
        acc.setdefault("sunrise", []).append(mins(v["sunrise"]) - (sunrise(dt, lat, lon_eff)))
        acc.setdefault("magrib", []).append(mins(v["magrib"]) - (sunset(dt, lat, lon_eff)))
        acc.setdefault("asr_shafi", []).append(mins(v["asr"]) - (asr_f(dt, lat, lon_eff, 1)))
        f = raw(dt, lat, lon_eff, 18.0, True)
        acc.setdefault("fajr18", []).append(None if f is None else mins(v["fajr"]) - f)
        if "isha_alt" in v:
            i12 = raw(dt, lat, lon_eff, 12.0, False)
            acc.setdefault("isha12p3", []).append(None if i12 is None else mins(v["isha"]) - (i12 + 3))
            acc.setdefault("interval", []).append(mins(v["isha_alt"]) - mins(v["magrib"]))
        else:
            acc.setdefault("interval", []).append(mins(v["isha"]) - mins(v["magrib"]))
    res = {}
    for name, xs in acc.items():
        xs2 = sorted(x for x in xs if x is not None)
        mu = sum(xs2) / len(xs2)
        res[name] = {"n": len(xs2), "median": round(xs2[len(xs2) // 2], 2), "mean": round(mu, 2),
                     "sd": round((sum((x - mu) ** 2 for x in xs2) / len(xs2)) ** 0.5, 2),
                     "min": round(xs2[0], 2), "max": round(xs2[-1], 2)}
    return res


def fit_lat_anchored(y):
    best = None
    lat = 36.0
    while lat <= 43.0:
        rz, rn, ra = [], [], []
        for dt, v in data[y].items():
            dst = tzoff(dt, TZ)
            z = mins(v["dhuhr"]) - 5
            lon_eff = (720 - solar.decl_eot(dt)[1] - (z - dst)) / 4.0
            rz.append(z - (solar.transit_minutes(dt, lon_eff) + dst))
            rn.append(mins(v["sunrise"]) - (sunrise(dt, lat, lon_eff)))
            ra.append(mins(v["asr"]) - (asr_f(dt, lat, lon_eff, 1)))
        key = sum((x - sum(rz) / len(rz)) ** 2 for x in rz) \
            + sum((x - sum(rn) / len(rn)) ** 2 for x in rn) \
            + sum((x - sum(ra) / len(ra)) ** 2 for x in ra)
        if best is None or key < best[0]:
            best = (key, lat)
        lat += 0.02
    return best[1]


anch = {}
for y in YEARS:
    lat = fit_lat_anchored(y)
    anch[str(y)] = anchored(y, lat)
    anch[str(y)]["fitted_lat"] = round(lat, 2)
    print(f"anchored {y}: lat {lat:.2f} " +
          " ".join(f"{k}={v['median']:+.2f}(sd{v['sd']:.2f})"
                   for k, v in anch[str(y)].items() if isinstance(v, dict)))
out["anchored_margins"] = anch

stab = {}
for c in ("zawal_vs_noon", "dhuhr_m_zawal", "sunrise", "magrib", "asr_shafi", "fajr18", "isha12p3", "interval"):
    per = {str(y): anch[str(y)][c]["median"] for y in YEARS if c in anch[str(y)]}
    vals = list(per.values())
    stab[c] = {"median_by_year": per,
               "max_delta_2023_to_2027": round(max(vals) - min(vals), 3) if len(vals) >= 2 else None}
out["stability_2023_to_2027"] = stab
print("stability (median deltas):", json.dumps(stab, indent=1))

# ---------- scores ----------
def compute_abs(col):
    return {
        "fajr": lambda dt: raw(dt, LAT, LON, 18.0, True),
        "sunrise": sunrise,
        "dhuhr": lambda dt: noon(dt) + 5,
        "asr": asr_f,
        "magrib": lambda dt: sunset(dt) + 3,
        "isha": lambda dt: (lambda r: r + 3 if r is not None else None)(raw(dt, LAT, LON, 12.0, False)),
        "isha_alt": lambda dt: sunset(dt) + 80,  # 01:20 label = printed maghrib (+3) + 77
    }[col]


ed = {}
for y in YEARS:
    rows = data[y]
    per = {}
    for col in ("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha", "isha_alt"):
        if col == "isha_alt":
            per[col] = score_hist(rows, LAT, LON, TZ, "isha", compute_abs("isha_alt")) if y == 2023 else \
                score_hist(rows, LAT, LON, TZ, "isha_alt", compute_abs("isha_alt"))
        elif col == "isha" and y == 2023:
            continue  # no 12-degree column in 2023
        else:
            per[col] = score_hist(rows, LAT, LON, TZ, col, compute_abs(col))
    ed[str(y)] = per
    print(f"{y} absolute:", {c: f"{p['exact']}/{p['n']}(w{p['worst']})" for c, p in per.items()})
out["per_edition_scores_absolute"] = ed

span_scores = {}
for col in ("fajr", "sunrise", "dhuhr", "asr", "magrib"):
    span_scores[col] = score_hist(rows_all, LAT, LON, TZ, col, compute_abs(col))
out["span_scores_absolute"] = span_scores
print("span absolute:", {c: f"{v['exact']}/{v['n']}(w{v['worst']})" for c, v in span_scores.items()})

# ---------- seasonal amplitude + span ----------
amp = {}
for col, rising, ang in (("fajr", True, 18.0), ("isha", False, 12.0)):
    vals = {}
    for y in (2026, 2027):
        for dt, v in data[y].items():
            if col == "isha" and "isha_alt" not in v:
                continue
            r = raw(dt, LAT, LON, ang, rising)
            if r is not None:
                vals[dt] = r % 1440
    jan15 = vals.get(solar.date(2026, 1, 15))
    jul = [v for d, v in vals.items() if d.month == 7]
    amp[col] = {"exists_days": len(vals), "jan15": round(jan15, 1) if jan15 else None,
                "jul_min": round(min(jul), 1) if jul else None,
                "year_min": round(min(vals.values()), 1), "year_max": round(max(vals.values()), 1),
                "amplitude": round(max(vals.values()) - min(vals.values()), 1)}
out["amplitude"] = amp
out["span_days"] = len(rows_all)
print("amplitude:", json.dumps(amp))
print("span days:", len(rows_all))

json.dump(out, open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/job3_pt.json"), "w"), indent=1)
print("job3_pt.json written")
