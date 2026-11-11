#!/usr/bin/env python3
"""Harvest masjidway monthly prayer tables (MMYYYY path) for one masjid id.

Paced for masjidway's rate limiter: 3 s between requests, long backoff on 5xx.
Existing capture files >5 KB are reused, so a rerun resumes.
"""
import json, os, re, sys, time, urllib.error, urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
MONTHS = {m: i + 1 for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July",
     "August", "September", "October", "November", "December"])}

ROW = re.compile(
    r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ([A-Z][a-z]+) (\d{1,2}), (\d{4})\s+"
    r"(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})")


def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 5000:
        return open(dest, encoding="utf-8", errors="replace").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode("utf-8", "replace")
            if len(body) > 5000:
                open(dest, "w", encoding="utf-8").write(body)
                return body
            print("  short body", len(body), flush=True)
        except urllib.error.HTTPError as e:
            print("  http", e.code, flush=True)
            if e.code in (429, 503, 502, 504):
                time.sleep(20 * (attempt + 1))
                continue
        except Exception as e:
            print("  err", e, flush=True)
        time.sleep(5)
    return None


def harvest(masjid, tag, years, outdir):
    caps = os.path.join(outdir, "captures")
    data = os.path.join(outdir, "data")
    os.makedirs(caps, exist_ok=True)
    os.makedirs(data, exist_ok=True)
    for y in years:
        rows = {}
        for m in range(1, 13):
            url = f"https://en.masjidway.com/masjid/{masjid}/prayer/{m:02d}{y}"
            dest = os.path.join(caps, f"masjidway_{tag}_{y}-{m:02d}.html")
            body = get(url, dest)
            if body is None:
                print(f"{tag} {y}-{m:02d} FAILED", flush=True)
                time.sleep(30)
                continue
            text = re.sub(r"<script.*?</script>", "", body, flags=re.S)
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"\s+", " ", text)
            got = 0
            for mon, day, yr, fajr, shuruq, dhuhr, asr, maghrib, isha in ROW.findall(text):
                if int(yr) != y or MONTHS.get(mon) != m:
                    continue
                rows[f"{y}-{m:02d}-{int(day):02d}"] = dict(
                    fajr=fajr, sunrise=shuruq, dhuhr=dhuhr, asr=asr,
                    maghrib=maghrib, isha=isha)
                got += 1
            print(f"{tag} {y}-{m:02d}: {got}", flush=True)
            time.sleep(3)
        if rows:
            json.dump(dict(sorted(rows.items())),
                      open(os.path.join(data, f"masjidway_{tag}_{y}.json"), "w"), indent=1)
            print(f"{tag} {y}: {len(rows)} rows written", flush=True)


if __name__ == "__main__":
    harvest(sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(",")], sys.argv[4])
