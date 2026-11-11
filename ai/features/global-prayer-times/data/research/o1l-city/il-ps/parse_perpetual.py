#!/usr/bin/env python3
"""Parse the Palestinian Dar al-Ifta / Awqaf al-Quds perpetual prayer table (2012).

The print is a 12-month perpetual calendar on Al-Aqsa's winter clock. Hours are
printed once and carried down the column until they change, so the parser keeps a
per-column hour register. Columns are identified by x position with tolerance,
never by token order; the month header is matched after stripping tatweel.
"""
import json
import re
import sys

import pypdf

MONTH_ORDER = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
               "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني",
               "كانون الأول"]

HOUR_X = {31.2: "isha", 59.2: "maghrib", 87.2: "asr", 115.7: "dhuhr",
          143.7: "sunrise", 171.2: "fajr"}
MIN_X = {45.1: "isha", 73.4: "maghrib", 101.8: "asr", 129.8: "dhuhr",
         157.3: "sunrise", 185.5: "fajr"}
DAY_X = 201.5
TOL = 1.5
PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]


def norm(text):
    return re.sub(r"[\u0640\u064B-\u0652]", "", text)


def column(x, table):
    best, dist = None, TOL
    for cx, name in table.items():
        d = abs(x - cx)
        if d <= dist:
            best, dist = name, d
    return best


def chunks_of(page):
    out = []

    def visit(text, cm, tm, fd, fs):
        t = text.strip()
        if t:
            out.append((round(tm[5], 1), round(tm[4], 1), t))

    page.extract_text(visitor_text=visit)
    return out


def month_of(chunks):
    for y, x, t in chunks:
        if y < 300:
            continue
        flat = norm(t)
        for i, name in enumerate(MONTH_ORDER, start=1):
            if norm(name) in flat:
                return i
    return None


def rows_of(chunks, hours, minutes):
    by_y = {}
    for y, x, t in chunks:
        if not re.fullmatch(r"\d{1,2}", t):
            continue
        by_y.setdefault(y, []).append((x, int(t)))
    rows = {}
    for y in sorted(by_y, reverse=True):
        cells = by_y[y]
        days = [v for x, v in cells if abs(x - DAY_X) <= TOL and 1 <= v <= 31]
        if not days:
            continue
        for x, v in cells:
            h = column(x, HOUR_X)
            if h and v <= 23:
                hours[h] = v
            m = column(x, MIN_X)
            if m and v <= 59:
                minutes[m] = v
        if len(hours) == 6 and len(minutes) == 6:
            rows[days[0]] = {p: f"{hours[p]:02d}:{minutes[p]:02d}" for p in PRAYERS}
    return rows


def main(pdf):
    r = pypdf.PdfReader(pdf)
    table, current = {}, None
    hours, minutes = {}, {}
    for page in r.pages:
        chunks = chunks_of(page)
        m = month_of(chunks)
        if m:
            current = m
        rows = rows_of(chunks, hours, minutes)
        if current and rows:
            for day, vals in rows.items():
                table.setdefault(current, {})[day] = vals
    out = {}
    for m, days in sorted(table.items()):
        for d, vals in sorted(days.items()):
            out[f"{m:02d}-{d:02d}"] = vals
    with open("data/jerusalem-awqaf-perpetual.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=0, sort_keys=True)
    print("months", {m: len(d) for m, d in sorted(table.items())}, "rows", len(out))


if __name__ == "__main__":
    main(sys.argv[1])
