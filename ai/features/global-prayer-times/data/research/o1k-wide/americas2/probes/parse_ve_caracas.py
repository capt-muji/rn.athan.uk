import json
import re

import pypdf

# Mezquita de Caracas monthly sheet: columns are [weekday] HIJRI_DAY GREGORIAN_DAY then the six
# times, the last three printed on a 12-hour clock. 12 Oct 2026 = 1 Jumada I 1448 and the row
# for it carries "Lun", so the sheet runs 12 Oct - 10 Nov 2026.
text = pypdf.PdfReader("captures/ve_caracas_horario_salat.pdf").pages[0].extract_text()
rows = {}
for line in text.splitlines():
    m = re.search(
        r"(?:Lun|Mar|Mie|Jue|Vie|S[áa]b|Dom)\s*(\d{1,2})\s+(\d{1,2})\s+"
        r"(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})",
        line,
    )
    if not m:
        continue
    g = m.groups()
    day = int(g[1])
    month = 10 if day >= 12 else 11
    pm = lambda t: f"{int(t[:2]) + 12:02d}:{t[3:]}" if int(t[:2]) < 12 else t
    rows[f"2026-{month:02d}-{day:02d}"] = [g[2], g[3], g[4], pm(g[5]), pm(g[6]), pm(g[7])]
out = {k: rows[k] for k in sorted(rows)}
json.dump(out, open("data/ve_caracas_mezquita_2026-10-12_2026-11-10.json", "w"), indent=1)
print(len(out), "rows")
for k in out:
    print(k, out[k])
