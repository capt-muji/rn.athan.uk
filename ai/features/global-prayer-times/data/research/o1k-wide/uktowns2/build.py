#!/usr/bin/env python3
"""Build normalised dated tables from each captured surface into data/."""
import json, re, os
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
C = f"{HERE}/captures"
OUT = f"{HERE}/data"


def n(t):
    """Normalise '5:23', '05:23', '5.23' to 'HH:MM' 24h."""
    t = t.strip().replace(".", ":").replace(" ", "")
    h, m = t.split(":")[:2]
    return f"{int(h):02d}:{m}"


def save(name, rows):
    json.dump(rows, open(f"{OUT}/{name}.json", "w"), indent=0, sort_keys=True)
    ks = sorted(rows)
    print(f"{name:44} {len(rows):>4} rows  {ks[0]}..{ks[-1]}")


# ---------- Luton Central Mosque, November 2026 PDF ----------
def luton():
    t = "\n".join(p.extract_text(extraction_mode="layout") or ""
                  for p in PdfReader(f"{C}/luton-central-nov2026.pdf").pages)
    rows = {}
    for line in t.split("\n"):
        m = re.match(r"^\s*(\d{1,2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+"
                     r"(\S+)\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})", line)
        if not m:
            continue
        d, fajr, _fj, sunrise, zuhr, _zj, asr, _aj, magrib, isha, _ij = m.groups()
        rows[f"2026-11-{int(d):02d}"] = dict(fajr=fajr, sunrise=sunrise, dhuhr=zuhr,
                                             asr1=asr, magrib=magrib, isha=isha)
    save("luton-central-mosque-2026-11", rows)


# ---------- Zakariyya Jaame Masjid Bolton, 2026 calendar PDF ----------
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def bolton():
    r = PdfReader(f"{C}/bolton-zakariyya-timetable.pdf")
    rows = {}
    for page_i, page in enumerate(r.pages):
        t = page.extract_text() or ""
        if page_i < 1:
            continue
        month = page_i  # page 1 = January
        prev = 0
        for line in t.split("\n"):
            m = re.match(r"^(\d{1,2}) .*? (\d{1,2}) ((?:\d{1,2}:\d{2} ?)+)$", line.strip())
            if not m:
                continue
            day = int(m.group(1))
            if day < prev and prev >= 28:  # page runs on into the next month
                month += 1
            prev = day
            times = re.findall(r"\d{1,2}:\d{2}", m.group(3))
            # Jan page: fajr, fjamaat, sunrise, zuhr, zj, asr, aj, maghrib, isha, ij
            # later pages: sehri, fajr, fjamaat, sunrise, zuhr, zj, asr, aj, maghrib, isha, ij
            if len(times) == 10:
                fajr, _fj, sunrise, zuhr, _zj, asr, _aj, magrib, isha, _ij = times
            elif len(times) == 11:
                _sehri, fajr, _fj, sunrise, zuhr, _zj, asr, _aj, magrib, isha, _ij = times
            else:
                continue
            if not 1 <= month <= 12 or not 1 <= day <= 31:
                continue
            rows[f"2026-{month:02d}-{day:02d}"] = dict(fajr=n(fajr), sunrise=n(sunrise), dhuhr=n(zuhr),
                                                       asr1=n(asr), magrib=n(magrib), isha=n(isha))
    save("bolton-zakariyya-2026", rows)


# ---------- Cambridge Central Mosque, monthly HTML ----------
def cambridge():
    h = open(f"{C}/cam-not-brighton-cambridgecentralmosque-org-prayer-times.bin", encoding="utf-8",
             errors="replace").read()
    rows = {}
    date = None
    for r in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S):
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)]
        if not cells:
            continue
        dm = re.search(r"(\d{2})-(\d{2})-(\d{4})", cells[0])
        if dm:
            date = f"{dm.group(3)}-{dm.group(2)}-{dm.group(1)}"
            continue
        if date and len(cells) >= 6:
            g = [re.findall(r"\d{1,2}:\d{2}", c) for c in cells[1:7]]
            if len(g) == 6 and all(g):
                rows[date] = dict(fajr=n(g[0][0]), sunrise=n(g[1][0]), dhuhr=n(g[2][0]),
                                  asr1=n(g[3][0]), magrib=n(g[4][0]), isha=n(g[5][0]))
    save("cambridge-central-2026-11", rows)


# ---------- Stockport Islamic Centre, monthly HTML ----------
def stockport():
    h = open(f"{C}/south1-stockportislamiccentre-co-uk-prayer-times.bin", encoding="utf-8",
             errors="replace").read()
    rows = {}
    for r in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S):
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)]
        if len(cells) < 12 or not cells[1].isdigit():
            continue
        day = int(cells[1])
        fajr, sunrise, zuhr, asr, isha = (cells[3], cells[4], cells[5], cells[6], cells[7])
        magrib_j = cells[11]
        if not re.match(r"\d{1,2}[:.]\d{2}", fajr):
            continue
        rows[f"2026-11-{day:02d}"] = dict(fajr=n(fajr), sunrise=n(sunrise), dhuhr=n(zuhr),
                                          asr1=n(asr), magrib=n(magrib_j), isha=n(isha))
    save("stockport-islamic-centre-2026-11", rows)


# ---------- Middlesbrough Central Masjid, browser text ----------
def middlesbrough():
    txt = open(f"{C}/middlesbrough-browser-text.txt").read()
    rows = {}
    for m in re.finditer(r"(\d{1,2}) Nov \w{3} (\d{2}:\d{2}) [\d.:]+ (\d{2}:\d{2}) (\d{2}:\d{2}) [\d.:/]+ "
                         r"(\d{2}:\d{2}) [\d.:]+ (\d{2}:\d{2}) (\d{2}:\d{2}) (\d{2}:\d{2})", txt):
        d = int(m.group(1))
        rows[f"2026-11-{d:02d}"] = dict(fajr=n(m.group(2)), sunrise=n(m.group(3)), dhuhr=n(m.group(4)),
                                        asr1=n(m.group(5)), magrib=n(m.group(6)), isha=n(m.group(7)))
    save("middlesbrough-central-2026-11", rows)


# ---------- Watford Jamia Mosque, transcribed from November 2026 image ----------
WATFORD = """1 05:02 06:53 11:47 14:48 16:38 18:29
2 05:04 06:55 11:47 14:47 16:36 18:28
3 05:05 06:57 11:47 14:45 16:34 18:26
4 05:07 06:58 11:47 14:44 16:32 18:25
5 05:08 07:00 11:47 14:42 16:30 18:23
6 05:10 07:02 11:47 14:40 16:29 18:22
7 05:11 07:04 11:47 14:39 16:27 18:20
8 05:13 07:05 11:47 14:37 16:26 18:19
9 05:14 07:07 11:47 14:36 16:24 18:18
10 05:16 07:09 11:47 14:34 16:22 18:16
11 05:17 07:11 11:47 14:33 16:21 18:15
12 05:19 07:12 11:47 14:32 16:19 18:14
13 05:20 07:14 11:47 14:30 16:18 18:13
14 05:22 07:16 11:48 14:29 16:17 18:12
15 05:23 07:18 11:48 14:28 16:15 18:11
16 05:25 07:19 11:48 14:26 16:14 18:10
17 05:26 07:21 11:48 14:25 16:12 18:09
18 05:27 07:23 11:48 14:24 16:11 18:08
19 05:29 07:24 11:48 14:23 16:10 18:07
20 05:30 07:26 11:49 14:22 16:09 18:06
21 05:31 07:28 11:49 14:21 16:08 18:05
22 05:33 07:29 11:49 14:20 16:07 18:04
23 05:34 07:31 11:49 14:19 16:06 18:03
24 05:35 07:32 11:50 14:18 16:05 18:03
25 05:37 07:34 11:50 14:17 16:04 18:02
26 05:38 07:36 11:50 14:16 16:03 18:01
27 05:39 07:37 11:51 14:15 16:02 18:01
28 05:40 07:39 11:51 14:14 16:01 18:00
29 05:42 07:40 11:51 14:14 16:00 18:00
30 05:43 07:42 11:52 14:13 16:00 17:59"""

# Preston Jamea Masjid, transcribed from the masjid247 November 2026 image
PRESTON = """1 05:32 07:11 11:59 14:47 16:17
2 05:34 07:13 11:59 14:45 16:15
3 05:36 07:14 11:59 14:43 16:13
4 05:37 07:16 11:59 14:41 16:12
5 05:39 07:18 11:59 14:39 16:10
6 05:41 07:20 11:59 14:38 16:08
7 05:43 07:22 11:59 14:36 16:07
8 05:45 07:24 12:00 14:34 16:05
9 05:47 07:26 12:00 14:33 16:04
10 05:48 07:28 12:00 14:31 16:02
11 05:50 07:30 12:00 14:30 16:01
12 05:52 07:32 12:00 14:28 16:00
13 05:54 07:34 12:00 14:27 15:58
14 05:56 07:36 12:00 14:25 15:57
15 05:57 07:37 12:00 14:24 15:56
16 05:59 07:39 12:01 14:22 15:55
17 06:01 07:41 12:01 14:21 15:54
18 06:03 07:43 12:01 14:20 15:53
19 06:04 07:45 12:01 14:18 15:52
20 06:06 07:47 12:01 14:17 15:51
21 06:08 07:48 12:02 14:16 15:50
22 06:10 07:50 12:02 14:15 15:49
23 06:11 07:52 12:02 14:14 15:48
24 06:13 07:54 12:02 14:13 15:47
25 06:14 07:55 12:03 14:12 15:46
26 06:16 07:57 12:03 14:11 15:45
27 06:18 07:59 12:03 14:10 15:45
28 06:19 08:00 12:04 14:09 15:44
29 06:21 08:02 12:04 14:08 15:43
30 06:22 08:04 12:04 14:08 15:43"""

# Blackpool Central Mosque, transcribed from the masjid247 November 2026 image
BLACKPOOL = """1 05:33 07:12 12:00 14:48 16:39 18:18
2 05:34 07:14 12:00 14:46 16:37 18:15
3 05:36 07:16 12:00 14:44 16:35 18:15
4 05:38 07:18 12:00 14:42 16:33 18:13
5 05:39 07:20 12:00 14:41 16:31 18:11
6 05:41 07:22 12:00 14:39 16:29 18:10
7 05:43 07:24 12:00 14:37 16:27 18:08
8 05:44 07:26 12:00 14:36 16:26 18:07
9 05:46 07:28 12:00 14:34 16:24 18:05
10 05:48 07:29 12:01 14:32 16:22 18:04
11 05:49 07:31 12:01 14:31 16:20 18:02
12 05:51 07:33 12:01 14:29 16:19 18:01
13 05:52 07:35 12:01 14:28 16:17 18:00
14 05:54 07:37 12:01 14:26 16:15 17:59
15 05:55 07:39 12:01 14:25 16:14 17:57
16 05:57 07:41 12:01 14:24 16:12 17:56
17 05:59 07:43 12:02 14:22 16:11 17:55
18 06:00 07:45 12:02 14:21 16:10 17:54
19 06:02 07:46 12:02 14:20 16:08 17:53
20 06:03 07:48 12:02 14:18 16:07 17:52
21 06:05 07:50 12:03 14:17 16:06 17:51
22 06:06 07:52 12:03 14:16 16:04 17:50
23 06:07 07:54 12:03 14:15 16:03 17:49
24 06:09 07:55 12:03 14:14 16:02 17:48
25 06:10 07:57 12:04 14:13 16:01 17:47
26 06:12 07:59 12:04 14:12 16:00 17:47
27 06:13 08:00 12:04 14:11 15:59 17:46
28 06:14 08:02 12:05 14:10 15:58 17:45
29 06:16 08:04 12:05 14:09 15:57 17:45
30 06:17 08:05 12:05 14:09 15:56 17:44"""


def literal(name, block, fields):
    rows = {}
    for line in block.splitlines():
        v = line.split()
        day = int(v[0])
        rows[f"2026-11-{day:02d}"] = {f: n(x) for f, x in zip(fields, v[1:])}
    save(name, rows)


if __name__ == "__main__":
    luton()
    bolton()
    cambridge()
    stockport()
    middlesbrough()
    literal("watford-jamia-2026-11", WATFORD, ["fajr", "sunrise", "dhuhr", "asr1", "magrib", "isha"])
    literal("preston-jamea-2026-11", PRESTON, ["fajr", "sunrise", "dhuhr", "asr1", "isha"])
    literal("blackpool-central-2026-11", BLACKPOOL, ["fajr", "sunrise", "dhuhr", "asr1", "magrib", "isha"])
