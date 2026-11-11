import json, math, os, statistics as st
from datetime import date
DATA = os.path.expanduser("~/athan-gitree/census/o1k-wide/sea2/data")
IND = os.path.expanduser("~/athan-gitree/census/o1k-wide/indonesia/data")

def solar(lat, lng, d, tz):
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

def implied(lat, decl, mins_from_noon):
    ha = abs(mins_from_noon) / 60
    c = (math.sin(math.radians(lat)) * math.sin(math.radians(decl))
         + math.cos(math.radians(lat)) * math.cos(math.radians(decl)) * math.cos(math.radians(ha * 15)))
    return math.degrees(math.asin(c))

def mins(hhmm):
    h, m = hhmm.split(":"); return int(h) * 60 + int(m)

def angles(path, lat, lng, tz):
    rows = json.load(open(path))["rows"]
    out = []
    for ds, r in rows.items():
        y, m, dd = map(int, ds.split("-"))
        decl, noon = solar(lat, lng, date(y, m, dd), tz)
        imsak = mins(r["imsak"]) if r.get("imsak") else None
        out.append({
            "date": ds,
            "fajr_alt": implied(lat, decl, mins(r["fajr"]) - noon * 60),
            "isha_alt": implied(lat, decl, mins(r["isha"]) - noon * 60),
            "isha_gap": mins(r["isha"]) - mins(r["magrib"]),
            "imsak_gap": mins(r["fajr"]) - imsak if imsak else None,
        })
    return out

def show(label, rows):
    def med(k): return round(st.median(x[k] for x in rows), 2)
    def sp(k):
        v = [x[k] for x in rows if x[k] is not None]
        return "n/a" if not v else f"{round(min(v),2)}..{round(max(v),2)}"
    print(f"{label}: fajr {med('fajr_alt')} ({sp('fajr_alt')})  isha {med('isha_alt')} ({sp('isha_alt')})  isha-maghrib {sp('isha_gap')} min  fajr-imsak {sp('imsak_gap')} min")

show("KHGT puncak-jaya 2026 (coord elev 3396 m)", angles(f"{DATA}/khgt-2026-puncak-jaya.json", -3.9833, 137.25, 9))
show("KHGT puncak-jaya 2027 (coord elev 3396 m)", angles(f"{DATA}/khgt-2027-puncak-jaya.json", -3.9833, 137.25, 9))
show("KHGT jayapura 2026 (lowland, coord elev 117 m)", angles(f"{IND}/khgt-2026-jayapura.json", -2.5916, 140.669, 9))
show("KHGT banda-aceh 2026", angles(f"{DATA}/khgt-2026-banda-aceh.json", 5.5587, 95.3277, 7))
show("KHGT banda-aceh 2027", angles(f"{DATA}/khgt-2027-banda-aceh.json", 5.5587, 95.3277, 7))
