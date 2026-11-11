"""Parse hsalah.info / CIL Lisboa annual prayer tables (12 monthly pages per PDF)."""
import json, re, sys
from pypdf import PdfReader

MESES = {"jan":1,"fev":2,"mar":3,"abr":4,"mai":5,"jun":6,"jul":7,"ago":8,"set":9,"out":10,"nov":11,"dez":12}
TIME = re.compile(r"\b([0-2]\d:[0-5]\d)\b")
STAMP = re.compile(r"\b[A-Z][a-z]{2}\s+\d{1,2}\s+\(\d{4}\)\s+às\s+\d{2}:\d{2}")
ROW = re.compile(r"^(\d{1,2})\s+(SEG|TER|QUA|QUI|SEX|S[ÁA]B|DOM)\b")


def parse(path):
    reader = PdfReader(path)
    rows = {}
    for page in reader.pages:
        text = page.extract_text() or ""
        head = text.splitlines()[0] if text else ""
        m = re.match(r"^([a-z]{3})[-/](\d{2,4})", head.strip().lower())
        if not m:
            continue
        month = MESES[m.group(1)]
        year = int(m.group(2))
        year = year + 2000 if year < 100 else year
        for line in text.splitlines():
            clean = STAMP.sub("", line)
            r = ROW.match(clean.strip())
            if not r:
                continue
            times = TIME.findall(clean)
            if len(times) < 6:
                continue
            cols = times[-8:] if len(times) >= 8 else times[-7:]
            if len(cols) == 8:
                names = ("fajr", "sunrise", "zawal", "dhuhr", "asr", "magrib", "isha", "isha_alt")
            else:
                names = ("fajr", "sunrise", "zawal", "dhuhr", "asr", "magrib", "isha")
            day = int(r.group(1))
            key = f"{year:04d}-{month:02d}-{day:02d}"
            rows[key] = dict(zip(names, cols))
    return rows


if __name__ == "__main__":
    data = parse(sys.argv[1])
    print(json.dumps(data, indent=0, sort_keys=True) if len(sys.argv) > 2 else
          f"{len(data)} rows {min(data) if data else '-'}..{max(data) if data else '-'}")
