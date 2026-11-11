#!/usr/bin/env python3
"""Pull Birmingham Islamic Society's dated adhan table.

The site's own WordPress route `/wp-json/bis/v1/adhans?date=YYYY-MM-DD` returns one
day of athan times. The payload stamps them with a `Z` suffix, but they are local
wall-clock times: 2026-03-15 dhuhr reads 12:57Z, which is 12:57 CDT, the city's
midday transit. Parsed as wall time in America/Chicago, never as UTC.
"""
import os, sys, json, datetime, urllib.request, concurrent.futures

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "birmingham")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)
COLS = ["fajr", "sunrise", "dhur", "asr", "maghrib", "isha"]
RENAME = {"dhur": "dhuhr"}


def fetch(date):
    url = f"https://www.bisweb.org/wp-json/bis/v1/adhans?date={date}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        d = json.load(r)
    return date, d


def main():
    years = [int(y) for y in sys.argv[1:]] or [2026]
    dates = []
    for y in years:
        d = datetime.date(y, 1, 1)
        while d.year == y:
            dates.append(d.isoformat())
            d += datetime.timedelta(days=1)
    days = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        for date, d in ex.map(fetch, dates):
            pt = (d.get("data") or {}).get("prayer_times")
            if not pt:
                print("EMPTY", date, flush=True)
                continue
            row = {k: pt.get(k, "")[:5] for k in COLS}
            if not all(row.values()):
                print("SHORT", date, row, flush=True)
                continue
            days[date] = row
    json.dump({"metro": "Birmingham", "source": "https://www.bisweb.org/wp-json/bis/v1/adhans",
               "publisher": "Birmingham Islamic Society", "timezone": "America/Chicago",
               "engine": "own", "days": days},
              open(os.path.join(OUT, "Birmingham-bis-adhans.json"), "w"), indent=1)
    print("rows", len(days))


if __name__ == "__main__":
    main()
