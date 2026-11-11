#!/usr/bin/env python3
"""Normalize a JAKIM e-Solat takwimsolat JSON response into dated rows.

Input: captures/esolat-<year>-<zone>.json (prayerTime[] with DD-Mon-YYYY dates).
Output: data/my-<year>-<zone>.json  {'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}}
Malay month trap: Mac=March, Ogos=August, Dis=December (P4 on record).
"""
import json, re, sys
from datetime import date

MONTHS = {"JAN": 1, "FEB": 2, "MAC": 3, "APR": 4, "MEI": 5, "JUN": 6, "JUL": 7,
          "OGO": 8, "SEP": 9, "OKT": 10, "NOV": 11, "DIS": 12}
COLS = {"fajr": "fajr", "syuruk": "sunrise", "dhuhr": "dhuhr", "asr": "asr",
        "maghrib": "magrib", "isha": "isha"}


def norm(src, dest):
    payload = json.load(open(src))
    out = {}
    for row in payload["prayerTime"]:
        m = re.match(r"^(\d{2})-([A-Za-z]+)-(\d{4})$", row["date"])
        if not m:
            raise SystemExit(f"bad date {row['date']!r}")
        day, mon, year = int(m.group(1)), MONTHS[m.group(2)[:3].upper()], int(m.group(3))
        key = date(year, mon, day).isoformat()
        out[key] = {}
        for src_col, dst_col in COLS.items():
            t = row[src_col]
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", t):
                raise SystemExit(f"bad time {t!r} on {key} {src_col}")
            out[key][dst_col] = t[:5]
    if len(out) < 360:
        raise SystemExit(f"only {len(out)} rows")
    json.dump(out, open(dest, "w"), indent=0, sort_keys=True)
    print(f"{dest}: {len(out)} rows")


if __name__ == "__main__":
    norm(sys.argv[1], sys.argv[2])
