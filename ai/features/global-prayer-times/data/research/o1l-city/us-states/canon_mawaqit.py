# Parse mawaqit confData into canonical rows + iqamah files.
import datetime, json, re, sys

path, out = sys.argv[1], sys.argv[2]
h = open(path, encoding="utf-8", errors="replace").read()
conf = json.loads(re.search(r"confData\s*=\s*(\{.*?\});", h, re.S).group(1))
year = int(sys.argv[3]) if len(sys.argv) > 3 else 2026

def canon(cal):
    cols = ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
    rows = {}
    for mi, month in enumerate(cal, start=1):
        for day, times in month.items():
            d = int(day)
            try:
                datetime.date(year, mi, d)
            except ValueError:
                continue
            key = f"{year}-{mi:02d}-{d:02d}"
            if isinstance(times, dict):
                rows[key] = {k: (times.get(k) or "").strip() for k in cols}
            elif isinstance(times, (list, tuple)) and len(times) >= 6:
                rows[key] = dict(zip(cols, [str(t).strip() for t in times[:6]]))
    return rows

athan = canon(conf["calendar"])
iq = canon(conf.get("iqamaCalendar") or [])
json.dump(athan, open(out, "w"), indent=1, ensure_ascii=False)
iqout = out.replace("rows_", "iqamah_rows_")
json.dump(iq, open(iqout, "w"), indent=1, ensure_ascii=False)
meta = {"name": conf.get("name"), "lat": conf.get("latitude"), "lon": conf.get("longitude"),
        "tz": conf.get("timezone"), "jumua": conf.get("jumua")}
json.dump(meta, open(out.replace("rows_", "meta_").replace(".json", ".json"), "w"))
print(out, len(athan), "athan rows,", len(iq), "iqamah |", meta)
