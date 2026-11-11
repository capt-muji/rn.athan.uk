"""Parse the Fondation Culturelle Islamique de Genève monthly tables.

Only the day-of-month and a French weekday are printed, so the Gregorian date is recovered by
sliding each month's printed sequence over the calendar and keeping the placement whose weekdays
agree best. The chain is anchored on the first month of a hijri year and each following month
continues from the previous one's end, which removes the seven-day ambiguity the weekdays leave.
"""
import json, re, sys
from datetime import date, timedelta
from pypdf import PdfReader

DAYS = {"lun":0,"mar":1,"mer":2,"jeu":3,"ven":4,"sam":5,"dim":6}
TIME = re.compile(r"\b(\d{1,2}:\d{2})\b")
LINE = re.compile(r"^(\d{1,2})\s*([a-zéûô]{3})\*?\s")

ANCHORS = {"1446": "2024-07-07", "1447": "2025-06-26", "1448": "2026-06-16"}


def rows_of(path):
    text = "\n".join((p.extract_text() or "") for p in PdfReader(path).pages)
    out = []
    for line in text.splitlines():
        line = line.strip()
        m = LINE.match(line)
        if not m:
            continue
        times = TIME.findall(line)
        wd = DAYS.get(m.group(2)[:3])
        if len(times) < 6 or wd is None:
            continue
        out.append((int(m.group(1)), wd, times[:6]))
    return out


def place(rows, guess):
    for span in (3, 40):
        best, bestkey = None, None
        for offset in range(-span, span + 1):
            first = guess + timedelta(days=offset)
            seq, cur, prev, ok = [], first, None, True
            for day, _, _ in rows:
                if prev is not None and day < prev:
                    cur = (cur.replace(day=1) + timedelta(days=32)).replace(day=1)
                try:
                    cur = cur.replace(day=day)
                except ValueError:
                    ok = False
                    break
                seq.append(cur)
                prev = day
            if not ok:
                continue
            hits = sum(1 for d, (_, wd, _) in zip(seq, rows) if d.weekday() == wd)
            key = (hits, -abs(offset))
            if bestkey is None or key > bestkey:
                best, bestkey = seq, key
        if best is not None and bestkey[0] >= len(rows) - 1:
            return best
    return None


if __name__ == "__main__":
    for hy, anchor in ANCHORS.items():
        merged, cursor = {}, date.fromisoformat(anchor)
        for hm in range(1, 13):
            try:
                rows = rows_of(f"captures/ch-fcigeneve-{hy}-{hm:02d}.pdf")
            except FileNotFoundError:
                continue
            if not rows:
                continue
            seq = place(rows, cursor) or place(rows, date.fromisoformat(anchor) + timedelta(days=int((hm - 1) * 29.53)))
            if seq is None:
                print(f"  {hy}-{hm:02d} unplaced")
                continue
            for d, (_, _, t) in zip(seq, rows):
                merged[d.isoformat()] = {"isha": t[0], "magrib": t[1], "asr": t[2],
                                         "dhuhr": t[3], "sunrise": t[4], "fajr": t[5]}
            cursor = seq[-1] + timedelta(days=1)
        out = f"data/ch-geneve-hijri{hy}.json"
        json.dump(merged, open(out, "w"), indent=0, sort_keys=True)
        ks = sorted(merged)
        gaps = [(a, b) for a, b in zip(ks, ks[1:])
                if (date.fromisoformat(b) - date.fromisoformat(a)).days != 1]
        print(f"{out} {len(merged)} {ks[0]} .. {ks[-1]} gaps={gaps[:4]}")
