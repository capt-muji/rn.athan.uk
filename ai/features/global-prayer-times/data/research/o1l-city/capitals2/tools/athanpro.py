#!/usr/bin/env python3
"""Flatten an athanpro city page into dated rows.

The page is a static build: it renders one month table (month name in the heading, Hijri day
beside each Gregorian day) plus a "Today" block. The month name, the Hijri day and the
weekday are the anchors that recover the year without reading any clock.
"""
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")

MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August",
     "September", "October", "November", "December"], 1)}
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def text(path):
    h = open(path, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", h, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t)


def parse(path):
    t = text(path)
    h = open(path, encoding="utf-8", errors="replace").read()
    m = re.search(r"Prayer Times in (.+?) for (\w+)", t)
    if not m:
        return dict(err="no-month-header")
    city, month = m.group(1), m.group(2)
    month_no = MONTHS.get(month)
    if not month_no:
        return dict(err=f"bad-month:{month}")
    meth = re.search(r"Calculation method (.+?) Qibla", t)
    tz = re.search(r"(?:GMT|UTC)\s*([+-]\d{2}:\d{2})", t)
    coord = re.search(r'"latitude":(-?\d+\.\d+),\s*"longitude":(-?\d+\.\d+)', h)
    today = re.search(
        r"Fajr (\d{2}:\d{2}) Sunrise (\d{2}:\d{2}) Dhuhr (\d{2}:\d{2}) Asr (\d{2}:\d{2}) "
        r"Maghrib (\d{2}:\d{2}) Isha (\d{2}:\d{2})", t)
    tail = t[m.end():]
    pat = re.compile(
        r"(\d{2}) (Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) "
        r"(\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2})")
    rows = {}
    for g in pat.finditer(tail):
        d, wd, hij, f, s, dh, a, mg, i = g.groups()
        rows[int(d)] = dict(fajr=f, sunrise=s, dhuhr=dh, asr=a, maghrib=mg, isha=i,
                            weekday=wd, hijri=int(hij))
    return dict(city=city, month=month, month_no=month_no, method=meth.group(1).strip() if meth else None,
                tz=tz.group(1) if tz else None, coord=coord.groups() if coord else None,
                today=today.groups() if today else None, rows=rows)


def resolve_year(month_no, rows):
    """Pick the year whose weekday alignment matches every row's printed weekday."""
    import datetime
    for year in (2026, 2025, 2027):
        ok = 0
        for d, r in rows.items():
            try:
                wd = datetime.date(year, month_no, d).strftime("%a")
            except ValueError:
                continue
            ok += wd == r["weekday"]
        if ok >= max(1, len(rows) - 1):
            return year, ok
    return None, 0


def main():
    src, cc, city_slug = sys.argv[1], sys.argv[2], sys.argv[3]
    p = parse(src)
    if p.get("err"):
        print("ERR", src, p["err"])
        return
    year, agree = resolve_year(p["month_no"], p["rows"])
    p["year"], p["weekdayAgree"] = year, agree
    rows = {f"{year}-{p['month_no']:02d}-{d:02d}": {k: v[k] for k in
            ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")}
            for d, v in sorted(p["rows"].items())} if year else {}
    out = os.path.join(DATA, f"athanpro-{cc}-{city_slug}.json")
    json.dump(dict(rows=rows, meta=dict(city=p["city"], month=p["month"], year=year,
                                        method=p["method"], tz=p["tz"], coord=p["coord"],
                                        today=p["today"], weekday_agree=f"{agree}/{len(p['rows'])}",
                                        source=os.path.basename(src))),
              open(out, "w"), indent=1, sort_keys=True)
    print(f"{cc} {city_slug}: {len(rows)} rows {min(rows) if rows else '-'}..{max(rows) if rows else '-'} "
          f"method={p['method']!r} tz={p['tz']} coord={p['coord']} wd={agree}/{len(p['rows'])} today={p['today']}")


if __name__ == "__main__":
    main()
