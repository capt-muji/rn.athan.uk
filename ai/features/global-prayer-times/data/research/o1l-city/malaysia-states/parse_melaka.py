#!/usr/bin/env python3
"""Parse the Jabatan Mufti Melaka annual takwim PDFs (1446H/1447H editions) into dated rows.

Layout: each page carries six one-hijri-month blocks (three column bands x two rows, right
to left). A block anchor prints like '(DISEMBER - JANUARI 2026)' — the year belongs to the
pair's LAST month. Rows are one day each with hijri day, masihi day, weekday and SEVEN
24-hour times. Column order is not fixed between blocks (the Ramadan-era and later blocks
mirror the morning columns), so times are classified by VALUE, never by position:
imsak = subuh - 10, syuruk ~ 7:0x, zuhur ~ 13:1x, asar ~ 16:3x, maghrib ~ 19:1x,
isyak ~ 20:3x. The masihi day is the day number whose computed weekday matches the
printed one. A bare month-name cell on a row marks that row's Gregorian month flip.
"""
import json, re, sys
from datetime import date, timedelta
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer

MASIHI = {"JANUARI": 1, "FEBRUARI": 2, "MAC": 3, "APRIL": 4, "MEI": 5, "JUN": 6,
          "JULAI": 7, "OGOS": 8, "SEPTEMBER": 9, "OKTOBER": 10, "NOVEMBER": 11, "DISEMBER": 12}
MONTH_LABEL = re.compile(r"^(" + "|".join(MASIHI) + r")$")
TIME = re.compile(r"^(\d{1,2})[.:](\d{2})$")
WEEKDAYS = {"ISNIN": 0, "SELASA": 1, "RABU": 2, "KHAMIS": 3, "JUMAAT": 4, "SABTU": 5, "AHAD": 6}
ANCHOR = re.compile(r"^\(([A-Z]+)\s*-\s*([A-Z]+)\s+(\d{4})\)$")


def page_cells(page):
    cells = []
    for el in page:
        if isinstance(el, LTTextContainer):
            for line in el:
                if hasattr(line, "get_text"):
                    t = line.get_text().strip()
                    if t:
                        cells.append((line.x0, line.y0, t))
    return cells


def group_rows(cells, x0, x1):
    rows = []
    band = sorted((c for c in cells if x0 <= c[0] < x1), key=lambda c: -c[1])
    cur, cury = [], None
    for x, y, t in band:
        if cury is not None and abs(y - cury) > 10:
            rows.append(cur)
            cur = []
        cur.append((x, y, t))
        cury = y
    if cur:
        rows.append(cur)
    return rows


def classify_times(items):
    vals = []
    for x, t in items:
        m = TIME.match(t)
        if m:
            vals.append((int(m.group(1)) * 60 + int(m.group(2)), f"{m.group(1).zfill(2)}:{m.group(2)}"))
    if len(vals) != 7:
        return None
    vals.sort()
    # the two earliest values are the imsak/subuh pair (imsak = subuh - 10, always)
    imsak, subuh = vals[0][1], vals[1][1]
    out = {"imsak": imsak, "subuh": subuh}
    single = {"syuruk": (6 * 60 + 40, 7 * 60 + 35), "zuhur": (12 * 60 + 50, 13 * 60 + 30),
              "asar": (16 * 60, 17 * 60), "magrib": (18 * 60 + 50, 19 * 60 + 35),
              "isyak": (20 * 60 + 5, 21 * 60)}
    for col, (lo, hi) in single.items():
        hits = [s for v, s in vals[2:] if lo <= v <= hi]
        if len(hits) != 1:
            return None
        out[col] = hits[0]
    return out


def parse(path):
    prev_day = None
    out = {}
    for pi, page in enumerate(extract_pages(path)):
        cells = page_cells(page)
        anchors = []
        for x, y, t in cells:
            m = ANCHOR.match(t)
            if m and m.group(1) in MASIHI and m.group(2) in MASIHI:
                anchors.append((x, y, m))
        # blocks sit right-to-left on the page; process them in masihi order for continuity
        prep = []
        for ax, ay, am in anchors:
            months = [MASIHI[am.group(1)], MASIHI[am.group(2)]]
            first = months[0]
            base_year = int(am.group(3)) - 1 if first > months[1] else int(am.group(3))
            prep.append((base_year, first, ax, ay, am, months))
        prep.sort(key=lambda p: (p[0], p[1]))
        for ax, ay, am, months in [(p[2], p[3], p[4], p[5]) for p in prep]:
            below = [y2 for x2, y2, _ in anchors if abs(x2 - ax) < 200 and y2 < ay - 20]
            y_stop = min(below) + 6 if below else -1
            first = months[0]
            base_year = int(am.group(3)) - 1 if first > months[1] else int(am.group(3))
            cur_month = first
            prev = prev_day
            for row in group_rows(cells, ax - 25, ax + 470):
                if not (y_stop <= row[0][1] <= ay + 6):
                    continue
                items = [(x - ax, t) for x, y, t in sorted(row)]
                label = next((t for x, t in items if MONTH_LABEL.match(t)), None)
                if label:
                    cur_month = MASIHI[label]
                year = base_year + (1 if cur_month < first else 0)
                wd_x = next((x for x, t in items if t in WEEKDAYS), None)
                wd = next((WEEKDAYS[t] for x, t in items if t in WEEKDAYS), None)
                if wd is None:
                    continue
                times = classify_times(items)
                if times is None:
                    continue
                # the day pair sits left of the weekday cell: hijri day then masihi day
                pair = sorted((x, int(t)) for x, t in items
                              if t.isdigit() and 1 <= int(t) <= 31 and x < wd_x - 5)
                day = None
                for _, v in reversed(pair):
                    try:
                        if date(year, cur_month, v).weekday() == wd:
                            day = v
                            break
                    except ValueError:
                        continue
                if day is None:
                    continue
                if prev is not None and (date(year, cur_month, day) - prev).days != 1:
                    raise SystemExit(f"{path}: break {prev} -> {year}-{cur_month}-{day} ({am.group(0)})")
                iso = date(year, cur_month, day).isoformat()
                if iso in out:
                    raise SystemExit(f"{path}: duplicate {iso}")
                out[iso] = {"fajr": times["subuh"], "sunrise": times["syuruk"],
                            "dhuhr": times["zuhur"], "asr": times["asar"],
                            "magrib": times["magrib"], "isha": times["isyak"]}
                prev = date(year, cur_month, day)
            if prev is not None:
                prev_day = prev
    return out


if __name__ == "__main__":
    out = parse(sys.argv[1])
    keys = sorted(out)
    print(f"{len(keys)} rows {keys[0]}..{keys[-1]}")
    json.dump(out, open(sys.argv[2], "w"), indent=0, sort_keys=True)
    print(f"-> {sys.argv[2]}")
