"""Job 2: Belgium - encode the EMB substitution-window rule and score ONE recipe
across both years (2025, 2026) at Brussels 50.8503, 4.3517 Europe/Brussels.

Rule (from the 2026 printed table):
  isha: outside 05-01..08-11 -> real-latitude 18 deg at Brussels;
        05-01..05-21 -> 23:26 flat; 07-26..08-11 -> 23:33 flat;
        05-22..07-25 (65 days) -> latitude-45 18 deg isha at Brussels longitude.
  fajr: outside 05-10..08-01 -> real-latitude 18 deg;
        05-10..05-30 -> 03:24 flat; 07-10..08-01 -> 03:24 flat;
        05-31..07-09 (40 days) -> middle arc (parameters fitted below).
"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9"))
import solar
from kit import mins, rmin, tzoff, load_dated, score_hist, rel

BASE = os.path.expanduser("~/athan-gitree/census/o1k-wide/benelux2/data")
TZ = "Europe/Brussels"
LAT, LON = 50.8503, 4.3517
out = {}


def raw(dt, lat, angle, rising):
    t = solar.time_at_angle(dt, lat, LON, angle, rising)
    return None if t is None else t + tzoff(dt, TZ)


def md(dt):
    return f"{dt.month:02d}-{dt.day:02d}"


# --- fit the middle fajr arc on 2026 data first (40 days 05-31..07-09) ---
# rule shape: arc floored at the plateau clock 03:24, i.e. fajr = min(arc, 03:24)
rows26 = load_dated(f"{BASE}/be-emb-bruxelles-2026.json")
mid = [dt for dt in rows26 if "05-31" <= md(dt) <= "07-09"]
PLAT = 3 * 60 + 24


def clamped_res(dt, lat, ang):
    r = raw(dt, lat, ang, True)
    if r is None:
        return None
    return rel(mins(rows26[dt]["fajr"]), min(r, PLAT) % 1440)


best = None
lat = 40.0
while lat <= 50.0:
    ang = 16.0
    while ang <= 24.0:
        res = [clamped_res(dt, lat, ang) for dt in mid]
        if None not in res:
            mu = sum(res) / len(res)
            rms = (sum((x - mu) ** 2 for x in res) / len(res)) ** 0.5
            if best is None or rms < best[0]:
                best = (rms, lat, ang, mu)
        ang += 0.1
    lat += 0.25
print(f"middle-fajr arc clamped free (lat,angle) fit: rms {best[0]:.2f} at lat {best[1]:.2f} "
      f"angle {best[2]:.1f} bias {best[3]:+.2f}")
out["middle_fajr_fit"] = {"rms": round(best[0], 2), "lat": best[1], "angle": best[2],
                          "bias": round(best[3], 2), "days": len(mid)}
best45 = None
ang = 16.0
while ang <= 24.0:
    res = [clamped_res(dt, 45.0, ang) for dt in mid]
    if None not in res:
        mu = sum(res) / len(res)
        rms = (sum((x - mu) ** 2 for x in res) / len(res)) ** 0.5
        if best45 is None or rms < best45[0]:
            best45 = (rms, ang, mu)
    ang += 0.02
print(f"middle-fajr arc at lat 45, angle free: rms {best45[0]:.2f} at angle {best45[1]:.2f} bias {best45[2]:+.2f}")
out["middle_fajr_fit_lat45"] = {"rms": round(best45[0], 2), "angle": round(best45[1], 2),
                                "bias": round(best45[2], 2)}
res18 = [clamped_res(dt, 45.0, 18.0) for dt in mid]
if None not in res18:
    mu = sum(res18) / len(res18)
    out["middle_fajr_at_lat45_18"] = {"rms": round((sum((x - mu) ** 2 for x in res18) / len(res18)) ** 0.5, 2),
                                      "bias": round(mu, 2)}
    print(f"middle-fajr at lat45 18deg clamped: rms {out['middle_fajr_at_lat45_18']['rms']} bias {mu:+.2f}")


# --- the recipe ---
MID_LAT, MID_ANG = best[1], best[2]  # best free fit carries the middle fajr arc


def be_fajr(dt):
    if "05-10" <= md(dt) <= "08-01":
        if "05-10" <= md(dt) <= "05-30":
            return PLAT
        if "07-10" <= md(dt) <= "08-01":
            return PLAT
        return min(raw(dt, MID_LAT, MID_ANG, True), PLAT) % 1440
    r = raw(dt, LAT, 18.0, True)
    return None if r is None else r % 1440


def be_isha(dt):
    if "05-01" <= md(dt) <= "08-11":
        if "05-01" <= md(dt) <= "05-21":
            return 23 * 60 + 26
        if "07-26" <= md(dt) <= "08-11":
            return 23 * 60 + 33
        r = raw(dt, 45.0, 18.0, False)
        return None if r is None else r % 1440
    r = raw(dt, LAT, 18.0, False)
    return None if r is None else r % 1440


out["recipe"] = {
    "isha": "outside 05-01..08-11: 18 deg at Brussels; 05-01..05-21 flat 23:26; "
            "07-26..08-11 flat 23:33; 05-22..07-25 lat-45 18 deg at Brussels lon",
    "fajr": "outside 05-10..08-01: 18 deg at Brussels; 05-10..05-30 and 07-10..08-01 flat 03:24; "
            f"05-31..07-09 arc at lat {MID_LAT:.2f} angle {MID_ANG:.1f}, floored at the 03:24 plateau "
            "(free fit, see middle_fajr_fit)",
}

for year in (2025, 2026):
    rows = load_dated(f"{BASE}/be-emb-bruxelles-{year}.json")
    y = {}
    for col, comp in (("fajr", be_fajr), ("isha", be_isha)):
        y[col] = score_hist(rows, LAT, LON, TZ, col, comp)
        # split: outside window vs inside window, and inside -> plateau vs middle arc
        outside = {dt: v for dt, v in rows.items() if not (
            ("05-10" <= md(dt) <= "08-01") if col == "fajr" else ("05-01" <= md(dt) <= "08-11"))}
        inside = {dt: v for dt, v in rows.items() if dt not in outside}
        if col == "fajr":
            plateau = {dt: v for dt, v in inside.items()
                       if "05-10" <= md(dt) <= "05-30" or "07-10" <= md(dt) <= "08-01"}
            middle = {dt: v for dt, v in inside.items() if dt not in plateau}
        else:
            plateau = {dt: v for dt, v in inside.items()
                       if "05-01" <= md(dt) <= "05-21" or "07-26" <= md(dt) <= "08-11"}
            middle = {dt: v for dt, v in inside.items() if dt not in plateau}
        from kit import score
        y[col]["outside"] = score(outside, LAT, LON, TZ, col, comp)
        y[col]["inside"] = score(inside, LAT, LON, TZ, col, comp)
        y[col]["inside_plateau"] = score(plateau, LAT, LON, TZ, col, comp)
        y[col]["inside_middle"] = score(middle, LAT, LON, TZ, col, comp)
    out[str(year)] = y
    f, i = y["fajr"], y["isha"]
    print(f"{year}: fajr exact {f['exact']}/{f['n']} w1 {f['within1']} worst {f['worst']} | "
          f"outside {f['outside']['exact']}/{f['outside']['n']}, plateau {f['inside_plateau']['exact']}/{f['inside_plateau']['n']}, "
          f"middle {f['inside_middle']['exact']}/{f['inside_middle']['n']} worst {f['inside_middle']['worst']} | "
          f"isha exact {i['exact']}/{i['n']} w1 {i['within1']} worst {i['worst']} | "
          f"outside {i['outside']['exact']}/{i['outside']['n']}, plateau {i['inside_plateau']['exact']}/{i['inside_plateau']['n']}, "
          f"middle {i['inside_middle']['exact']}/{i['inside_middle']['n']} worst {i['inside_middle']['worst']}")

# --- the frozen-generation question: does the 2025 table carry the identical window? ---
r25 = load_dated(f"{BASE}/be-emb-bruxelles-2025.json")
cols = ("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha")
same = {c: 0 for c in cols}
diff_days = {c: [] for c in cols}
for dt26, v26 in rows26.items():
    dt25 = dt26.replace(year=2025)
    v25 = r25.get(dt25)
    if v25 is None:
        continue
    for c in cols:
        if mins(v25[c]) == mins(v26[c]):
            same[c] += 1
        else:
            diff_days[c].append(str(dt25))
out["year_identical"] = {c: {"same": same[c], "of": len(rows26), "differ_on": diff_days[c]}
                         for c in cols}
print("2025 vs 2026 identity (month-day):",
      {c: f"{same[c]}/{len(rows26)}" for c in cols})
print("differ:", {c: diff_days[c] for c in cols if diff_days[c]})

# seasonal drift of the frozen table against true per-date solar computation
drift = {}
for year in (2025, 2026):
    rows = load_dated(f"{BASE}/be-emb-bruxelles-{year}.json")
    d2 = {}
    for col, rising in (("fajr", True), ("isha", False)):
        bym = {}
        for dt, v in sorted(rows.items()):
            m = f"{dt.month:02d}-{dt.day:02d}"
            if ("05-10" <= m <= "08-01") if col == "fajr" else ("05-01" <= m <= "08-11"):
                continue
            r = raw(dt, LAT, 18.0, rising)
            if r is None:
                continue
            bym.setdefault(dt.month, []).append(rel(mins(v[col]), r % 1440))
        d2[col] = {str(m): round(sum(x) / len(x), 2) for m, x in sorted(bym.items())}
    drift[str(year)] = d2
out["frozen_table_drift_vs_true_dates"] = drift

# seasonal amplitude: the real-18 curves at Brussels vs the substituted arc
amp = {}
for col, rising, ang in (("fajr", True, 18.0), ("isha", False, 18.0)):
    vals = {}
    for dt in rows26:
        r = raw(dt, LAT, ang, rising)
        if r is not None:
            vals[dt] = r % 1440
    import datetime as _dt
    jan15 = vals.get(_dt.date(2026, 1, 15))
    jul = [v for d, v in vals.items() if d.month == 7]
    amp[col] = {"exists_days": len(vals), "jan15": round(jan15, 1) if jan15 else None,
                "jul_extremes": [round(min(jul), 1), round(max(jul), 1)] if jul else None,
                "year_span_min": round(min(vals.values()), 1),
                "year_span_max": round(max(vals.values()), 1),
                "amplitude": round(max(vals.values()) - min(vals.values()), 1)}
out["amplitude_real18"] = amp
print("amplitude (real-18 at Brussels):", json.dumps(amp))

json.dump(out, open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/job2_be.json"), "w"), indent=1)
print("job2_be.json written")
