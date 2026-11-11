#!/usr/bin/env python3
"""Gate a dpt/Masjidal today row against the mosque's own live page HTML."""
import json, re, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dptdiff import load_dpt


def variants(t):
    h, m = (int(x) for x in t.split(":"))
    out = {f"{h:02d}:{m:02d}", f"{h}:{m:02d}"}
    h12 = h % 12 or 12
    out |= {f"{h12}:{m:02d}", f"{h12:02d}:{m:02d}"}
    return out


def gate(json_path, html_path, date="2026-11-10"):
    row = load_dpt(json_path).get(date)
    if not row:
        print(f"  {os.path.basename(json_path)}: no row {date}")
        return
    h = open(html_path, encoding="utf-8", errors="replace").read()
    h = re.sub(r"<[^>]+>", " ", h)
    hits = []
    for k in ["fajr", "sunrise", "dhuhr", "magrib", "isha"]:
        t = row[k]
        if not t:
            continue
        v = variants(t)
        hits.append(f"{k}={t}{'OK' if any(x in h for x in v) else '--'}")
    print(f"  {os.path.basename(json_path)[:40]:40} {date} " + " ".join(hits))


if __name__ == "__main__":
    gate(sys.argv[1], sys.argv[2], *sys.argv[3:])
