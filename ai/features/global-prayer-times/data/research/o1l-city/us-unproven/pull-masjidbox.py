#!/usr/bin/env python3
"""Pull masjidbox athany timetables in 7-day windows, with a per-window cache.

The platform serves seven days per request from `begin`. Each row carries the
mosque's athan columns as ISO datetimes plus its iqamah block, so the capture is
the publisher's own schedule, not a recomputation.
"""
import os, sys, json, time, urllib.request, concurrent.futures, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "masjidbox")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)
KEY = "JejYcMS7hsOsZTPDk2ZhKOAlW9IyQ6Px"
BASE = "https://api.masjidbox.com/1.0/masjidbox/landing/athany/"

TARGETS = [
    ("Kansas City", "islamic-society-of-greater-kansas-city"),
    ("Grand Rapids", "masjid-sunnah-grand-rapids-michigan"),
    ("Louisville", "hira-institute"),
    ("Wilmington", "masjid-al-ikhlaas"),
    ("Rochester", "al-rahman"),
    ("Detroit", "baic-detroit"),
    ("Baltimore", "masjid-ul-haqq-baltimore"),
]


def fetch(slug, begin):
    path = os.path.join(RAW, f"{slug}-{begin}.json")
    if os.path.exists(path):
        return json.load(open(path))
    url = f"{BASE}{slug}?get=at&days=7&begin={begin}"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "apikey": KEY})
            with urllib.request.urlopen(req, timeout=40) as r:
                d = json.load(r)
            json.dump(d, open(path, "w"))
            return d
        except Exception:
            time.sleep(2 + 3 * attempt)
    raise RuntimeError("failed")


def pull(job):
    metro, slug, begin = job
    try:
        return metro, slug, begin, fetch(slug, begin), "ok"
    except Exception as e:
        return metro, slug, begin, None, "ERR:" + type(e).__name__


def main():
    years = [int(y) for y in sys.argv[1:]] or [2026]
    jobs = []
    for metro, slug in TARGETS:
        for y in years:
            d = datetime.date(y, 1, 1)
            while d.year == y:
                jobs.append((metro, slug, d.isoformat()))
                d += datetime.timedelta(days=7)
    store = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        for metro, slug, begin, d, status in ex.map(pull, jobs):
            if status != "ok":
                print("FAIL", metro, slug, begin, status, flush=True)
                continue
            key = (metro, slug)
            if key not in store:
                store[key] = {"name": d.get("name"), "address": d.get("address"),
                              "settings": d.get("settings"), "rows": {}}
            for r in d.get("timetable") or []:
                store[key]["rows"][r["date"][:10]] = {
                    "fajr": r.get("fajr"), "sunrise": r.get("sunrise"), "dhuhr": r.get("dhuhr"),
                    "asr": r.get("asr"), "maghrib": r.get("maghrib"), "isha": r.get("isha"),
                    "iqamah": r.get("iqamah")}
    for (metro, slug), v in store.items():
        json.dump({"metro": metro, "slug": slug, "name": v["name"], "address": v["address"],
                   "settings": v["settings"], "engine": "masjidbox",
                   "source": f"https://api.masjidbox.com/1.0/masjidbox/landing/athany/{slug}",
                   "rows": v["rows"]}, open(os.path.join(OUT, f"{metro}-{slug}-masjidbox.json"), "w"), indent=1)
        print(metro, slug, v["name"], len(v["rows"]), "rows")


if __name__ == "__main__":
    main()
