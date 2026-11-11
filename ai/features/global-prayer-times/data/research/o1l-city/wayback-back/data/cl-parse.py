"""Parse the 2016 CCICH monthly posters (radioislam.cl/ARCHIVOS/horarios/<y>/<mm>_<mes>/<code>.pdf).

Header is identical on every city file, so the city is the filename code only.
DHUHR prints on a 12-hour clock (01:54 = 13:54) while every other column prints 24-hour.
"""
import json
import re
from pypdf import PdfReader

ROW = re.compile(r"^\w+\s+(\d{2})\s+(\d{2}):(\d{2})\s+(\d{2}):(\d{2})\s+(\d{2}):(\d{2})\s+"
                 r"(\d{2}):(\d{2})\s+(\d{2}):(\d{2})\s+(\d{2}):(\d{2})")

CODES = ["ant", "anto", "ari", "cal", "conc", "cop", "coy", "fel", "mon",
         "pun", "ran", "san", "ser", "tal", "tem", "val", "vin"]


def parse(path, year, month):
    text = "\n".join((p.extract_text() or "") for p in PdfReader(path).pages)
    rows = {}
    for line in text.splitlines():
        m = ROW.match(line.strip())
        if not m:
            continue
        g = m.groups()
        day = int(g[0])
        dhuhr_h = int(g[5])
        if dhuhr_h < 12:
            dhuhr_h += 12
        rows[f"{year:04d}-{month:02d}-{day:02d}"] = {
            "fajr": f"{g[1]}:{g[2]}",
            "sunrise": f"{g[3]}:{g[4]}",
            "dhuhr": f"{dhuhr_h:02d}:{g[6]}",
            "asr": f"{g[7]}:{g[8]}",
            "maghrib": f"{g[9]}:{g[10]}",
            "isha": f"{g[11]}:{g[12]}",
        }
    return rows


if __name__ == "__main__":
    out = {}
    for code in CODES:
        rows = parse(f"captures/cl-2016-03-{code}.pdf", 2016, 3)
        out[code] = rows
        print(code, len(rows), min(rows) if rows else "-", max(rows) if rows else "-")
    json.dump(out, open("data/cl-2016-03.json", "w"), indent=0, sort_keys=True)
    jul = parse("captures/cl-2016-07-cop.pdf", 2016, 7)
    json.dump({"cop": jul}, open("data/cl-2016-07.json", "w"), indent=0, sort_keys=True)
    print("cop 2016-07", len(jul), min(jul), max(jul))
