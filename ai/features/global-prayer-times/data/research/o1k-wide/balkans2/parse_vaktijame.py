#!/usr/bin/env python3
"""Parse vaktija.me yearly PDFs (one per city) into dated rows.

Layout: one page per month, every day a full hh:mm row, columns
Datum | Dan | Zora | Izlazak Sunca | Podne | Ikindija | Akšam | Jacija.
"""
import json, re, sys
from pypdf import PdfReader

MONTHS = {
    "JANUAR": 1, "FEBRUAR": 2, "MART": 3, "APRIL": 4, "MAJ": 5, "JUN": 6, "JUNI": 6,
    "JUL": 7, "JULI": 7, "AUGUST": 8, "AVGUST": 8, "SEPTEMBAR": 9, "OKTOBAR": 10, "NOVEMBAR": 11, "DECEMBAR": 12,
}
DAYS_IN = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
# table column order: zora, sunrise, dhuhr, asr(ikindija), maghrib(akšam), isha(jacija)
PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

def main(pdf, year, out):
    r = PdfReader(pdf)
    data = {}
    for pi, page in enumerate(r.pages):
        text = page.extract_text(extraction_mode="layout")
        lines = text.splitlines()
        month = None
        for name, num in sorted(MONTHS.items(), key=lambda kv: -len(kv[0])):
            if re.search(r"\b" + name, text, re.IGNORECASE):
                month = num
                break
        if month is None:
            print(f"page {pi+1}: no month", file=sys.stderr)
            continue
        for ln in lines:
            cells = ln.split()
            if len(cells) < 8:
                continue
            if not cells[0].isdigit():
                continue
            d = int(cells[0])
            if not (1 <= d <= DAYS_IN[month]):
                continue
            times = [c for c in cells if re.fullmatch(r"\d{1,2}:\d{2}", c)]
            if len(times) != 6:
                print(f"warn {year}-{month:02d}-{d:02d}: {len(times)} times", file=sys.stderr)
                continue
            row = {p: f"{int(t.split(':')[0]):02d}:{t.split(':')[1]}" for p, t in zip(PRAYERS, times)}
            data[f"{year}-{month:02d}-{d:02d}"] = row
    complete = sum(1 for row in data.values() if all(row.values()))
    print(f"{out}: days {len(data)}, complete {complete}", file=sys.stderr)
    json.dump(data, open(out, "w"), indent=1, ensure_ascii=False, sort_keys=True)

if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3])
