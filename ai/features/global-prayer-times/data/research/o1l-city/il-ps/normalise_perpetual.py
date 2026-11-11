#!/usr/bin/env python3
"""Normalise the Awqaf perpetual print to 24-hour rows and validate it against
the live homepage days recovered from the Wayback Machine.

The print carries a 12-hour clock with no meridiem: fajr and sunrise are morning,
asr/maghrib/isha are afternoon, dhuhr straddles noon and is printed as it reads.
"""
import json

PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
PM = {"asr", "maghrib", "isha"}


def to24(prayer, hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    if prayer in PM and h < 12:
        h += 12
    return h * 60 + m


def main():
    per = json.load(open("data/jerusalem-awqaf-perpetual.json"))
    out = {}
    for key, row in per.items():
        out[key] = {p: to24(p, row[p]) for p in PRAYERS}
    with open("data/jerusalem-awqaf-perpetual-24h.json", "w") as f:
        json.dump(out, f, indent=0, sort_keys=True)

    wb = json.load(open("data/jerusalem-awqaf-wayback.json"))
    diffs = {}
    for day, row in sorted(wb.items()):
        ref = out.get(day[5:])
        if not ref:
            continue
        d = tuple(to24(p, row[p]) - ref[p] for p in PRAYERS)
        diffs.setdefault(d, []).append(day)
    print("live days compared:", sum(len(v) for v in diffs.values()))
    for d, days in sorted(diffs.items(), key=lambda kv: -len(kv[1])):
        print(d, len(days), days[:4], "..." if len(days) > 4 else "")


if __name__ == "__main__":
    main()
