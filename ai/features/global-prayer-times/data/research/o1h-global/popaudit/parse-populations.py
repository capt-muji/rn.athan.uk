#!/usr/bin/env python3
"""Parse methods/POPULATIONS.md into rows: country, wpr, pew, note."""
import json
import re
import sys

PATH = "../methods/POPULATIONS.md"


def parse():
    rows = []
    for line in open(PATH, encoding="utf-8"):
        if not line.startswith("| ") or line.startswith("| ---") or "Country |" in line:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        country, wpr, pew = cells[0], cells[1], cells[2]
        if not re.match(r"^[\d.]+$", wpr):
            continue
        rows.append(
            {
                "country": country,
                "wpr": float(wpr),
                "pew": float(pew) if re.match(r"^[\d.]+$", pew) else None,
                "note": cells[3] if len(cells) > 3 else "",
            }
        )
    return rows


if __name__ == "__main__":
    rows = parse()
    print(len(rows), "rows")
    json.dump(rows, sys.stdout, indent=1)
