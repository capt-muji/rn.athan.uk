"""Parse the CCIM Madrid monthly posters (Doc/Horario/<year>/<Mes>-<year>.pdf)."""
import json, re, sys
from pypdf import PdfReader

MES = {"Enero":1,"Febrero":2,"Marzo":3,"Abril":4,"Mayo":5,"Junio":6,"Julio":7,"Agosto":8,
       "Septiembre":9,"Octubre":10,"Noviembre":11,"Diciembre":12}
TIME = re.compile(r"\b(\d{1,2})[.:](\d{2})\b")
ROW = re.compile(r"^(\d{1,2})\s+\d{1,2}\b")


def parse(path, year, month):
    text = "\n".join((p.extract_text() or "") for p in PdfReader(path).pages)
    rows = {}
    for line in text.splitlines():
        line = line.strip()
        m = ROW.match(line)
        if not m:
            continue
        times = [f"{h}:{m}" for h, m in TIME.findall(line)]
        if len(times) < 6:
            continue
        day = int(m.group(1))
        rows[f"{year:04d}-{month:02d}-{day:02d}"] = {
            "fajr": times[0], "sunrise": times[1], "dhuhr": times[2],
            "asr": times[3], "magrib": times[4], "isha": times[5]}
    return rows


if __name__ == "__main__":
    for year in (2025, 2026):
        merged = {}
        for name, month in MES.items():
            try:
                merged.update(parse(f"captures/es-ccim-{year}-{name}.pdf", year, month))
            except FileNotFoundError:
                pass
        out = f"data/es-madrid-{year}.json"
        json.dump(merged, open(out, "w"), indent=0, sort_keys=True)
        ks = sorted(merged)
        print(out, len(merged), ks[0], "..", ks[-1])
