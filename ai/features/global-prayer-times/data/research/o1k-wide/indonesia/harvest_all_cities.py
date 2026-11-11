import json, os, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
BASE = "https://bimasislam.kemenag.go.id/api/v1/public/prayer-times"
ROOT = os.path.dirname(os.path.abspath(__file__))
CITIES = json.load(open(os.path.join(ROOT, "captures", "bimasislam_cities_diy.json")))["data"]
DATES = ["2026-06-15", "2026-12-21"]


def fetch(city_id, ds):
    url = f"{BASE}?city_id={city_id}&date={ds}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=35) as r:
                d = json.loads(r.read().decode()).get("data")
            if d:
                return {"fajr": d["fajr"][:5], "sunrise": d["sunrise"][:5], "dhuhr": d["dhuhr"][:5],
                        "asr": d["asr"][:5], "magrib": d["maghrib"][:5], "isha": d["isha"][:5]}
        except Exception:
            time.sleep(1 + attempt)
    return None


def job(args):
    city, ds = args
    return city["name"], ds, fetch(city["id"], ds)


if __name__ == "__main__":
    tasks = [(c, ds) for c in CITIES for ds in DATES]
    out = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for name, ds, row in ex.map(job, tasks):
            if row is None:
                continue
            out.setdefault(name, {"province_id": next(c["province_id"] for c in CITIES if c["name"] == name),
                                  "lat": next(c["latitude"] for c in CITIES if c["name"] == name),
                                  "lng": next(c["longitude"] for c in CITIES if c["name"] == name),
                                  "elevation": next(c["elevation"] for c in CITIES if c["name"] == name),
                                  "tz": next(c["timezone"] for c in CITIES if c["name"] == name),
                                  "rows": {}})
            out[name]["rows"][ds] = row
    json.dump({"source": BASE, "dates": DATES, "cities": out},
              open(os.path.join(ROOT, "data", "sihat-2026-all-cities-2dates.json"), "w"),
              indent=1, ensure_ascii=False)
    print("cities captured:", len(out), "rows:", sum(len(v["rows"]) for v in out.values()))
