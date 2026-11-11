"""Parse a CICOT per-province XLSX (Office of the Chularajmontri, 77-province set).

One sheet. Row 1 carries the province and its printed coordinate. Each month prints two
side-by-side blocks: A..G the normal-year block (February 28 days), I..O the leap-year block
(February 29 days). Columns in each block: date, maghrib, isha, subuh, syuruk, dhuhr, asr.
Times are Excel day fractions, so this reads the computed value rather than a printed string.
"""
import datetime
import json
import re
import sys
import zipfile

MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
FIELDS = ["magrib", "isha", "fajr", "sunrise", "dhuhr", "asr"]
NORMAL_COLS = ["A", "B", "C", "D", "E", "F", "G"]
LEAP_COLS = ["I", "J", "K", "L", "M", "N", "O"]


def read_sheet(path):
    z = zipfile.ZipFile(path)
    shared = [''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S))
              for si in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode(), re.S)]
    sheet = z.read('xl/worksheets/sheet1.xml').decode()
    rows = []
    for rn, body in re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', sheet, re.S):
        cells = {}
        for col, attrs, v in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(?:<v>(.*?)</v>)?</c>', body, re.S):
            if v is None:
                continue
            cells[col] = shared[int(v)] if 't="s"' in attrs else v
        rows.append((int(rn), cells))
    return rows


def clock(frac):
    m = round(float(frac) * 1440) % 1440
    return f"{m // 60:02d}:{m % 60:02d}"


def block(cells, cols, year, month, out):
    raw = [cells.get(c) for c in cols]
    if any(v is None for v in raw):
        return
    day = int(float(raw[0]))
    key = f"{year}-{month:02d}-{day:02d}"
    try:
        datetime.date.fromisoformat(key)
    except ValueError:
        return
    out[key] = {f: clock(raw[i + 1]) for i, f in enumerate(FIELDS)}


def parse(path):
    month = None
    normal, leap, header = {}, {}, None
    for rn, cells in read_sheet(path):
        label = cells.get("A", "")
        if rn == 1:
            header = label
            continue
        if label in MONTHS:
            month = MONTHS.index(label) + 1
            continue
        if month == None:
            continue
        if re.fullmatch(r"\d+(\.0+)?", label or ""):
            block(cells, NORMAL_COLS, 2026, month, normal)
        if re.fullmatch(r"\d+(\.0+)?", cells.get("I", "") or ""):
            block(cells, LEAP_COLS, 2028, month, leap)
    return header, dict(sorted(normal.items())), dict(sorted(leap.items()))


def check(rows, expect):
    order = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
    breaks = [k for k, v in rows.items()
              if any(v[order[i]] >= v[order[i + 1]] for i in range(len(order) - 1))]
    return len(rows) == expect and not breaks


if __name__ == "__main__":
    header, normal, leap = parse(sys.argv[1])
    print(header)
    print("normal", len(normal), check(normal, 365), "leap", len(leap), check(leap, 366))
    if len(sys.argv) > 2:
        json.dump(normal, open(f"{sys.argv[2]}-normal.json", "w"), indent=0)
        json.dump(leap, open(f"{sys.argv[2]}-leap.json", "w"), indent=0)
