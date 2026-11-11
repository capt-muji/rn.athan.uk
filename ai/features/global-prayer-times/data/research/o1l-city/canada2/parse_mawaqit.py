#!/usr/bin/env python3
"""Flatten mawaqit confData calendars captured as raw pages into dated rows.

Year comes from the page's own lastUpdated epoch. The gate is the page's rendered
`times` array: the calendar row it equals names the capture day.
"""
import json, os, re, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(HERE, "captures")
DATA = os.path.join(HERE, "data")
DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

TARGETS = [
    ("MB", "Winnipeg", "waverley-grand-masjid-winnipeg-r3y-1s3-canada"),
    ("MB", "Winnipeg", "al-haqq-masjid-winnipeg-r3y-1g4-canada"),
    ("MB", "Winnipeg", "rahma-wpg"),
    ("MB", "Winnipeg", "manitoba-dawah-center-winnipeg-r3b-2l3-canada"),
    ("SK", "Regina", "al-ummah-islamic-center-regina-s4p-1t4-canada"),
    ("NS", "Dartmouth", "coleharbour-muslim-community-dartmouth-b2v-1m9-canada"),
    ("NB", "Moncton", "moncton-masjid-moncton-e1c-1m6-canada"),
    ("NB", "Moncton", "masjid-yusuf-moncton-e1a-4p8-canada"),
    ("NB", "Moncton", "north-end-mussallah-moncton-e1g-4w4-canada"),
    ("NB", "Moncton", "hassnain-e-karimain-masjid-hk-masjid-moncton-e1c-3s4-canada"),
    ("PE", "Charlottetown", "dar-as-salam-mosque-charlottetown-c1e-2a1-canada"),
    ("ON", "Kingston", "islamic-centre-of-kingston-kingston-k7l-4v4-canada"),
    ("QC", "Trois-Rivieres", "ccim3r"),
    ("QC", "Trois-Rivieres", "assounna-annabawiyya-3r"),
    ("QC", "Sherbrooke", "annour-sherbrooke"),
]


def extract_conf(html):
    i = html.find("confData = ")
    if i < 0:
        return None
    start = html.index("{", i)
    depth = 0
    j = start
    while j < len(html):
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
            j = k + 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(html[start:j + 1])
        j += 1
    return None


def main():
    os.makedirs(DATA, exist_ok=True)
    manifest = open(os.path.join(HERE, "manifest-mawaqit.tsv"), "w")
    manifest.write("prov\tcity\tslug\tyear\trows\tgate_day\tgate\tlat\tlon\ttz\tfile\n")
    for prov, city, slug in TARGETS:
        raw = os.path.join(CAP, f"probe_mq_{slug}.html")
        if not os.path.exists(raw):
            manifest.write(f"{prov}\t{city}\t{slug}\t\t0\t\tNO-CAPTURE\t\t\t\t\n")
            continue
        html = open(raw, encoding="utf-8", errors="ignore").read()
        conf = extract_conf(html)
        if not conf or "calendar" not in conf:
            manifest.write(f"{prov}\t{city}\t{slug}\t\t0\t\tNO-CONF\t\t\t\t\n")
            continue
        m = re.search(r"lastUpdated = (\d+)", html)
        year = datetime.datetime.fromtimestamp(int(m.group(1)), datetime.UTC).year if m else None
        cal = conf["calendar"]
        times = conf.get("times") or []
        gate_day, gate = "", "FAIL"
        for mi, month in enumerate(cal):
            for d, row in month.items():
                if [row[0]] + row[2:] == times[:5]:
                    gate_day = f"{year}-{mi+1:02d}-{int(d):02d}"
                    gate = "PASS"
                    break
            if gate_day:
                break
        leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
        rows = {}
        for mi, month in enumerate(cal):
            dim = 29 if (mi == 1 and leap) else DIM[mi]
            for d in range(1, dim + 1):
                r = month.get(str(d))
                if not r:
                    continue
                rows[f"{year}-{mi+1:02d}-{d:02d}"] = dict(
                    fajr=r[0], sunrise=r[1], dhuhr=r[2], asr=r[3], maghrib=r[4], isha=r[5])
        lat = re.search(r"latitude = ([\d.-]+)", html)
        lon = re.search(r"longitude = ([\d.-]+)", html)
        tz = re.search(r'"timezone":"([^"]+)"', html)
        out = os.path.join(DATA, f"mawaqit-{prov.lower()}-{city.lower()}-{slug[:24]}-{year}.json")
        json.dump(rows, open(out, "w"), indent=0, sort_keys=True)
        manifest.write("\t".join(map(str, [prov, city, slug, year, len(rows), gate_day, gate,
                                           lat.group(1) if lat else "", lon.group(1) if lon else "",
                                           (tz.group(1).replace("\\/", "/") if tz else ""),
                                           os.path.basename(out)])) + "\n")
        manifest.flush()
        print("ok", prov, city, slug, year, len(rows), gate, gate_day)
    manifest.close()


if __name__ == "__main__":
    main()
