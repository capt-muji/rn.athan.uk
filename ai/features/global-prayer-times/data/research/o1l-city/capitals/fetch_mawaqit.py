#!/usr/bin/env python3
"""Capture mawaqit mosque pages for capital cities and flatten the embedded conf calendar.

Year comes from the page's own lastUpdated epoch (a literal in the capture), never the
system clock. The live-page gate is the page's rendered `times` array: the calendar row it
equals fixes the capture day, and that row must match byte-for-byte.
"""
import json, os, re, sys, datetime, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(HERE, "captures")
DATA = os.path.join(HERE, "data")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

TARGETS = [
    ("CA", "Ottawa", "ottawa-main-mosque-oma-ottawa-k1y-0m1-canada", "America/Toronto"),
    ("PS", "Jerusalem", "jam-shwman-jerusalem-5345645-palestinian-territories", "Asia/Hebron"),
    ("CM", "Yaounde", "mosquee-hlm-waounde", "Africa/Douala"),
    ("LV", "Riga", "latvijas-islama-kulturas-centrs-riga-lv1001-latvia", "Europe/Riga"),
    ("MK", "Skopje", "xhamia-ikre-saraj-skopje-1000-north-macedonia", "Europe/Skopje"),
    ("MD", "Chisinau", "muftiatul-musulmanilor-din-moldova", "Europe/Chisinau"),
    ("HU", "Budapest", "budapest", "Europe/Budapest"),
    ("CZ", "Prague", "al-nour-mosque-mesita-al-nour-prague-110-00-czechia", "Europe/Prague"),
    ("PL", "Warsaw", "osrodek-kultury-muzulmanskie-warsaw-02-389-poland", "Europe/Warsaw"),
    ("RO", "Bucharest", "msjd-lrhmn-moscheea-ar-rahman-bucuresti-060316-romania", "Europe/Bucharest"),
    ("ER", "Asmara", "masjid-al-khifa-al-rashidin-abbashawel-asmara-eritrea", "Africa/Asmara"),
    ("CV", "Praia", "aides-islamic-center-praia-cape-verde", "Atlantic/Cape_Verde"),
    ("KM", "Moroni", "msjd-ljm-sima-97300-comoros", "Indian/Comoros"),
    ("UY", "Montevideo", "al-musallah-al-haazimi-11100-departamento-de-montevideo-uruguay", "America/Montevideo"),
    ("NI", "Managua", "mezquita-de-managua-14038-managua-nicaragua", "America/Managua"),
    ("AR", "Buenos Aires", "haazimi-musallah-buenos-aires-c1214", "America/Argentina/Buenos_Aires"),
    ("SY", "Damascus", "anwar-akkad-mosque-damascus-00963-syria", "Asia/Damascus"),
    ("AE", "Abu Dhabi", "masjid-suhail-mohammed-darwish-al-mazrouei-971-sweihan-abu-dhabi-united-arab-emirates", "Asia/Dubai"),
]

DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def fetch(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    open(path, "wb").write(body)
    return body.decode("utf-8", "ignore")


def extract_conf(html):
    i = html.find("confData = ")
    if i < 0:
        return None
    start = html.index("{", i)
    depth = 0
    for j in range(start, len(html)):
        c = html[j]
        if c == '"':
            # skip string
            k = j + 1
            while k < len(html):
                if html[k] == "\\":
                    k += 2
                    continue
                if html[k] == '"':
                    break
                k += 1
            j = k
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(html[start:j + 1])
    return None


def main():
    os.makedirs(CAP, exist_ok=True)
    os.makedirs(DATA, exist_ok=True)
    manifest = open(os.path.join(HERE, "manifest.tsv"), "w")
    manifest.write("cc\tcity\tslug\tyear\trows\tgate_day\tgate\tfile\tbytes\n")
    for cc, city, slug, tz in TARGETS:
        url = f"https://mawaqit.net/en/{slug}"
        raw = os.path.join(CAP, f"mawaqit_{cc.lower()}_{slug[:40]}.html")
        try:
            html = fetch(url, raw)
        except Exception as e:
            manifest.write(f"{cc}\t{city}\t{slug}\t\t0\t\tERR {e}\t\t0\n")
            print("ERR fetch", city, e)
            continue
        conf = extract_conf(html)
        if not conf or "calendar" not in conf:
            manifest.write(f"{cc}\t{city}\t{slug}\t\t0\t\tERR no-conf\t\t{os.path.getsize(raw)}\n")
            print("ERR conf", city)
            continue
        m = re.search(r"lastUpdated = (\d+)", html)
        year = datetime.datetime.fromtimestamp(int(m.group(1)), datetime.UTC).year if m else None
        if not year:
            manifest.write(f"{cc}\t{city}\t{slug}\t\t0\t\tERR no-year\t\t{os.path.getsize(raw)}\n")
            continue
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
        rows = {}
        leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
        for mi, month in enumerate(cal):
            dim = 29 if (mi == 1 and leap) else DIM[mi]
            for d in range(1, dim + 1):
                r = month.get(str(d))
                if not r:
                    continue
                rows[f"{year}-{mi+1:02d}-{d:02d}"] = dict(
                    fajr=r[0], sunrise=r[1], dhuhr=r[2], asr=r[3], maghrib=r[4], isha=r[5])
        out = os.path.join(DATA, f"mawaqit-{cc.lower()}-{city.lower().replace(' ','-')}-{year}.json")
        json.dump(rows, open(out, "w"), indent=0, sort_keys=True)
        manifest.write(f"{cc}\t{city}\t{slug}\t{year}\t{len(rows)}\t{gate_day}\t{gate}\t{os.path.basename(out)}\t{os.path.getsize(raw)}\n")
        manifest.flush()
        print("ok", cc, city, year, len(rows), "gate", gate, gate_day)
    manifest.close()


if __name__ == "__main__":
    main()
