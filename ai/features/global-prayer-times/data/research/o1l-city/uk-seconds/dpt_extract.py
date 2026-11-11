#!/usr/bin/env python3
"""dpt_extract.py <tag> <raw-json> — normalize a DPT year JSON into dated rows."""
import json, sys, pathlib, os

DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/uk-seconds"))

def main():
    tag, raw = sys.argv[1], sys.argv[2]
    payload = json.loads((DIR / "captures" / raw).read_text())
    days = payload[0] if isinstance(payload[0], list) else payload
    rows = {}
    for r in days:
        d = r.get("d_date")
        if not d:
            continue
        rows[d] = dict(zip(("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"),
                           [(r.get(k) or "")[:5] for k in
                            ("fajr_begins", "sunrise", "zuhr_begins", "asr_mithl_1",
                             "maghrib_begins", "isha_begins")]))
    good = {d: v for d, v in rows.items() if v["fajr"] not in ("", "00:00")}
    (DIR / "data" / f"{tag}-dpt-2026.json").write_text(json.dumps(good, indent=1, sort_keys=True))
    print(f"{tag}: {len(rows)} raw rows, {len(good)} live, Nov11={good.get('2026-11-11')}")

main()
