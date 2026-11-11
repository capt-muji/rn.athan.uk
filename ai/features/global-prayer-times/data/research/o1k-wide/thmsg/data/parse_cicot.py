"""Parse the CICOT (Office of the Chularajmontri) per-province XLSX, as flattened to
markdown text by a text-extraction reader. Each month prints two side-by-side blocks:
the normal-year block (February 28 days) then the leap-year block (February 29 days).
Columns in both blocks: date, maghrib, isha, subuh, syuruk, dhuhr, asr.
"""
import datetime
import json
import re
import sys

MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
ROW = re.compile(r"^\s*(\d{1,2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+"
                 r"(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})(?:\s+(\d{1,2})\s+"
                 r"(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+"
                 r"(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2}))?")


def pad(t):
    h, m = t.split(":")
    return f"{int(h):02d}:{m}"


def parse(path, year):
    rows = {}
    month = None
    leap_month = None
    for line in open(path, encoding="utf-8"):
        found = [i + 1 for i, name in enumerate(MONTHS) if name in line]
        if found and not ROW.match(line):
            month = found[0]
            continue
        m = ROW.match(line)
        if not m or month is None:
            continue
        d = int(m.group(1))
        key = f"{year}-{month:02d}-{d:02d}"
        try:
            datetime.date.fromisoformat(key)
        except ValueError:
            continue
        rows[key] = {
            "magrib": pad(m.group(2)), "isha": pad(m.group(3)), "fajr": pad(m.group(4)),
            "sunrise": pad(m.group(5)), "dhuhr": pad(m.group(6)), "asr": pad(m.group(7)),
        }
    return dict(sorted(rows.items()))


if __name__ == "__main__":
    rows = parse(sys.argv[1], sys.argv[3])
    json.dump(rows, open(sys.argv[2], "w"), indent=0)
    order = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
    bad = [k for k, v in rows.items()
           if any(v[order[i]] >= v[order[i + 1]] for i in range(len(order) - 1))]
    print(sys.argv[2], len(rows), list(rows)[:1], "nonmono", len(bad), bad[:3])
