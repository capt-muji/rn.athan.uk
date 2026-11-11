#!/usr/bin/env python3
"""Capture every athanpro city page and lift its dated month table.

One page = one month table (the heading names the month, `initialPrayerDate` anchors the year
as a literal, and the rendered table carries a weekday and a Hijri day per row). Nothing here
reads the clock: every date is built from a string inside the capture.

Output:
  captures/cities/<country>/<city>.html   raw page
  data/<country>-<city>.json              {"YYYY-MM-DD": {fajr,sunrise,dhuhr,asr,maghrib,isha}}
  data/index.json                         per page: coords, zone, method, month, rows, checks
"""
import html as htmllib
import json
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAP = os.path.join(ROOT, "captures", "cities")
DATA = os.path.join(ROOT, "data")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")
COLS = ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August",
     "September", "October", "November", "December"], 1)}
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def fetch(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            if len(body) < 2000:
                raise ValueError(f"short body {len(body)}")
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, "wb").write(body)
            time.sleep(0.25)
            return body.decode("utf-8", "replace")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def next_data(h):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', h, re.S)
    return json.loads(m.group(1)) if m else None


def rendered_rows(h):
    """Rows as the page paints them: day, weekday, Hijri day, six times."""
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", h, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", htmllib.unescape(t))
    pat = re.compile(r"(\d{2}) (Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) "
                     r"(\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) "
                     r"(\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2})")
    out = {}
    for g in pat.finditer(t):
        d, wd, hij, f, s, dh, a, mg, i = g.groups()
        out[int(d)] = dict(weekday=wd, hijri=int(hij),
                           fajr=f, sunrise=s, dhuhr=dh, asr=a, maghrib=mg, isha=i)
    return out


def parse(h, country_slug, city_slug):
    d = next_data(h)
    if not d:
        return dict(err="no-next-data")
    pp = d.get("props", {}).get("pageProps", {})
    city = pp.get("city") or {}
    country = pp.get("country") or {}
    mp = pp.get("monthPrayerTimes") or {}
    init = pp.get("initialPrayerDate")
    if not mp or not mp.get("prayertimes") or not init:
        return dict(err="no-month-table")
    month = mp.get("month")
    year = int(init[:4])
    if MONTHS.get(month) != int(init[5:7]):
        return dict(err=f"month-mismatch:{month}:{init}")
    rows = {}
    for r in mp["prayertimes"]:
        day = int(r["day"])
        rows[f"{year}-{int(init[5:7]):02d}-{day:02d}"] = {c: r[c] for c in COLS}
    paint = rendered_rows(h)
    json_ok = sum(1 for r in mp["prayertimes"]
                  if int(r["day"]) in paint and all(paint[int(r["day"])][c] == r[c] for c in COLS))
    # Weekday alignment: a month table whose every painted weekday matches the real calendar
    # for `year` fixes the year without a clock.
    import datetime
    align = 0
    for day, r in paint.items():
        if WEEKDAYS[datetime.date(year, MONTHS[month], day).weekday()] == r["weekday"]:
            align += 1
    adj = (mp.get("method") or {}).get("adjustments") or {}
    return dict(
        country_slug=country_slug, city_slug=city_slug,
        country=country.get("name_en"), city=city.get("name_en"),
        lat=city.get("latitude"), lon=city.get("longitude"),
        tz=city.get("timezone"), month=month, year=year,
        country_tz_label=country.get("timezone"),
        method=(mp.get("method") or {}).get("name"),
        method_id=(mp.get("method") or {}).get("id"),
        adjustments=adj, source=mp.get("source"),
        table_lat=(mp.get("city") or {}).get("latitude"),
        table_lon=(mp.get("city") or {}).get("longitude"),
        rows=rows, n=len(rows),
        paint_rows=len(paint), json_paint_agree=json_ok, weekday_align=align,
        today=(pp.get("todayPrayerTimes") or {}).get("prayertimes"),
    )


def one(u):
    cslug, cityslug = u[0], u[2]
    path = os.path.join(CAP, cslug, f"{cityslug}.html")
    try:
        h = fetch(f"https://athanpro.com/countries/{cslug}/{cityslug}", path)
    except Exception as e:
        return None, [cslug, cityslug, f"fetch:{e}"]
    rec = parse(h, cslug, cityslug)
    if rec.get("err"):
        return None, [cslug, cityslug, rec["err"]]
    rows = rec.pop("rows")
    json.dump(rows, open(os.path.join(DATA, f"{cslug}-{cityslug}.json"), "w"), indent=0)
    rec["rows"] = len(rows)
    return rec, None


def main():
    from concurrent.futures import ThreadPoolExecutor
    uni = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "universe.tsv"))]
    os.makedirs(CAP, exist_ok=True)
    index = []
    fails = []
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        for i, (rec, fail) in enumerate(ex.map(one, uni), 1):
            if rec:
                index.append(rec)
            if fail:
                fails.append(fail)
                print(f"FAIL {fail[0]}/{fail[1]} {fail[2]}", flush=True)
            if i % 100 == 0:
                print(f"{i}/{len(uni)} {time.time()-t0:.0f}s ok={len(index)} fail={len(fails)}", flush=True)
    json.dump(index, open(os.path.join(DATA, "index.json"), "w"), indent=1)
    json.dump(fails, open(os.path.join(DATA, "fails.json"), "w"), indent=1)
    print(f"DONE ok={len(index)} fail={len(fails)} in {time.time()-t0:.0f}s")
    for f in fails:
        print("FAIL", f)


if __name__ == "__main__":
    main()
