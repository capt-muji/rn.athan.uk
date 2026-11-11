# Month PDFs -> canonical rows. Two layouts:
#  mcecc/wichita: <day> <dow> <hijri...> fajr sunrise dhuhr asr maghrib isha  (last six HH:MM)
#  icdm: <day> <dow> <hijri> fajr sunrise dhuhr asr maghrib <iqamah> isha     (7 times, 6th dropped)
import json, re, sys
import pypdf

path, out, year, month = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
mode = sys.argv[5] if len(sys.argv) > 5 else "six"
text = "\n".join(p.extract_text() or "" for p in pypdf.PdfReader(path).pages)
rows = {}
for line in text.splitlines():
    m = re.match(r"\s*(\d{1,2})\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b(.*)$", line)
    if m:
        day, rest = int(m.group(1)), m.group(3)
    else:
        m2 = re.match(r"\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\b(.*)$", line)
        if not m2:
            continue
        day, rest = int(m2.group(2)), m2.group(3)
    if day < 1 or day > 31:
        continue
    times = re.findall(r"\b(\d{1,2}:\d{2})\b", rest)
    if len(times) < 6:
        continue
    cols = ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
    if mode == "seven" and len(times) >= 7:
        picked = [times[0], times[1], times[2], times[3], times[4], times[6]]
    else:
        picked = times[:6]
    rows[f"{year}-{month:02d}-{day:02d}"] = dict(zip(cols, picked))
json.dump(rows, open(out, "w"), indent=1)
print(out, len(rows), "rows", (min(rows), max(rows)) if rows else "-")
