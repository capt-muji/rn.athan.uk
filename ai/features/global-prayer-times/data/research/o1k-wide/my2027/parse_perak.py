"""Parse Jabatan Mufti Perak annual zone PDFs (2026 edition) into dated rows.

Layout: one page per month, columns MASIHI HIJRI HARI IMSAK SUBUH TERBIT ZOHOR ASAR MAGHRIB
ISYAK. Afternoon and evening columns print a 12-hour clock with no meridiem (1:21 = 13:21),
so anything at or below 07:xx in those four columns is a PM reading.
"""
import json, os, re, sys
from datetime import date
from pypdf import PdfReader

MONTHS = {m.upper(): i + 1 for i, m in enumerate(
    ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"])}
COLS = ["imsak", "fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
PM = {"dhuhr", "asr", "magrib", "isha"}
TIME = re.compile(r"^\d{1,2}:\d{2}$")
WEEKDAY = re.compile(r"^(AHAD|ISNIN|SELASA|RABU|KHAMIS|JUMAAT|SABTU)$")


def norm(t, col):
    h, m = map(int, t.split(":"))
    if col in PM and h < 12:
        h += 12
    return f"{h:02d}:{m:02d}"


def parse(path, year):
    out = {}
    for page in PdfReader(path).pages:
        text = page.extract_text() or ""
        m = re.search(r"BULAN\s+([A-Z]+)\s+(\d{4})", text)
        if not m:
            m = re.search(r"^([A-Z]+)\s+(\d{4})\s*$", text, re.M)
        if not m:
            continue
        month = MONTHS[m.group(1)]
        if int(m.group(2)) != year:
            raise SystemExit(f"{path}: month header year {m.group(2)}")
        for line in text.splitlines():
            tok = line.split()
            if not WEEKDAY.search(tok[2] if len(tok) > 2 else "") and not any(WEEKDAY.match(t) for t in tok[:5]):
                continue
            wi = next(i for i, t in enumerate(tok[:5]) if WEEKDAY.match(t))
            times = tok[wi + 1:]
            if len(times) != 7 or not all(TIME.match(t) for t in times):
                raise SystemExit(f"{path} {month}: unexpected row {line!r}")
            day = int(tok[0].split("-")[0])
            key = date(year, month, day).isoformat()
            if key in out:
                raise SystemExit(f"{path}: duplicate {key}")
            out[key] = {c: norm(t, c) for c, t in zip(COLS, times)}
    return out


if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))
    year = int(sys.argv[1])
    for path in sys.argv[2:]:
        rows = parse(path, year)
        keys = sorted(rows)
        zone = re.search(r"zon(\d)", os.path.basename(path)).group(1)
        if len(rows) != 365:
            print(f"WARN {path}: {len(rows)} rows {keys[0]}..{keys[-1]}")
            continue
        dest = os.path.join(root, "data", f"my-perak-{year}-zon{zone}.json")
        json.dump(rows, open(dest, "w"), indent=0, sort_keys=True)
        print(f"zon{zone}: {len(rows)} rows {keys[0]}..{keys[-1]} -> {dest}")
