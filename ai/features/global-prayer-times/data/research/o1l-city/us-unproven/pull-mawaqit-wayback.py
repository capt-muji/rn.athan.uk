#!/usr/bin/env python3
"""Harvest a prior-year mawaqit calendar from the Wayback snapshot of each mosque page.

confData is rebuilt per request against the capture year, so a 2025 snapshot carries
the 2025 table. The year is read from the snapshot's own calendar keys, never guessed.
"""
import os, re, json, urllib.request, time

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "mawaqit-wayback")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)

SLUGS = [
    ("Detroit", "tawheed-center-detroit"),
    ("Gainesville", "hoda-center-gainesville-42608-united-states"),
    ("New Orleans", "islamic-center-of-new-orleans-new-orleans-70116-1541-united-states"),
    ("Rochester", "ic-rochester"),
    ("Albany", "muna-center-of-albany-schenectady-12308-united-states"),
    ("Baltimore", "masjid-e-bilal-baltimore-21225-united-states"),
    ("Baltimore", "masjied-al-ihsan-baltimore-21207-united-states"),
    ("Dearborn", "islamic-house-of-wisdom-dearborn-heights"),
]


def cdx(slug):
    url = ("http://web.archive.org/cdx/search/cdx?url=mawaqit.net/en/"
           f"{slug}&output=json&filter=statuscode:200&collapse=timestamp:6")
    with urllib.request.urlopen(url, timeout=60) as r:
        rows = json.load(r)
    return [x[1] for x in rows[1:]]


def conf(html):
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
    for metro, slug in SLUGS:
        try:
            stamps = [s for s in cdx(slug) if s[:4] in ("2025", "2024")]
        except Exception as e:
            print("CDXFAIL", slug, type(e).__name__)
            continue
        if not stamps:
            print("NOARCHIVE", metro, slug)
            continue
        ts = sorted(stamps)[-1]
        url = f"http://web.archive.org/web/{ts}id_/https://mawaqit.net/en/{slug}"
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=90) as r:
                html = r.read().decode("utf-8", "ignore")
        except Exception as e:
            print("FETCHFAIL", metro, slug, ts, type(e).__name__)
            continue
        open(os.path.join(RAW, f"{slug}-{ts}.html"), "w").write(html)
        d = conf(html)
        if not d:
            print("NOCONF", metro, slug, ts, len(html))
            continue
        json.dump({"metro": metro, "slug": slug, "snapshot": ts, "year": ts[:4],
                   "name": d.get("name"), "latitude": d.get("latitude"),
                   "longitude": d.get("longitude"), "timezone": d.get("timezone"),
                   "calendar": d.get("calendar"),
                   "source": f"http://web.archive.org/web/{ts}/https://mawaqit.net/en/{slug}"},
                  open(os.path.join(OUT, f"{metro}-{slug}-mawaqit-{ts[:4]}.json"), "w"), indent=1)
        print(metro, slug, ts, "months", len(d.get("calendar") or []))
        time.sleep(1)


if __name__ == "__main__":
    main()
