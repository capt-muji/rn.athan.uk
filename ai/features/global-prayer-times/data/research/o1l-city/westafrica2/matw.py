#!/usr/bin/env python3
"""Parse a MATW monthly timetable page into dated 24h rows."""
import json, re, sys, os, html

HERE = os.path.dirname(os.path.abspath(__file__))


def parse(path):
    h = open(path, encoding="utf-8", errors="replace").read()
    rows = {}
    # each row: date cell then six time cells
    pat = re.compile(
        r'font-medium">(\d{2} [A-Z][a-z]{2} \d{4})</td>'
        r'(?:<td[^>]*><span[^>]*>([^<]+)</span></td>){6}')
    for m in pat.finditer(h):
        cells = re.findall(r'<td[^>]*><span[^>]*>([^<]+)</span></td>',
                           h[m.start():m.end()])
        if len(cells) != 6:
            continue
        vals = [c.strip() for c in cells]
        iso = None
        for fmt in ("%d %b %Y",):
            import datetime
            try:
                iso = datetime.datetime.strptime(m.group(1), fmt).strftime("%Y-%m-%d")
            except ValueError:
                pass
        if not iso:
            continue
        out = []
        for v in vals:
            mm = re.match(r'(\d{1,2}):(\d{2})\s*([AP]M)', v, re.I)
            if not mm:
                out.append(None)
                continue
            hh, mi, ap = int(mm.group(1)), int(mm.group(2)), mm.group(3).upper()
            if ap == "PM" and hh != 12:
                hh += 12
            if ap == "AM" and hh == 12:
                hh = 0
            out.append("%02d:%02d" % (hh, mi))
        rows[iso] = dict(zip(("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"), out))
    return rows


if __name__ == "__main__":
    src, tag = sys.argv[1], sys.argv[2]
    rows = parse(os.path.join(HERE, "captures", src))
    with open(os.path.join(HERE, "data", tag + ".json"), "w") as f:
        json.dump(rows, f, indent=1, sort_keys=True)
    print(tag, len(rows), "rows", min(rows) if rows else "", max(rows) if rows else "")
    print(json.dumps({k: rows[k] for k in list(sorted(rows))[:2]}, indent=0))
