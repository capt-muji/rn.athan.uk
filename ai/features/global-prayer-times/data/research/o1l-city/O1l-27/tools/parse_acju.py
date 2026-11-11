import json, re, sys, pypdf
from pathlib import Path

CAP = Path(__file__).resolve().parent.parent / "captures"
OUT = Path(__file__).resolve().parent.parent / "data"

ROW = re.compile(
    r"^(\d{1,2})-([A-Za-z]{3})\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)$"
)


def hhmm(s):
    m = re.match(r"(\d{1,2}):(\d{2})\s*([AP])M", s)
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    if ap == "A":
        if h == 12:
            h = 0
    elif h != 12:
        h += 12
    return f"{h:02d}:{mi:02d}"


def parse(path):
    text = "\n".join((p.extract_text() or "") for p in pypdf.PdfReader(path).pages)
    rows = {}
    for line in text.splitlines():
        line = " ".join(line.split())
        m = ROW.match(line)
        if not m:
            continue
        day = int(m.group(1))
        fajr, sunrise, dhuhr, asr_s, asr_h, maghrib, isha = (hhmm(m.group(i)) for i in range(3, 10))
        rows[day] = {
            "fajr": fajr, "sunrise": sunrise, "dhuhr": dhuhr,
            "asr_shafie": asr_s, "asr_hanafi": asr_h,
            "maghrib": maghrib, "isha": isha,
        }
    return rows


def main():
    zones = {}
    for z in ("09", "12"):
        per_month = {}
        for mo in range(1, 13):
            p = CAP / f"lk-acju-z{z}-m{mo:02d}-20261111.pdf"
            if not p.exists():
                print(f"MISSING {p.name}")
                continue
            per_month[str(mo)] = parse(p)
        zones[z] = per_month
        counts = {mo: len(r) for mo, r in per_month.items()}
        print(z, counts, "total", sum(counts.values()))
    OUT.mkdir(exist_ok=True)
    (OUT / "lk-acju-zones-09-12-perpetual.json").write_text(json.dumps(zones, indent=1))
    # flattened 2026-dated rows (perpetual artifact: one annual cycle)
    import datetime
    flat = {}
    for z, per_month in zones.items():
        d = {}
        for mo, rows in per_month.items():
            for day, vals in rows.items():
                try:
                    dt = datetime.date(2026, int(mo), day)
                except ValueError:
                    continue  # 29 Feb row in a non-leap anchor year
                d[dt.isoformat()] = vals
        flat[z] = dict(sorted(d.items()))
        print(z, "dated rows", len(d))
    (OUT / f"lk-zones-2026.json").write_text(json.dumps(flat, indent=1))


main()
