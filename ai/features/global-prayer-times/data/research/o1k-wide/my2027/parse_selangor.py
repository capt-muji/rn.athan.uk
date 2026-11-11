"""Parse Jabatan Mufti Selangor 2027 per-district PDFs into dated rows.

Layout: one page per month, rows "<WEEKDAY> <day> [<hijri day or month name>] t t t t t t t".
"""
import json, os, re, sys
from datetime import date
from pypdf import PdfReader

MONTHS = ["JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN",
          "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"]
COLS = ["imsak", "fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]
TIME = re.compile(r"^\d{1,2}[:.]\d{2}$")
WEEKDAY = re.compile(r"^(AHAD|ISNIN|SELASA|RABU|KHAMIS|JUMAAT|SABTU)$")


def norm(t):
    t = t.replace(".", ":")
    h, m = t.split(":")
    return f"{int(h):02d}:{m}"


def parse(path, year=2027):
    out = {}
    for page in PdfReader(path).pages:
        text = page.extract_text() or ""
        m = re.search(r"BULAN\s+([A-Z]+)", text)
        if not m:
            raise SystemExit(f"no month header on a page of {path}")
        month = MONTHS.index(m.group(1)) + 1
        for line in text.splitlines():
            tok = line.split()
            if not tok or not WEEKDAY.match(tok[0]):
                continue
            day = int(tok[1])
            times = [t for t in tok[2:] if TIME.match(t)]
            if len(times) != 7:
                raise SystemExit(f"{path} {month}/{day}: {len(times)} times in {line!r}")
            for t in times:
                hh = int(t.replace(".", ":").split(":")[0])
                if hh > 23:
                    raise SystemExit(f"{path} {month}/{day}: bad time {t}")
            key = date(year, month, day).isoformat()
            if key in out:
                raise SystemExit(f"{path}: duplicate {key}")
            out[key] = dict(zip(COLS, map(norm, times)))
    return out


if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))
    for path in sys.argv[1:]:
        rows = parse(path)
        if len(rows) != 365:
            print(f"WARN {os.path.basename(path)}: {len(rows)} rows")
        keys = sorted(rows)
        assert keys[0] == "2027-01-01" and keys[-1] == "2027-12-31", (keys[0], keys[-1])
        slug = os.path.basename(path).replace("my-selangor-2027-", "").replace(".pdf", "").lower()
        slug = re.sub(r"-jadual-waktu-solat-2027$", "", slug)
        slug = {"hulu-selangor": "hulu-selangor", "kuala-selangor": "kuala-selangor",
                "sabak-bernam": "sabak-bernam", "kuala-langat": "kuala-langat"}.get(slug, slug)
        dest = os.path.join(root, "data", f"my-selangor-2027-{slug}.json")
        json.dump(rows, open(dest, "w"), indent=0, sort_keys=True)
        print(f"{slug}: {len(rows)} rows -> {dest}")
