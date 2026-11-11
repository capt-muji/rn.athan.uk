import datetime
import json
import re
import sys

# Mawaqit confData carries all twelve months of the year inline, keyed by day of month.
path, out = sys.argv[1], sys.argv[2]
year = int(sys.argv[3]) if len(sys.argv) > 3 else 2026
h = open(path, encoding="utf-8", errors="replace").read()
conf = json.loads(re.search(r"confData\s*=\s*(\{.*?\});", h, re.S).group(1))
rows = {}
for mi, month in enumerate(conf["calendar"], start=1):
    for day, times in month.items():
        d = int(day)
        try:
            datetime.date(year, mi, d)
        except ValueError:
            continue
        rows[f"{year}-{mi:02d}-{d:02d}"] = times
iq = {}
for mi, month in enumerate(conf.get("iqamaCalendar") or [], start=1):
    for day, times in month.items():
        d = int(day)
        try:
            datetime.date(year, mi, d)
        except ValueError:
            continue
        iq[f"{year}-{mi:02d}-{d:02d}"] = times
json.dump({"athan": rows, "iqamah": iq, "name": conf.get("name"), "lat": conf.get("latitude"),
           "lon": conf.get("longitude"), "tz": conf.get("timezone"), "jumua": conf.get("jumua")},
          open(out, "w"), indent=1, ensure_ascii=False)
print(out, len(rows), "athan rows", len(iq), "iqamah rows", min(rows), "->", max(rows),
      "|", conf.get("timezone"), conf.get("latitude"), conf.get("longitude"))
