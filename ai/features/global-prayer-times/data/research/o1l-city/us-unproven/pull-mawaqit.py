#!/usr/bin/env python3
"""Capture mawaqit mosque pages and flatten the embedded confData calendar.

confData carries the publisher's own year table: calendar[monthIndex][day] =
[ fajr, dhuhr, asr, maghrib, isha, jumua, ... ] in local minutes-of-day with the
mosque's iqamah offsets already applied where the mosque set them.
"""
import os, re, json, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "mawaqit")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")

TARGETS = [
    ("Detroit", "tawheed-center-detroit"),
    ("Gainesville", "hoda-center-gainesville-42608-united-states"),
    ("New Orleans", "islamic-center-of-new-orleans-new-orleans-70116-1541-united-states"),
    ("Rochester", "ic-rochester"),
    ("Albany", "muna-center-of-albany-schenectady-12308-united-states"),
    ("Baltimore", "masjid-e-bilal-baltimore-21225-united-states"),
    ("Baltimore", "masjied-al-ihsan-baltimore-21207-united-states"),
    ("Dearborn", "islamic-house-of-wisdom-dearborn-heights"),
]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "ignore")


def extract_conf(html):
    i = html.find("confData = ")
    if i < 0:
        return None
    start = html.index("{", i)
    depth = 0
    for j in range(start, len(html)):
        c = html[j]
        if c == '"':
            k = j + 1
            while k < len(html):
                if html[k] == "\\":
                    k += 2
                    continue
                if html[k] == '"':
                    break
                k += 1
            j = k
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(html[start:j + 1])
    return None


def main():
    for metro, slug in TARGETS:
        url = f"https://mawaqit.net/en/{slug}"
        try:
            html = get(url)
        except Exception as e:
            print("FAIL", metro, slug, type(e).__name__)
            continue
        open(os.path.join(RAW, f"{metro}-{slug}.html"), "w").write(html)
        conf = extract_conf(html)
        if not conf:
            print("NOCONF", metro, slug, len(html))
            continue
        cal = conf.get("calendar") or []
        if isinstance(cal, dict):
            cal = [cal[str(i)] for i in range(1, 13) if str(i) in cal]
        json.dump({"metro": metro, "slug": slug, "url": url,
                   "name": conf.get("name"), "latitude": conf.get("latitude"),
                   "longitude": conf.get("longitude"), "timezone": conf.get("timezone"),
                   "method": conf.get("method"), "iqama": conf.get("iqama"),
                   "calendar": cal}, open(os.path.join(OUT, f"{metro}-{slug}-mawaqit.json"), "w"), indent=1)
        print(metro, slug, "months", len(cal), "lat", conf.get("latitude"), conf.get("longitude"),
              "tz", conf.get("timezone"), "method", conf.get("method"), "days0", len(cal[0]) if cal else 0)


if __name__ == "__main__":
    main()
