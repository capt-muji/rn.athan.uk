"""Normalize JAKIM e-solat annual JSON (2026) into dated rows."""
import glob, json, os

MON = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"])}
COLS = {"imsak": "imsak", "fajr": "fajr", "sunrise": "syuruk", "dhuhr": "dhuhr",
        "asr": "asr", "magrib": "maghrib", "isha": "isha"}

root = os.path.dirname(os.path.abspath(__file__))
out = {}
for path in sorted(glob.glob(os.path.join(root, "captures/esolat-2026/*.json"))):
    zone = os.path.basename(path)[:-5]
    rows = {}
    for r in json.load(open(path))["prayerTime"]:
        d, m, y = r["date"].split("-")
        key = f"{y}-{MON[m]:02d}-{int(d):02d}"
        rows[key] = {k: r[v][:5] for k, v in COLS.items()}
    out[zone] = rows
json.dump(out, open(os.path.join(root, "data/my-jakim-2026-all-zones.json"), "w"),
          indent=0, sort_keys=True)
print(len(out), "zones,", {len(v) for v in out.values()}, "rows each")
