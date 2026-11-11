# Masjidbox landing payload -> canonical rows (7-day window) + iqamah.
import json, re, sys, urllib.parse

src, out = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8", errors="replace").read()
m = re.search(r"window\.REDUX_STATE\s*=\s*'([^']+)'", h)
st = json.loads(urllib.parse.unquote(m.group(1)))
mb = st["masjidbox"]["masjidboxAthany"]
tt = mb["timetable"]
rows, iq = {}, {}
for r in tt:
    key = r["date"][:10]
    rows[key] = {k: r[k][11:16] for k in ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")}
    if r.get("iqamah"):
        iq[key] = {k: (v[11:16] if v else "") for k, v in r["iqamah"].items() if k in ("fajr", "dhuhr", "asr", "maghrib", "isha")}
json.dump(rows, open(out, "w"), indent=1)
json.dump(iq, open(out.replace("rows_", "iqamah_"), "w"), indent=1)
print(out, len(rows), "rows", min(rows), "->", max(rows), "|", mb.get("name"), "|", mb["settings"].get("timezone"))
