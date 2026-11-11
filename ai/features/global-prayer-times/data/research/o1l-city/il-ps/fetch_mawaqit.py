#!/usr/bin/env python3
"""Fetch mawaqit mosque pages, save raw, and fingerprint the embedded confData.

The fingerprint is what decides platform-default vs own-config: two pages in one
city whose calendar, iqama offsets and times array are identical are one platform
generation wearing two mosque names.
"""
import json
import re
import sys
import urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")


def grab(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept-Language": "ar,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def conf(html):
    i = html.find("confData = ")
    if i < 0:
        return None
    start = html.index("{", i)
    depth, j, instr, esc = 0, start, False, False
    while j < len(html):
        c = html[j]
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                instr = False
        else:
            if c == '"':
                instr = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(html[start:j + 1])
        j += 1
    return None


def main(slugs):
    out = {}
    for slug in slugs:
        url = f"https://mawaqit.net/en/m/{slug}"
        try:
            html = grab(url)
        except Exception as e:
            out[slug] = {"url": url, "error": str(e)}
            print(slug, "ERR", e, flush=True)
            continue
        raw = f"captures/mawaqit-{slug}.html"
        with open(raw, "w", encoding="utf-8") as f:
            f.write(html)
        c = conf(html)
        if not c:
            out[slug] = {"url": url, "error": "no confData", "bytes": len(html)}
            print(slug, "NOCONF", len(html), flush=True)
            continue
        cal = c.get("calendar") or {}
        out[slug] = {
            "url": url,
            "bytes": len(html),
            "name": c.get("name"),
            "label": c.get("label"),
            "lat": c.get("latitude"),
            "lon": c.get("longitude"),
            "tz": c.get("timezone"),
            "iqama": [c.get(f"iqama{i}") for i in range(1, 6)],
            "iqamaEnabled": c.get("iqamaEnabled"),
            "calendarMonths": sorted(cal.keys()) if isinstance(cal, dict) else None,
            "times": c.get("times"),
            "jumua": c.get("jumua"),
            "jumua2": c.get("jumua2"),
            "site": c.get("site"),
            "phone": c.get("phone"),
            "association": c.get("association"),
            "hijri": c.get("hijriCalendar"),
            "calendar": cal,
        }
        print(slug, "OK", c.get("name"), c.get("latitude"), c.get("longitude"),
              sorted(cal.keys()) if isinstance(cal, dict) else "", flush=True)
    with open("data/mawaqit-conf.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
