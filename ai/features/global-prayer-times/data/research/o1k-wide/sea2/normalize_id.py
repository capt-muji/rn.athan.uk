import json, os, sys
RAW = os.path.expanduser("~/athan-gitree/census/o1k-wide/sea2/captures")
DATA = os.path.expanduser("~/athan-gitree/census/o1k-wide/sea2/data")
os.makedirs(DATA, exist_ok=True)

SITES = {
    "banda-aceh": (5.558704, 95.327713, 7),
    "puncak-jaya": (-3.983300, 137.25, 9),
}
COLS = {"imsak": "imsak", "subuh": "fajr", "terbit": "sunrise", "dzuhur": "dhuhr",
        "ashar": "asr", "maghrib": "magrib", "isya": "isha"}

for slug, (lat, lng, tz) in SITES.items():
    for y in (2026, 2027):
        raw = json.load(open(f"{RAW}/khgt-{slug}-{y}.raw.json"))
        rows = {}
        for ds, r in raw["rows"].items():
            rows[ds] = {out: r[src] for src, out in COLS.items() if r.get(src)}
        with open(f"{DATA}/khgt-{y}-{slug}.json", "w") as f:
            json.dump({"source": "https://api-khgt.muhammadiyah.or.id/api/sholat/schedule",
                       "org": "Majelis Tarjih dan Tajdid PP Muhammadiyah (KHGT)",
                       "city": slug, "lat": lat, "lng": lng, "tz": tz,
                       "meta": raw.get("meta"), "rows": rows}, f)
        print(slug, y, len(rows))
