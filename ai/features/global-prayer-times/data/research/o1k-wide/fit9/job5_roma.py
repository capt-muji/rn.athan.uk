"""Job 5: Rome - Grand Mosque of Rome monthly poster (30 rows, 2026-11-11..2026-12-10).
Verify the held readings (fajr 19.1 deg, isha = maghrib + 90 exact) and fit every column
at 41.9028, 12.4964, Europe/Rome. State the asr school.
"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9"))
import solar
from kit import mins, rel, tzoff, load_dated, score_hist, score

BASE = os.path.expanduser("~/athan-gitree/census/o1k-wide/iberia2/data")
TZ = "Europe/Rome"
LAT, LON = 41.9028, 12.4964
rows = load_dated(f"{BASE}/it-roma-2026-11.json")
out = {"coords": [LAT, LON], "tz": TZ, "rows": len(rows),
       "span": [str(min(rows)), str(max(rows))]}


def raw(angle, rising, dt):
    t = solar.time_at_angle(dt, LAT, LON, angle, rising)
    return None if t is None else t + tzoff(dt, TZ)


def sunrise(dt):
    return solar.sunrise_sunset(dt, LAT, LON)[0] + tzoff(dt, TZ)


def sunset(dt):
    return solar.sunrise_sunset(dt, LAT, LON)[1] + tzoff(dt, TZ)


def noon(dt):
    return solar.transit_minutes(dt, LON) + tzoff(dt, TZ)


def asr_f(dt, factor):
    return solar.asr(dt, LAT, LON, factor) + tzoff(dt, TZ)


# held check: isha = maghrib + 90 exact
intervals = [mins(v["isha"]) - mins(v["magrib"]) for v in rows.values()]
out["isha_interval"] = {"values": sorted(set(intervals)), "all_90": set(intervals) == {90}}
print("isha - maghrib values:", out["isha_interval"])

# fajr free-angle fit, bias pinned at zero (one month cannot separate angle from bias)
best = None
x = 15.0
while x <= 23.0 + 1e-9:
    res = []
    for dt in sorted(rows):
        r = raw(x, True, dt)
        if r is None:
            res = None
            break
        res.append(rel(mins(rows[dt]["fajr"]), r % 1440))
    if res:
        rr = (sum(z * z for z in res) / len(res)) ** 0.5
        if best is None or rr < best[1]:
            best = (x, rr)
    x += 0.02
out["fajr_free_fit"] = {"angle": round(best[0], 2), "rms": round(best[1], 2), "bias": 0.0,
                        "note": "bias pinned at 0; one month cannot separate angle from bias"}
print("fajr free fit (bias 0):", out["fajr_free_fit"])

# per-column margins (plain solar model, no margins)
marg = {}
for col in ("fajr", "sunrise", "dhuhr", "asr", "magrib"):
    vals = []
    for dt in sorted(rows):
        if col == "fajr":
            c = raw(19.1, True, dt)
        elif col == "sunrise":
            c = sunrise(dt)
        elif col == "dhuhr":
            c = noon(dt)
        elif col == "asr":
            c = asr_f(dt, 1)
        else:
            c = sunset(dt)
        if c is None:
            continue
        vals.append(rel(mins(rows[dt][col]), c % 1440))
    mu = sum(vals) / len(vals)
    marg[col] = {"mean": round(mu, 2), "rms": round((sum((x - mu) ** 2 for x in vals) / len(vals)) ** 0.5, 2),
                 "min": round(min(vals), 2), "max": round(max(vals), 2)}
out["margins_vs_plain_model"] = marg
print("margins vs plain model:", json.dumps(marg, indent=1))

# asr school: Shafi vs Hanafi RMS over the poster
for school, factor in (("shafi", 1), ("hanafi", 2)):
    vals = [rel(mins(v["asr"]), asr_f(dt, factor) % 1440) for dt, v in sorted(rows.items())]
    mu = sum(vals) / len(vals)
    out.setdefault("asr_school", {})[school] = {
        "mean": round(mu, 2),
        "rms": round((sum((x - mu) ** 2 for x in vals) / len(vals)) ** 0.5, 2)}
print("asr school:", out["asr_school"])

# stated-rule scores (fajr 19.1, sunrise -1, dhuhr noon+1, asr Shafi+0, maghrib sunset+1,
# isha = maghrib + 90)
rule = {
    "fajr": lambda dt: (lambda c: c + 0 if c is not None else None)(raw(19.1, True, dt)),
    "sunrise": lambda dt: sunrise(dt) - 1,
    "dhuhr": lambda dt: noon(dt) + 1,
    "asr": lambda dt: asr_f(dt, 1),
    "magrib": lambda dt: sunset(dt) + 1,
    "isha": lambda dt: sunset(dt) + 1 + 90,
}
scores = {}
for col, comp in rule.items():
    scores[col] = score_hist(rows, LAT, LON, TZ, col, comp)
out["scores_stated_rule"] = scores
print("stated-rule scores:", {c: f"{p['exact']}/{p['n']}(w{p['worst']})" for c, p in scores.items()})

json.dump(out, open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/job5_roma.json"), "w"), indent=1)
print("job5_roma.json written")
