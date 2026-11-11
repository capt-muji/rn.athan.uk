#!/usr/bin/env python3
"""Parse en.masjidway.com prayer pages: dated rows {"YYYY-MM-DD": {...}}."""
import re, sys

MON = {m: i + 1 for i, m in enumerate(
    "January February March April May June July August September October November December".split())}


def parse(path):
    h = open(path, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", "", h, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", t)
    out = {}
    for m in re.finditer(
            r"(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), "
            r"(\w+) (\d{1,2}), (\d{4}) "
            r"(\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2})", t):
        key = f"{m.group(4)}-{MON[m.group(2)]:02d}-{int(m.group(3)):02d}"
        out[key] = dict(zip(["fajr", "sunrise", "dhuhr", "asr1", "magrib", "isha"], m.groups()[4:]))
    meth = re.search(r"Method: ([A-Za-z ]+?) Prayer times", t)
    return out, (meth.group(1) if meth else None)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        rows, meth = parse(p)
        ks = sorted(rows)
        print(f"{p.split('/')[-1][:44]:44} rows={len(rows)} method={meth} {ks[0] if ks else ''}..{ks[-1] if ks else ''}")
