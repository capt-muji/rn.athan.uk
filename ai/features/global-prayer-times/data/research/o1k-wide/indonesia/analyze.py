import json, math, os
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")


def load(kind, year, slug):
    return json.load(open(os.path.join(DATA, f"{kind}-{year}-{slug}.json")))


def minutes(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def solar(lat, lng, d, tz):
    """NOAA solar position: returns (decl_deg, eot_min, noon_min_local)."""
    n = d.toordinal() - date(2000, 1, 1).toordinal() + 0.5
    g = (357.529 + 0.98560028 * n) % 360
    q = (280.459 + 0.98564736 * n) % 360
    L = (q + 1.915 * math.sin(math.radians(g)) + 0.020 * math.sin(math.radians(2 * g))) % 360
    e = 23.439 - 0.00000036 * n
    ra = math.degrees(math.atan2(math.cos(math.radians(e)) * math.sin(math.radians(L)), math.cos(math.radians(L)))) / 15
    decl = math.degrees(math.asin(math.sin(math.radians(e)) * math.sin(math.radians(L))))
    eot = q / 15 - ra
    eot = (eot + 12) % 24 - 12
    noon = 12 + tz - lng / 15 - eot
    return decl, noon


def hour_angle(lat, decl, alt):
    c = (math.sin(math.radians(alt)) - math.sin(math.radians(lat)) * math.sin(math.radians(decl))) / (
        math.cos(math.radians(lat)) * math.cos(math.radians(decl)))
    c = max(-1.0, min(1.0, c))
    return math.degrees(math.acos(c)) / 15


def implied_angle(lat, decl, minutes_from_noon, ref_alt=None):
    ha = abs(minutes_from_noon) / 60
    c = (math.sin(math.radians(lat)) * math.sin(math.radians(decl))
         + math.cos(math.radians(lat)) * math.cos(math.radians(decl)) * math.cos(math.radians(ha * 15)))
    return math.degrees(math.asin(c))


def implied_isha(lat, decl, mins_after_maghrib, maghrib_alt):
    ha_m = abs(mins_after_maghrib) / 60
    # invert from maghrib altitude
    c = (math.sin(math.radians(lat)) * math.sin(math.radians(decl))
         + math.cos(math.radians(lat)) * math.cos(math.radians(decl)) * math.cos(math.radians(ha_m * 15)))
    return math.degrees(math.asin(c))


def report(kind, year, slug, lat, lng, tz, sample=None):
    rows = load(kind, year, slug)["rows"]
    dates = sorted(rows)
    if sample:
        dates = dates[::sample]
    out = []
    for ds in dates:
        y, m, dd = map(int, ds.split("-"))
        d = date(y, m, dd)
        decl, noon = solar(lat, lng, d, tz)
        r = rows[ds]
        fajr = minutes(r["fajr"]) - noon * 60
        sunrise = minutes(r["sunrise"]) - noon * 60
        maghrib = minutes(r["magrib"]) - noon * 60
        isha = minutes(r["isha"]) - noon * 60
        dhuhr = minutes(r["dhuhr"]) - noon * 60
        out.append({
            "date": ds,
            "fajr_alt": implied_angle(lat, decl, fajr),
            "sunrise_alt": implied_angle(lat, decl, sunrise),
            "maghrib_alt": implied_angle(lat, decl, maghrib),
            "isha_alt": implied_angle(lat, decl, isha),
            "dhuhr_off": dhuhr,
            "fajr_sunrise_gap": sunrise - fajr,
            "isha_maghrib_gap": isha - maghrib,
        })
    return out


def summary(rows, label):
    import statistics as st
    def med(k):
        return round(st.median(x[k] for x in rows), 2)
    def spread(k):
        v = [x[k] for x in rows]
        return f"{round(min(v),2)}..{round(max(v),2)}"
    print(f"{label}: fajr {med('fajr_alt')} ({spread('fajr_alt')})  "
          f"sunrise {med('sunrise_alt')} ({spread('sunrise_alt')})  "
          f"maghrib {med('maghrib_alt')} ({spread('maghrib_alt')})  "
          f"isha {med('isha_alt')} ({spread('isha_alt')})  dhuhr_offset {med('dhuhr_off')} ({spread('dhuhr_off')})")


CITY_META = {
    "jakarta-pusat": (-6.1805, 106.8284, 7),
    "surabaya": (-7.2575, 112.7521, 7),
    "medan": (3.5952, 98.6722, 7),
    "makassar": (-5.1477, 119.4327, 8),
    "jayapura": (-2.5916, 140.6690, 9),
}

if __name__ == "__main__":
    for slug, (lat, lng, tz) in CITY_META.items():
        for kind in ("khgt", "sihat"):
            p = os.path.join(DATA, f"{kind}-2026-{slug}.json")
            if not os.path.exists(p):
                continue
            rows = report(kind, 2026, slug, lat, lng, tz, sample=7)
            summary(rows, f"{kind} {slug} 2026")
        print()
