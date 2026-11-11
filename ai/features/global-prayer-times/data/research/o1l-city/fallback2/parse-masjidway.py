#!/usr/bin/env python3
"""Parse a Masjidway monthly prayer page into dated rows (English or French page). Usage: parse-masjidway.py <html> <out.json>"""
import json
import re
import sys

NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "janvier": 1, "fevrier": 2, "février": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6,
    "juillet": 7, "aout": 8, "août": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12, "décembre": 12,
}
MONTHS = "|".join(sorted(NAMES, key=len, reverse=True))

html = open(sys.argv[1], encoding="utf-8", errors="replace").read()
text = re.sub(r"<script.*?</script>|<style.*?</style>", "", html, flags=re.S)
text = re.sub(r"<[^>]+>", "|", text)
text = re.sub(r"\|+", "|", text)
text = re.sub(r"[ \t]+", " ", text)

rows = {}
pattern = re.compile(
    r"(\d{1,2})(?:er)?\s+(" + MONTHS + r")\s+(\d{4})[\s|]*"
    r"(\d{2}:\d{2})[\s|]*(\d{2}:\d{2})[\s|]*(\d{2}:\d{2})[\s|]*(\d{2}:\d{2})[\s|]*(\d{2}:\d{2})[\s|]*(\d{2}:\d{2})",
    re.I,
)
for m in pattern.finditer(text):
    key = f"{int(m.group(3)):04d}-{NAMES[m.group(2).lower()]:02d}-{int(m.group(1)):02d}"
    rows[key] = list(m.group(4, 5, 6, 7, 8, 9))

if not rows:
    sys.exit("no rows")
json.dump(
    {"source": "masjidway", "tier": "platform",
     "columns": ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"],
     "rows": dict(sorted(rows.items()))},
    open(sys.argv[2], "w"), indent=1, sort_keys=True)
print(f"{sys.argv[2]}: {len(rows)} rows {min(rows)}..{max(rows)}")
