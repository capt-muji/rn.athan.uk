#!/usr/bin/env python3
"""Parse the Pula medzlis monthly vaktija PDFs (2026) into one dated dataset.

Layout: one page per month, every day a full row, columns
year | weekday | hijri | notes | Zora | Izlazak | Podne | Ikindija | Akšam | Jacija.
"""
import glob, json, re, sys
from pypdf import PdfReader

MONTHS = {
    "SIJECANJ": 1, "SIJEČANJ": 1, "VELJACA": 2, "VELJAČA": 2, "OZUJAK": 3, "OŽUJAK": 3,
    "TRAVANJ": 4, "SVIBANJ": 5, "LIPANJ": 6, "SRPANJ": 7, "KOLOVOZ": 8, "RUJAN": 9,
    "LISTOPAD": 10, "STUDENI": 11, "PROSINAC": 12,
}
DAYS_IN = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

def month_from(text):
    for name, num in sorted(MONTHS.items(), key=lambda kv: -len(kv[0])):
        if re.search(r"MJESEC " + name, text, re.IGNORECASE):
            return num
    return None

def main():
    data = {}
    for path in sorted(glob.glob("captures/hr_pula/pula_*.pdf")):
        r = PdfReader(path)
        text = r.pages[0].extract_text(extraction_mode="layout")
        month = month_from(text)
        if month is None:
            print(f"{path}: no month header, skipped", file=sys.stderr)
            continue
        for pi, page in enumerate(r.pages):
            for ln in page.extract_text(extraction_mode="layout").splitlines():
                cells = ln.split()
                if not cells or not cells[0].isdigit():
                    continue
                d = int(cells[0])
                if not (1 <= d <= DAYS_IN[month]):
                    continue
                times = [c for c in cells if re.fullmatch(r"\d{1,2}:\d{2}", c)]
                if len(times) != 6:
                    print(f"warn {month:02d}-{d:02d}: {len(times)} times", file=sys.stderr)
                    continue
                row = {p: f"{int(t.split(':')[0]):02d}:{t.split(':')[1]}" for p, t in zip(PRAYERS, times)}
                data[f"2026-{month:02d}-{d:02d}"] = row
    complete = sum(1 for row in data.values() if all(row.values()))
    print(f"days: {len(data)}, complete: {complete}", file=sys.stderr)
    json.dump(data, open("data/hr_pula_medzlis_2026.json", "w"), indent=1, ensure_ascii=False, sort_keys=True)

if __name__ == "__main__":
    main()
