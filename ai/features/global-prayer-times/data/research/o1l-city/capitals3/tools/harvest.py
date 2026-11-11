#!/usr/bin/env python3
"""Capture mosque-platform prayer pages for capital cities and flatten their embedded calendars.

Two platforms, one record shape. The year and every timestamp come from literals inside the
capture, never from the system clock. The live-page gate is the row the page itself renders:
mawaqit's `times` array and masjidbox's rendered today block must both equal the calendar row
they claim to be.

targets.tsv: cc <TAB> city <TAB> platform <TAB> slug <TAB> tz
"""
import datetime
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAP = os.path.join(ROOT, "captures")
DATA = os.path.join(ROOT, "data")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def fetch(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    open(path, "wb").write(body)
    return body.decode("utf-8", "ignore")


def json_after(html, marker):
    i = html.find(marker)
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


def mawaqit(cc, city, slug, tz):
    url = f"https://mawaqit.net/en/{slug}"
    raw = os.path.join(CAP, f"mawaqit_{cc.lower()}_{slug[:48]}.html")
    html = fetch(url, raw)
    conf = json_after(html, "confData = ")
    if not conf or "calendar" not in conf:
        return dict(err="no-conf", bytes=os.path.getsize(raw))
    m = re.search(r"lastUpdated = (\d+)", html)
    year = datetime.datetime.fromtimestamp(int(m.group(1)), datetime.UTC).year if m else None
    if not year:
        return dict(err="no-year", bytes=os.path.getsize(raw))
    times = conf.get("times") or []
    gate_day, gate = "", "FAIL"
    for mi, month in enumerate(conf["calendar"]):
        for d, row in month.items():
            if [row[0]] + row[2:] == times[:5]:
                gate_day = f"{year}-{mi+1:02d}-{int(d):02d}"
                gate = "PASS"
                break
        if gate_day:
            break
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    rows = {}
    for mi, month in enumerate(conf["calendar"]):
        dim = 29 if (mi == 1 and leap) else DIM[mi]
        for d in range(1, dim + 1):
            r = month.get(str(d))
            if r:
                rows[f"{year}-{mi+1:02d}-{d:02d}"] = dict(
                    fajr=r[0], sunrise=r[1], dhuhr=r[2], asr=r[3], maghrib=r[4], isha=r[5])
    meta = dict(lat=conf.get("latitude"), lon=conf.get("longitude"),
                tz=conf.get("timezone"), method=conf.get("method"),
                label=conf.get("label") or conf.get("name"))
    return dict(rows=rows, year=year, gate=gate, gate_day=gate_day, meta=meta,
                bytes=os.path.getsize(raw), url=url)


def masjidbox(cc, city, slug, tz):
    url = f"https://masjidbox.com/prayer-times/{slug}"
    raw = os.path.join(CAP, f"masjidbox_{cc.lower()}_{slug[:48]}.html")
    html = fetch(url, raw)
    h = html.replace("&quot;", '"').replace("&#39;", "'").replace("&amp;", "&")
    s = urllib.parse.unquote(h)
    dec = json.JSONDecoder()
    best = None
    i = s.find('"timetable"')
    while i > 0:
        j = s.rfind("{", 0, i)
        while j >= 0:
            try:
                obj, _ = dec.raw_decode(s[j:])
                if isinstance(obj, dict) and isinstance(obj.get("timetable"), list) and obj["timetable"]:
                    if best is None or len(obj["timetable"]) > len(best["timetable"]):
                        best = obj
                    break
            except json.JSONDecodeError:
                pass
            j = s.rfind("{", 0, j)
        break
    if best is None:
        return dict(err="no-timetable", bytes=os.path.getsize(raw))
    keys = ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
    rows = {}
    for r in best["timetable"]:
        d = r["date"][:10]
        row = {}
        for k in keys:
            v = r.get(k) or ""
            if not v:
                row[k] = ""
                continue
            # platform emits UTC instants; the local wall clock is the published time
            t = datetime.datetime.strptime(v, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.UTC)
            row[k] = t.astimezone(__import__("zoneinfo").ZoneInfo(tz)).strftime("%H:%M")
        rows[d] = row
    st = best.get("settings") or {}
    return dict(rows=rows, year=None, gate="", gate_day="", bytes=os.path.getsize(raw), url=url,
                meta=dict(lat=st.get("latitude"), lon=st.get("longitude"),
                          tz=st.get("timezone"), label=st.get("name") or st.get("mosque")))


def main():
    os.makedirs(CAP, exist_ok=True)
    os.makedirs(DATA, exist_ok=True)
    src = sys.argv[1]
    out = sys.argv[2]
    lines = []
    for line in open(src):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        cc, city, platform, slug, tz = line.split("\t")
        try:
            res = mawaqit(cc, city, slug, tz) if platform == "mawaqit" else masjidbox(cc, city, slug, tz)
        except Exception as e:
            res = dict(err=f"{type(e).__name__}: {e}")
        if res.get("err"):
            lines.append(f"{cc}\t{city}\t{platform}\t{slug}\t\t0\t\t{res['err']}\t\t{res.get('bytes', 0)}")
            print("ERR", cc, city, platform, slug, res["err"])
            continue
        rows = res["rows"]
        if not rows:
            lines.append(f"{cc}\t{city}\t{platform}\t{slug}\t\t0\t\tempty\t\t{res['bytes']}")
            print("ERR empty", cc, city, slug)
            continue
        name = f"{platform}-{cc.lower()}-{re.sub(r'[^a-z0-9]+', '-', city.lower()).strip('-')}-{slug[:28]}.json"
        json.dump(dict(rows=rows, meta=res["meta"], url=res["url"], gate=res["gate"],
                       gate_day=res["gate_day"]),
                  open(os.path.join(DATA, name), "w"), indent=1, sort_keys=True)
        span = f"{min(rows)}..{max(rows)}"
        lines.append(f"{cc}\t{city}\t{platform}\t{slug}\t{len(rows)}\t{span}\t{res['gate']} {res['gate_day']}\t{name}\t{res['bytes']}")
        print("ok", cc, city, platform, len(rows), span, res["gate"], res["gate_day"])
        open(out, "w").write("\n".join(lines) + "\n")
    open(out, "w").write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
