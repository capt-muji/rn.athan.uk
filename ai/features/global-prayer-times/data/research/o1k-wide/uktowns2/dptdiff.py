#!/usr/bin/env python3
"""Normalise dpt JSON captures and diff their fajr against LUPT (same MM-DD, 2027 pages)."""
import json, glob, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
def to24(field, t):
    h, m = (int(x) for x in t.split(":"))
    if field in ("dhuhr", "asr1", "asr2", "magrib", "isha") and h < 11:
        h += 12
    return f"{h:02d}:{m:02d}"


LUPT = {}
for m in ["01", "04", "07"]:
    for d, row in json.load(open(f"{HERE}/data/lupt-2027-{m}.json")).items():
        LUPT[d] = {k: to24(k, v) for k, v in row.items()}
SAMPLE = ["2027-01-15", "2027-04-15", "2027-07-15"]
FIELDS = {"fajr": "fajr_begins", "sunrise": "sunrise", "dhuhr": "zuhr_begins",
          "asr1": "asr_mithl_1", "asr2": "asr_mithl_2", "magrib": "maghrib_begins",
          "isha": "isha_begins"}


def mins(t):
    h, m = t.split(":")[:2]
    return int(h) * 60 + int(m)


def load_dpt(path):
    j = json.load(open(path))
    rows = j[0] if isinstance(j, list) and j and isinstance(j[0], list) else j
    out = {}
    for r in rows:
        d = r.get("d_date")
        if not d:
            continue
        out[d] = {k: r.get(v, "")[:5] for k, v in FIELDS.items()}
    return out


def diff(table, label, out_dir):
    dates = sorted(table)
    print(f"\n### {label}  rows={len(dates)}  {dates[0]}..{dates[-1]}")
    json.dump(table, open(f"{out_dir}/{label}.json", "w"), indent=0, sort_keys=True)
    for s in SAMPLE:
        mmdd = s[5:]
        cand = [d for d in dates if d[5:] == mmdd]
        if not cand:
            print(f"  {s}: (no row for {mmdd})")
            continue
        row = table[cand[0]]
        ref = LUPT[s]
        parts = []
        for k in ["fajr", "sunrise", "dhuhr", "asr1", "magrib", "isha"]:
            if row.get(k):
                parts.append(f"{k}{mins(row[k])-mins(ref[k]):+d}")
        print(f"  {s}: " + " ".join(parts) + f"  [row {row['fajr']} vs LUPT {ref['fajr']}]")


if __name__ == "__main__":
    for path in sys.argv[1:]:
        name = os.path.basename(path).split("-rest-route")[0]
        diff(load_dpt(path), name, f"{HERE}/data")
