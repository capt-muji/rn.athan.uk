import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
BASE = "https://bimasislam.kemenag.go.id/api/v1/public/prayer-times"
ROOT = os.path.dirname(os.path.abspath(__file__))
YEAR = int(sys.argv[1]) if len(sys.argv) > 1 else 2026


def fetch(city_id, ds):
    url = f"{BASE}?city_id={city_id}&date={ds}"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=35) as r:
                body = r.read().decode()
                d = json.loads(body).get("data")
            if d:
                return ds, {"fajr": d["fajr"][:5], "sunrise": d["sunrise"][:5], "dhuhr": d["dhuhr"][:5],
                            "asr": d["asr"][:5], "magrib": d["maghrib"][:5], "isha": d["isha"][:5]}
            return ds, None
        except Exception:
            time.sleep(1 + attempt)
    return ds, None


def year_days(y):
    d = date(y, 1, 1)
    while d.year == y:
        yield d.isoformat()
        d += timedelta(days=1)


if __name__ == "__main__":
    table = json.load(open(os.path.join(ROOT, "data", "cities.json")))
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    for c in table["capitals"]:
        slug = c["city"].lower().replace("kota ", "").replace("kab. ", "").replace(" ", "-")
        p = os.path.join(ROOT, "data", f"sihat-{YEAR}-{slug}.json")
        rows = {}
        if os.path.exists(p):
            rows = json.load(open(p))["rows"]
        todo = [ds for ds in year_days(YEAR) if ds not in rows]
        if todo:
            got = 0
            with ThreadPoolExecutor(max_workers=8) as ex:
                for ds, r in ex.map(lambda ds: fetch(c["city_id"], ds), todo):
                    if r:
                        rows[ds] = r
                        got += 1
                    if got and got % 120 == 0:
                        json.dump({"source": BASE, "city": c["city"], "city_id": c["city_id"],
                                   "lat": c["lat"], "lng": c["lng"], "elevation": c["elevation"],
                                   "tz": c["tz"], "rows": rows}, open(p, "w"), indent=1, ensure_ascii=False)
        json.dump({"source": BASE, "city": c["city"], "city_id": c["city_id"],
                   "lat": c["lat"], "lng": c["lng"], "elevation": c["elevation"],
                   "tz": c["tz"], "rows": rows}, open(p, "w"), indent=1, ensure_ascii=False)
        print(c["province"], c["city"], len(rows), flush=True)
