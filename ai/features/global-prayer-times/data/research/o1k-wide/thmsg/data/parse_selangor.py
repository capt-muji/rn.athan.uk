"""Parse Jabatan Mufti Negeri Selangor 2027 district tables (Hijri+Miladi layout)."""
import datetime
import json
import re
import sys

MONTHS = {"JANUARI": 1, "FEBRUARI": 2, "MAC": 3, "APRIL": 4, "MEI": 5, "JUN": 6,
          "JULAI": 7, "OGOS": 8, "SEPTEMBER": 9, "OKTOBER": 10, "NOVEMBER": 11, "DISEMBER": 12}
WEEKDAYS = {"ISNIN", "SELASA", "RABU", "KHAMIS", "JUMAAT", "SABTU", "AHAD"}
TIME = re.compile(r"^\d{1,2}:\d{2}$")


def parse(path):
    from pypdf import PdfReader
    rows = {}
    month = None
    for page in PdfReader(path).pages:
        text = page.extract_text() or ""
        for line in text.splitlines():
            tokens = line.split()
            if not tokens:
                continue
            head = [m for m in MONTHS if m in tokens]
            if tokens[0] in WEEKDAYS:
                day = int(tokens[1])
                times = [t for t in tokens if TIME.match(t)]
                if len(times) != 7 or not 1 <= day <= 31:
                    continue
                key = f"2027-{month:02d}-{day:02d}"
                try:
                    datetime.date.fromisoformat(key)
                except ValueError:
                    continue
                hours = [f"{int(t.split(':')[0]):02d}:{t.split(':')[1]}" for t in times]
                rows[key] = {
                    "imsak": hours[0], "fajr": hours[1], "sunrise": hours[2],
                    "dhuhr": hours[3], "asr": hours[4], "magrib": hours[5], "isha": hours[6],
                }
            elif head:
                month = MONTHS[head[0]]
    return dict(sorted(rows.items()))


if __name__ == "__main__":
    rows = parse(sys.argv[1])
    json.dump(rows, open(sys.argv[2], "w"), indent=0)
    order = ["imsak", "fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
    bad = [k for k, v in rows.items()
           if any(v[order[i]] >= v[order[i + 1]] for i in range(len(order) - 1))]
    print(sys.argv[2], len(rows), "nonmono", len(bad), bad[:3])
