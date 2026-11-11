#!/usr/bin/env python3
"""Pull the Islamic Association of Raleigh prayer schedule (dated athan + iqamah).

The schedule page is a plain PHP month view: `prayer-schedule.php?month=M&year=YYYY`.
Rows carry day, weekday, Hijri date, then eleven time cells:
fajr athan, fajr iqamah, shuruq, dhuhr athan, dhuhr iqamah, asr athan,
asr iqamah, maghrib athan, maghrib iqamah, isha athan, isha iqamah.
"""
import os, re, sys, json, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "raleigh")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")
CELLS = ["fajr_athan", "fajr_iqamah", "sunrise", "dhuhr_athan", "dhuhr_iqamah",
         "asr_athan", "asr_iqamah", "maghrib_athan", "maghrib_iqamah",
         "isha_athan", "isha_iqamah"]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")


def main():
    years = [int(y) for y in sys.argv[1:]] or [2026]
    days = {}
    for y in years:
        for m in range(1, 13):
            url = f"https://raleighmasjid.org/prayer/prayer-schedule.php?month={m}&year={y}"
            try:
                html = get(url)
            except Exception as e:
                print("FAIL", y, m, type(e).__name__, flush=True)
                continue
            open(os.path.join(RAW, f"raleigh-{y}-{m:02d}.html"), "w").write(html)
            body = html[html.find("Prayer Schedule"):]
            got = 0
            for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
                cells = [re.sub(r"<[^>]+>", " ", c).strip() for c in
                         re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
                cells = [re.sub(r"\s+", " ", c) for c in cells]
                if len(cells) < 13:
                    continue
                m0 = re.match(r"^(\d{1,2})\s+[A-Z][a-z]{2}$", cells[0])
                if not m0:
                    continue
                times = [c for c in cells[2:] if re.fullmatch(r"\d{1,2}:\d{2}", c)]
                if len(times) != len(CELLS):
                    continue
                days[f"{y}-{m:02d}-{int(m0.group(1)):02d}"] = dict(zip(CELLS, times))
                got += 1
            print(y, m, got, flush=True)
    json.dump({"metro": "Raleigh", "source": "https://raleighmasjid.org/prayer/prayer-schedule.php",
               "publisher": "Islamic Association of Raleigh", "engine": "own",
               "days": days}, open(os.path.join(OUT, "Raleigh-iarb-prayer-schedule.json"), "w"), indent=1)
    print("rows", len(days))


if __name__ == "__main__":
    main()
