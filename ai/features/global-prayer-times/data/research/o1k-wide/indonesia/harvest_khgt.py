import json, os, urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
URL = "https://api-khgt.muhammadiyah.or.id/api/sholat/schedule"
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "data")
CAP = os.path.join(ROOT, "captures")
CITIES = {
    "jakarta-pusat": (-6.1805, 106.8284),
    "surabaya": (-7.2575, 112.7521),
    "medan": (3.5952, 98.6722),
    "makassar": (-5.1477, 119.4327),
    "jayapura": (-2.5916, 140.6690),
}


def month(city, lat, lng, y, m):
    body = json.dumps({"lat": lat, "lng": lng, "date": f"{y}-{m:02d}-01", "mode": "monthly_masehi"}).encode()
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


for slug, (lat, lng) in CITIES.items():
    for y in (2026, 2027):
        rows = {}
        meta = {}
        for m in range(1, 13):
            b = month(slug, lat, lng, y, m)
            d = b["data"]
            meta = {"elevation": d.get("elevation"), "timezone": d.get("timezone")}
            for s in d["schedules"]:
                rows[s["date"]] = {
                    "fajr": s["subuh"], "sunrise": s["terbit"], "dhuhr": s["dzuhur"],
                    "asr": s["ashar"], "magrib": s["maghrib"], "isha": s["isya"],
                }
        json.dump({"source": URL, "org": "Majelis Tarjih dan Tajdid PP Muhammadiyah (KHGT)",
                   "city": slug, "lat": lat, "lng": lng, **meta, "rows": rows},
                  open(os.path.join(OUT, f"khgt-{y}-{slug}.json"), "w"), indent=1, ensure_ascii=False)
        print(slug, y, len(rows), meta, flush=True)
