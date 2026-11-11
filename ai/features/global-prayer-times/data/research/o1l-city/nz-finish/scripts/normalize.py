"""Normalise the transcribed sheets to 24-hour clock and bank them.

The sheets print a 12-hour clock: suhoor, fajr and sunrise are morning, and zuhr,
asr, maghrib and isha are afternoon/evening. Anything printed 12:xx is noon or
midnight in 12-hour form, so the afternoon columns take +12 when the printed hour
is below 12.
"""
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
AFTERNOON = ["dhuhr", "asr", "maghrib", "isha"]
COL = {"suhoorEnds": "suhoor", "fajr": "fajr", "sunrise": "sunrise", "dhuhr": "dhuhr",
       "asr": "asr", "maghrib": "maghrib", "isha": "isha"}


def to24(v, afternoon):
    if not v:
        return None
    h, m = int(v[:2]), int(v[3:])
    if afternoon and h < 12:
        h += 12
    return f"{h:02d}:{m:02d}"


def main():
    # Rotorua's last row carries a print defect: the asr cell is overprinted, and the
    # day before it reads 04:51 on a monotone run, so the printed value is 04:50.
    fix = {("Rotorua", "2026-03-20", "asr"): "04:50"}
    out = {}
    for p in sorted(DATA.glob("nz-2026-*.json")):
        city = p.stem.replace("nz-2026-", "")
        doc = json.loads(p.read_text())
        rows = {}
        for iso, row in doc["rows"].items():
            r = {}
            for key, col in COL.items():
                src = row.get(key, row.get(col))
                if (city, iso, col) in fix:
                    src = fix[(city, iso, col)]
                r["suhoorEnds" if col == "suhoor" else col] = to24(src, col in AFTERNOON)
            rows[iso] = r
        doc["rows"] = rows
        doc["_clock"] = "sheets print a 12-hour clock; afternoon columns +12 when printed hour < 12"
        p.write_text(json.dumps(doc, indent=1))
        out[city] = len(rows)
    print(len(out), "cities", sum(out.values()), "rows")


if __name__ == "__main__":
    main()
