# Extract athanplus monthly tables into canonical rows (year taken from filename).
# Usage: python3 extract_athanplus.py <out.json> <files...>   # filenames carry _YYYY-MM.html
import re, sys, json, datetime, os

out_path = sys.argv[1]
MONTHS = {m: i + 1 for i, m in enumerate(
    ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST",
     "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"])}
rows = {}
for path in sys.argv[2:]:
    base = os.path.basename(path)
    fm = re.search(r"(\d{4})-(\d{2})", base)
    year_hint = int(fm.group(1)) if fm else None
    month_hint = int(fm.group(2)) if fm else None
    if base.endswith("monthly.html"):
        year_hint, month_hint = 2026, 11
    h = open(path, encoding="utf-8", errors="replace").read()
    trs = re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S)
    label = None
    for tr in trs:
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)
        cells = [re.sub(r"<[^>]+>", " ", c).strip() for c in cells]
        if len(cells) >= 2 and cells[0] in MONTHS:
            label = MONTHS[cells[0]]
            if month_hint and label not in (month_hint, month_hint % 12 + 1):
                pass  # trust the label; month_hint only cross-checks
            continue
        if label is None or len(cells) < 8:
            continue
        if not re.match(r"\d{1,2}$", cells[0]) or ":" not in cells[3]:
            continue
        day = int(cells[0])
        year = year_hint or 2026
        key = f"{year}-{label:02d}-{day:02d}"
        try:
            datetime.date(year, label, day)
        except ValueError:
            continue
        cols = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
        pm_cols = {"asr", "maghrib", "isha"}
        vals = []
        ok = True
        for cname, v in zip(cols, cells[3:9]):
            m3 = re.match(r"(\d{1,2}):(\d{2})", v)
            if not m3:
                ok = False
                break
            hh, mm = int(m3.group(1)), m3.group(2)
            if cname in pm_cols and hh < 12:
                hh += 12
            vals.append(f"{hh:02d}:{mm}")
        if ok:
            rows[key] = dict(zip(cols, vals))
json.dump(rows, open(out_path, "w"), indent=1)
ks = sorted(rows)
print(out_path, len(rows), "rows", ks[0], "->", ks[-1])
