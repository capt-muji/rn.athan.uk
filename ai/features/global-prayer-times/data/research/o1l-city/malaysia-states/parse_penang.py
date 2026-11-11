#!/usr/bin/env python3
"""Parse the Jabatan Mufti Penang 1448H takwim grid PDF into dated rows.

Layout (pdfminer coordinates): one day per row. Columns by x: Gregorian day/anchor,
isyak, maghrib, asar, zohor, syuruk, subuh, hijri day, weekday (Arabic). Times print a
12-hour clock without meridiem; the afternoon columns carry PM. Month anchors appear in
the Gregorian column at month rollover ('17 JUN', '1 JUL'); bare numbers continue the
running month. The pypdf reading order is the trap this parser avoids: it interleaves
week-columns and never yields one row per day.
"""
import json, re, sys
from datetime import date
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer

MONTHS = {"JAN": 1, "FEB": 2, "MAC": 3, "APR": 4, "MEI": 5, "JUN": 6, "JUL": 7,
          "OGO": 8, "OGS": 8, "SEP": 9, "OKT": 10, "NOV": 11, "DIS": 12}
TIME = re.compile(r"^(\d{1,2}):(\d{2})$")
PM = {"dhuhr", "asr", "magrib", "isha"}
XCOLS = {"isha": (280, 340), "magrib": (345, 400), "asr": (410, 465),
         "dhuhr": (470, 525), "sunrise": (535, 590), "fajr": (600, 655)}
X_HIJRI = (665, 700)
X_GREG = (210, 270)


def page_rows(page, pi):
    cells = []
    for el in page:
        if isinstance(el, LTTextContainer):
            for line in el:
                if hasattr(line, "get_text"):
                    t = line.get_text().strip()
                    if t:
                        cells.append((line.x0, line.y0, t))
    grid = [(x, y, t) for x, y, t in cells if 210 <= x <= 700 and y >= 170]
    rowsy = {}
    for x, y, t in grid:
        key = next((k for k in rowsy if abs(k - y) < 8), None)
        if key is None:
            rowsy[y] = [(x, t)]
        else:
            rowsy[key].append((x, t))
    out = []
    for yk in sorted(rowsy, reverse=True):
        items = sorted(rowsy[yk])
        hijri = next((t for x, t in items if X_HIJRI[0] <= x <= X_HIJRI[1] and t.isdigit()), None)
        row = {"hijri": int(hijri) if hijri else None, "page": pi + 1}
        row["greg"] = next((t for x, t in items if X_GREG[0] <= x <= X_GREG[1]), "")
        row["items"] = items
        out.append(row)
    return out


def timed(row):
    out = {}
    for col, (x0, x1) in XCOLS.items():
        v = next((t for x, t in row["items"] if x0 <= x <= x1), None)
        if v is None or not TIME.match(v):
            return None
        h, m = map(int, TIME.match(v).groups())
        if col in PM and h < 12:
            h += 12
        out[col] = f"{h:02d}:{m:02d}"
    return out


def to_dates(rows, start_year=2026):
    out = {}
    year = month = None
    prev = None
    for r in rows:
        m = re.match(r"^(\d{1,2})\s+([A-Z]+)$", r["greg"])
        if m:
            day = int(m.group(1))
            month = MONTHS[m.group(2)]
            if prev is not None and (month < prev.month or (month == 1 and prev.month == 12)):
                year += 1
            elif year is None:
                year = start_year
        else:
            if not r["greg"].isdigit():
                raise SystemExit(f"bad greg cell {r['greg']!r} hijri {r['hijri']}")
            day = int(r["greg"])
            if month is None:
                raise SystemExit("no anchor before bare day")
        cur = date(year, month, day)
        if prev is not None and (cur - prev).days != 1:
            print(f"WARN non-consecutive: {prev} -> {cur} (hijri {r['hijri']}, page {r['page']})")
        key = cur.isoformat()
        if key in out:
            raise SystemExit(f"duplicate {key}")
        out[key] = {c: r["times"][c] for c in ("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha")}
        prev = cur
    return out


if __name__ == "__main__":
    all_rows = []
    for pi, page in enumerate(extract_pages(sys.argv[1])):
        if pi == 0:
            continue
        for row in page_rows(page, pi):
            times = timed(row)
            if times is None:
                if len(row["items"]) > 1:
                    print(f"WARN page {row['page']}: non-data row {row['items']}")
                continue
            if row["greg"] == "":
                print(f"WARN page {row['page']}: no greg cell, hijri {row['hijri']}")
            row["times"] = times
            all_rows.append(row)
    out = to_dates(all_rows)
    keys = sorted(out)
    print(f"{len(keys)} rows {keys[0]}..{keys[-1]}")
    json.dump(out, open(sys.argv[2], "w"), indent=0, sort_keys=True)
    print(f"-> {sys.argv[2]}")
