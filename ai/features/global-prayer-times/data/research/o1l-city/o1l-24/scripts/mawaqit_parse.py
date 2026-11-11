#!/usr/bin/env python3
"""Parse a saved mawaqit mosque page into normalized dated rows.

confData.calendar is 12 month objects keyed "1".."12", each mapping day-of-month
to [fajr, shuruq, dhuhr, asr, maghrib, isha] as printed by the mosque.
Year is not printed; the caller passes it.
"""
import json
import re
import sys

COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]


def load(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    i = s.find("let confData = ")
    if i < 0:
        raise SystemExit(f"{path}: no confData")
    j = s.find("\n", i)
    blob = s[i + len("let confData = "):j].rstrip().rstrip(";")
    return json.loads(blob)


def main():
    path, out, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
    d = load(path)
    cal = d["calendar"]
    days = {}
    for mi, month in enumerate(cal, start=1):
        for dom, row in month.items():
            key = f"{year:04d}-{mi:02d}-{int(dom):02d}"
            days[key] = dict(zip(COLS, row))
    payload = {
        "label": d.get("name"),
        "country": d.get("countryCode"),
        "lat": d.get("latitude"),
        "lon": d.get("longitude"),
        "tz": d.get("timezone"),
        "jumua": d.get("jumua"),
        "jumua2": d.get("jumua2"),
        "year": year,
        "days": dict(sorted(days.items())),
    }
    json.dump(payload, open(out, "w"), indent=1)
    print(f"{out}: {len(days)} rows {min(days)}..{max(days)} {payload['label']} {payload['lat']},{payload['lon']}")


if __name__ == "__main__":
    main()
