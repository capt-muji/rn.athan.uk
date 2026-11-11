import html
import json
import sys
import urllib.parse

# Masjidbox landing pages carry the whole timetable inline as a URL-encoded JSON blob.
# Unquote the document, then find the largest object whose keys include "timetable".
path = sys.argv[1]
out = sys.argv[2]
h = html.unescape(open(path, encoding="utf-8", errors="replace").read())
s = urllib.parse.unquote(h)
dec = json.JSONDecoder()
best = None
i = s.find('"timetable"')
while i > 0:
    j = s.rfind("{", 0, i)
    while j >= 0:
        try:
            obj, _ = dec.raw_decode(s[j:])
            if isinstance(obj, dict) and "timetable" in obj:
                if best is None or len(obj["timetable"]) > len(best[1]["timetable"]):
                    best = (j, obj)
                break
        except json.JSONDecodeError:
            pass
        j = s.rfind("{", 0, j)
    break
if best is None:
    sys.exit("no timetable payload")
data = best[1]
rows = {}
for r in data["timetable"]:
    d = r["date"][:10]
    row = {"athan": [r[k][11:16] for k in ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")]}
    if r.get("iqamah"):
        row["iqamah"] = [r["iqamah"].get(k, "")[11:16] for k in ("fajr", "dhuhr", "asr", "maghrib", "isha")]
    rows[d] = row
json.dump(rows, open(out, "w"), indent=1, ensure_ascii=False)
print(out, len(rows), "rows", min(rows), "->", max(rows), "| tz", data.get("settings", {}).get("timezone"))
