"""Parse Mezquita Mayor de Granada's hijri-month salat tables into dated rows.

Files are walked in hijri order and the Gregorian year advances whenever the printed
(month, day) steps backwards, which is the only place the tables wrap.
"""
import html, json, re, sys
from datetime import date

MESES = {"ene":1,"feb":2,"mar":3,"abr":4,"may":5,"jun":6,"jul":7,"ago":8,"sep":9,"set":9,
         "oct":10,"nov":11,"dic":12}


def fila_rows(path):
    t = open(path, encoding="utf-8", errors="replace").read()
    out = []
    for tr in re.findall(r"<tr.*?</tr>", t, flags=re.S):
        cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<t[dh].*?</t[dh]>", tr, flags=re.S)]
        if len(cells) != 7:
            continue
        m = re.match(r"^(\d+)\s+\S+\s+(\d+)\s+([A-Za-z]{3})", cells[0])
        if m:
            out.append((int(m.group(2)), MESES[m.group(3).lower()], cells[1:]))
    return out


def parse_year(hijri_year, start_year):
    rows, year, prev = {}, start_year, None
    for hm in range(1, 13):
        for day, mon, times in fila_rows(f"captures/es-granada-hijri-{hijri_year}-{hm:02d}.html"):
            if prev is not None and (mon, day) < prev:
                year += 1
            rows[f"{year:04d}-{mon:02d}-{day:02d}"] = times
            prev = (mon, day)
    return rows


if __name__ == "__main__":
    total = 0
    for hy, start_year in ((1447, 2025), (1448, 2026)):
        rows = parse_year(hy, start_year)
        path = f"data/es-granada-hijri{hy}.json"
        json.dump(rows, open(path, "w"), indent=0, sort_keys=True)
        ks = sorted(rows)
        gaps = [(a, b) for a, b in zip(ks, ks[1:])
                if (date.fromisoformat(b) - date.fromisoformat(a)).days != 1]
        print(path, len(rows), ks[0], "..", ks[-1], "gaps", gaps[:4])
        total += len(rows)
    print("total", total)
