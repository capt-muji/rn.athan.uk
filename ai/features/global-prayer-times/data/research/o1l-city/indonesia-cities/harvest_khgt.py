import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
URL = "https://api-khgt.muhammadiyah.or.id/api/sholat/schedule"
ROOT = os.path.dirname(os.path.abspath(__file__))
YEARS = [int(a) for a in sys.argv[1:]] or [2026, 2027]


def month(lat, lng, y, m):
    body = json.dumps({"lat": lat, "lng": lng, "date": f"{y}-{m:02d}-01", "mode": "monthly_masehi"}).encode()
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            last = e
            time.sleep(1 + attempt)
    raise last


if __name__ == "__main__":
    table = json.load(open(os.path.join(ROOT, "data", "cities.json")))
    for c in table["capitals"]:
        slug = c["city"].lower().replace("kota ", "").replace("kab. ", "").replace(" ", "-")
        for y in YEARS:
            p = os.path.join(ROOT, "data", f"khgt-{y}-{slug}.json")
            if os.path.exists(p):
                existing = json.load(open(p))
                if len(existing.get("rows", {})) >= 365:
                    continue
            rows, meta = {}, {}
            for m in range(1, 13):
                b = month(c["lat"], c["lng"], y, m)
                dd = b["data"]
                meta = {"elevation": dd.get("elevation"), "timezone": dd.get("timezone")}
                for s in dd["schedules"]:
                    rows[s["date"]] = {"fajr": s["subuh"], "sunrise": s["terbit"], "dhuhr": s["dzuhur"],
                                       "asr": s["ashar"], "maghrib": s["maghrib"], "isha": s["isya"]}
            json.dump({"source": URL, "org": "Majelis Tarjih dan Tajdid PP Muhammadiyah (KHGT)",
                       "city": c["city"], "province": c["province"], "lat": c["lat"], "lng": c["lng"],
                       "ref_elevation": c["elevation"], **meta, "rows": rows},
                      open(p, "w"), indent=1, ensure_ascii=False)
            print(c["province"], c["city"], y, len(rows), flush=True)
