import re, json, glob, os
from pathlib import Path

CAP = Path(__file__).resolve().parent.parent / "captures"
OUT = Path(__file__).resolve().parent.parent / "data"

CELL = re.compile(
    r'<td class="prayer-time fajr">([^<]+)</td>'
    r'<td class="prayer-time sunrise">([^<]+)</td>'
    r'<td class="prayer-time duhr">([^<]+)</td>'
    r'<td class="prayer-time asr">([^<]+)</td>'
    r'<td class="prayer-time maghrib">([^<]+)</td>'
    r'<td class="prayer-time isha">([^<]+)</td>'
)
DAY = re.compile(r'<tr class="day ([0-9-]+) \d+"><th scope="row" class="prayer-date">(\d+)</th>')


def parse(path):
    s = path.read_text(encoding="utf-8", errors="replace")
    title = re.search(r"<h2>([^<]*)</h2>", s)
    stamp = re.search(r"<h3>([^<]*)</h3>", s)
    out = {}
    for m in DAY.finditer(s):
        key, day = m.group(1), m.group(2)
        rest = s[m.end():m.end() + 700]
        c = CELL.search(rest)
        if not c:
            continue
        out[key] = {
            "fajr": c.group(1), "sunrise": c.group(2), "dhuhr": c.group(3),
            "asr": c.group(4), "maghrib": c.group(5), "isha": c.group(6),
        }
    return {
        "island": title.group(1) if title else None,
        "stamp": stamp.group(1) if stamp else None,
        "rows": dict(sorted(out.items(), key=lambda kv: kv[0])),
    }


def main():
    islands = {
        "1": "Thuraakunu", "953": "Hithadhoo", "421": "Thulusdhoo",
        "603": "Mulah", "951": "Fuvahmulah", "415": "Male",
    }
    data = {}
    for iid, name in islands.items():
        p = CAP / f"mv-nv-island{iid}-{name}-2026-11.html"
        d = parse(p)
        data[iid] = d
        print(f"{iid:4s} {d['island']!r:32s} stamp={d['stamp']!r} rows={len(d['rows'])}")
    OUT.mkdir(exist_ok=True)
    (OUT / "mv-5-islands-2026-11.json").write_text(json.dumps(data, indent=1))

    # yearlessness test: same island, three year labels
    a = parse(CAP / "mv-nv-island953-Hithadhoo-2026-11.html")["rows"]
    b = parse(CAP / "mv-nv-island953-2027-11.html")["rows"]
    c = parse(CAP / "mv-nv-island953-2031-11.html")["rows"]
    def strip(r):
        return {k.split("-")[0]: v for k, v in r.items()}
    sa, sb, sc = strip(a), strip(b), strip(c)
    diff27 = [d for d in sa if sa[d] != sb.get(d)]
    diff31 = [d for d in sa if sa[d] != sc.get(d)]
    print("yearlessness 2026-vs-2027 differing days:", len(diff27), diff27[:5])
    print("yearlessness 2026-vs-2031 differing days:", len(diff31), diff31[:5])


main()
