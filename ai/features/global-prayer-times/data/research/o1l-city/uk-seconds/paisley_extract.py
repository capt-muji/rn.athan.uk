#!/usr/bin/env python3
"""Extract Paisley Muslim Community's twelve monthly tables into one dated year."""
import re, html, json, pathlib, os

DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/uk-seconds"))
h = (DIR / "captures" / "paisley-comm.html").read_text(errors="ignore")
tables = re.findall(r"<table.*?</table>", h, re.S)
rows = {}
for mi, t in enumerate(tables, start=1):
    for tr in re.findall(r"<tr.*?</tr>", t, re.S):
        cells = [html.unescape(re.sub("<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
        if len(cells) < 12 or not re.match(r"^\d{1,2}\b", cells[0]):
            continue
        day = int(re.match(r"^(\d{1,2})", cells[0]).group(1))
        times = cells[1:12]
        def norm(v, pm):
            m = re.match(r"^(\d{1,2}):(\d{2})$", v)
            if not m:
                return None
            h, mi = int(m.group(1)), int(m.group(2))
            if pm and h < 12:
                h += 12
            return f"{h % 24:02d}:{mi:02d}"
        # Columns: fajr b/j, sunrise, dhuhr b/j, asr b/j, maghrib b/j, isha b/j.
        cols = [(s, 0) for s in ("fajr", "fajr_jamah", "sunrise")] + \
               [(s, 1) for s in ("dhuhr", "dhuhr_jamah", "asr", "asr_jamah",
                                 "maghrib", "maghrib_jamah", "isha", "isha_jamah")]
        vals = [norm(t, pm) for t, pm in zip(times, [c[1] for c in cols])]
        if any(v is None for v in vals):
            continue
        key = f"2026-{mi:02d}-{day:02d}"
        rows[key] = {name: val for (name, _), val in zip(cols, vals)}
out = DIR / "data" / "paisley-2026.json"
out.write_text(json.dumps(rows, indent=1, sort_keys=True))
print(f"paisley: {len(rows)} rows; Jan1={rows.get('2026-01-01')}; Nov11={rows.get('2026-11-11')}")
