import json, re, pypdf
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAP, DATA = ROOT / "captures", ROOT / "data"

ROW = re.compile(
    r"^(\d{1,2})-([A-Za-z]{3})\s+(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)$"
)


def hhmm(s):
    m = re.match(r"(\d{1,2}):(\d{2})\s*([AP])M", s)
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    if ap == "A":
        h = 0 if h == 12 else h
    elif h != 12:
        h += 12
    return f"{h:02d}:{mi:02d}"


def acju(pdf):
    text = "\n".join((p.extract_text() or "") for p in pypdf.PdfReader(pdf).pages)
    out = {}
    for line in text.splitlines():
        m = ROW.match(" ".join(line.split()))
        if not m:
            continue
        out[int(m.group(1))] = {
            "fajr": hhmm(m.group(3)), "sunrise": hhmm(m.group(4)), "dhuhr": hhmm(m.group(5)),
            "asr_shafie": hhmm(m.group(6)), "asr_hanafi": hhmm(m.group(7)),
            "maghrib": hhmm(m.group(8)), "isha": hhmm(m.group(9)),
        }
    return out


COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]


def compare(acju_rows, cal, label):
    nov = cal[10]
    diffs = {c: [] for c in COLS}
    for day in sorted(acju_rows):
        a = acju_rows[day]
        v = nov.get(str(day))
        if not v:
            continue
        for i, c in enumerate(COLS):
            key = "asr_shafie" if c == "asr" else c
            am = int(a[key][:2]) * 60 + int(a[key][3:])
            vm = int(v[i][:2]) * 60 + int(v[i][3:])
            diffs[c].append(vm - am)
    print(f"\n== {label}: mosque minus ACJU, November, {len(diffs['fajr'])} days")
    for c in COLS:
        a = diffs[c]
        print(f"   {c.ljust(8)} mean {sum(a)/len(a):+.2f}  range {min(a):+d}..{max(a):+d}  identical {a.count(0)}/{len(a)}")
    return diffs


def main():
    out = {}
    k = json.loads((DATA / "lk-mawaqit-kollupitiya-calendar.json").read_text())
    out["kollupitiya_vs_z01"] = compare(acju(CAP / "lk-acju-z01-m11-20261111.pdf"), k, "Kollupitiya (Colombo 03) vs ACJU zone 01")
    a = json.loads((DATA / "lk-mawaqit-aruppola-calendar.json").read_text())
    out["aruppola_vs_z07"] = compare(acju(CAP / "lk-acju-z07-m11-20261111.pdf"), a, "Aruppola (Kandy) vs ACJU zone 07")
    (DATA / "lk-mosque-vs-acju.json").write_text(json.dumps(out, indent=1))

    # Al-Hassan December defect: how far off is December from November's own rule
    h = json.loads((DATA / "lk-mawaqit-alhassan-calendar.json").read_text())
    nov, dec = h[10], h[11]
    print("\n== Al-Hassan December vs November, same-day slots")
    for i, c in enumerate(COLS):
        d = []
        for day in ("1", "15", "28"):
            if day in nov and day in dec:
                vm = int(nov[day][i][:2]) * 60 + int(nov[day][i][3:])
                dm = int(dec[day][i][:2]) * 60 + int(dec[day][i][3:])
                d.append(dm - vm)
        print(f"   {c.ljust(8)} Dec-Nov {d} minutes")


main()
