import json, os, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
BASE = "https://bimasislam.kemenag.go.id/api/v1/public/prayer-times"
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "data")
CITIES = json.load(open(os.path.join(ROOT, "captures", "bimasislam_cities_diy.json")))["data"]
WANT = ["KOTA JAKARTA PUSAT", "KOTA SURABAYA", "KOTA MEDAN", "KOTA MAKASSAR", "KOTA JAYAPURA"]


def fetch(city_id, ds):
    url = f"{BASE}?city_id={city_id}&date={ds}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=35) as r:
                d = json.loads(r.read().decode()).get("data")
            if d:
                return ds, {"fajr": d["fajr"][:5], "sunrise": d["sunrise"][:5], "dhuhr": d["dhuhr"][:5],
                            "asr": d["asr"][:5], "magrib": d["maghrib"][:5], "isha": d["isha"][:5]}
            return ds, None
        except Exception:
            time.sleep(1 + attempt)
    return ds, None


def slug_of(name):
    return name.lower().replace("kota ", "").replace(" ", "-")


def year_days(y):
    d = date(y, 1, 1)
    while d.year == y:
        yield d.isoformat()
        d += timedelta(days=1)


if __name__ == "__main__":
    by_name = {c["name"]: c for c in CITIES}
    for name in WANT:
        c = by_name[name]
        slug = slug_of(name)
        p = os.path.join(OUT, f"sihat-2026-{slug}.json")
        rows = json.load(open(p))["rows"] if os.path.exists(p) else {}
        todo = [ds for ds in year_days(2026) if ds not in rows]
        if todo:
            with ThreadPoolExecutor(max_workers=8) as ex:
                for ds, r in ex.map(lambda ds: fetch(c["id"], ds), todo):
                    if r:
                        rows[ds] = r
        json.dump({"source": "bimasislam.kemenag.go.id/api/v1/public/prayer-times",
                   "city": name, "lat": c["latitude"], "lng": c["longitude"],
                   "elevation": c["elevation"], "tz": c["timezone"], "rows": rows},
                  open(p, "w"), indent=1, ensure_ascii=False)
        print(name, len(rows), flush=True)
