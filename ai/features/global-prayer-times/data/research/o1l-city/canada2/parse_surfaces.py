#!/usr/bin/env python3
"""Normalise the Canada-2 surfaces into dated rows.

Every date comes from the capture's own label. Times are the athan (begins) column;
iqamah is kept beside it where the surface prints one.
"""
import json, os, re
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(HERE, "captures")
DATA = os.path.join(HERE, "data")
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]


def clock(s, ampm=None):
    h, m = s.split(":")[:2]
    h, m = int(h), int(m)
    if ampm:
        ampm = ampm.upper()
        if ampm == "PM" and h != 12:
            h += 12
        if ampm == "AM" and h == 12:
            h = 0
    return f"{h:02d}:{m:02d}"


def parse_windsor():
    r = PdfReader(os.path.join(CAP, "WIA_2026_Prayer_Times.pdf"))
    rows, iq = {}, {}
    for page in r.pages:
        text = page.extract_text()
        month = None
        for name, num in zip(MONTHS, range(1, 13)):
            if re.search(rf"^{name.upper()}\b", text, re.M):
                month = num
        if not month:
            continue
        for line in text.split("\n"):
            m = re.match(r"^(\d{1,2})-(\w{3})\s+\S+\s+\d{1,2}\s+\S+\s+(.+)$", line.strip())
            if not m:
                continue
            nums = re.findall(r"\d{1,2}:\d{2}", m.group(3))
            if len(nums) != 11:
                continue
            day = int(m.group(1))
            key = f"2026-{month:02d}-{day:02d}"
            f, fi, sr, d, di, a, ai, mg, mgi, ish, ishi = nums
            # the sheet prints 12-hour clocks with no meridiem; each column has one side of noon
            am = lambda v: clock(v, "AM")
            pm = lambda v: clock(v, "PM")
            rows[key] = dict(fajr=am(f), sunrise=am(sr), dhuhr=pm(d), asr=pm(a),
                             maghrib=pm(mg), isha=pm(ish))
            iq[key] = dict(fajr=am(fi), dhuhr=pm(di), asr=pm(ai), maghrib=pm(mgi),
                           isha=pm(ishi))
    return rows, iq


def parse_stjohns():
    r = PdfReader(os.path.join(CAP, "manal_StJohns_2026.pdf"))
    rows = {}
    for page in r.pages:
        text = page.extract_text()
        month, month_pos = None, []
        for name, num in zip(MONTHS, range(1, 13)):
            for m in re.finditer(rf"^{name}\s+Fajr", text, re.M):
                month_pos.append((m.start(), num))
        month_pos.sort()
        for line_no, line in enumerate(text.split("\n")):
            m = re.match(r"^(\d{1,2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s*$", line.strip())
            if not m:
                continue
            pos = text.find(line.strip())
            month = [n for p, n in month_pos if p <= pos][-1] if month_pos else None
            if not month:
                continue
            key = f"2026-{month:02d}-{int(m.group(1)):02d}"
            rows[key] = dict(fajr=m.group(2), sunrise=m.group(3), dhuhr=m.group(4),
                             asr=m.group(5), maghrib=m.group(6), isha=m.group(7))
    return rows


def parse_london():
    rows, iq = {}, {}
    for path in sorted(os.listdir(CAP)):
        m = re.match(r"lmm_(\d{4})-(\d{2})\.html", path)
        if not m:
            continue
        year, month = int(m.group(1)), int(m.group(2))
        h = open(os.path.join(CAP, path), encoding="utf-8", errors="ignore").read()
        body = h[h.find("<tbody>"):h.find("</tbody>")]
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
            daym = re.search(r">\s*[A-Z][a-z]{2}\s+(\d{2})\s*<", tr)
            if not daym:
                continue
            cells = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
            if len(cells) < 7:
                continue
            day = int(daym.group(1))

            def times(cell):
                return re.findall(r"(\d{1,2}:\d{2}\s*[AP]M)", cell)

            f = times(cells[1]); sr = times(cells[2]); d = times(cells[3])
            a = times(cells[4]); mg = times(cells[5]); ish = times(cells[6])
            if not (f and sr and d and a and mg and ish):
                continue
            key = f"{year}-{month:02d}-{day:02d}"
            conv = lambda t: clock(t.split()[0], t.split()[1])
            rows[key] = dict(fajr=conv(f[0]), sunrise=conv(sr[0]), dhuhr=conv(d[0]),
                             asr=conv(a[0]), maghrib=conv(mg[0]), isha=conv(ish[0]))
            if len(f) > 1:
                iq[key] = dict(fajr=conv(f[1]), dhuhr=conv(d[1]), asr=conv(a[1]),
                               maghrib=conv(mg[1]), isha=conv(ish[1]))
    return rows, iq


DPT = {
    "saskatoon-iask": ("captures/dptprobe_islamiccenter.sk.ca.json", "2026"),
    "saskatoon-pma": ("captures/dptprobe_saskatoonmosque.com.json", "2026"),
    "saskatoon-dawah": ("captures/dptprobe_dawahcenter.ca.json", "2026"),
    "saskatoon-jrj": ("captures/dptprobe_jrjsk.ca.json", "2025"),
    "halifax-umcc": ("captures/dpt_ummah_halifax_year.json", "2025"),
    "london-icswo": ("captures/dptprobe2_islamiccentre.ca.json", "2026"),
}


def parse_dpt():
    out = {}
    for name, (path, label) in DPT.items():
        d = json.load(open(os.path.join(HERE, path)))
        arr = d[0] if isinstance(d[0], list) else d
        rows, iq = {}, {}
        for r in arr:
            key = r["d_date"]
            rows[key] = dict(fajr=r["fajr_begins"][:5], sunrise=r["sunrise"][:5],
                             dhuhr=r["zuhr_begins"][:5], asr=r["asr_mithl_1"][:5],
                             maghrib=r["maghrib_begins"][:5], isha=r["isha_begins"][:5])
            iq[key] = dict(fajr=r["fajr_jamah"][:5], dhuhr=r["zuhr_jamah"][:5],
                           asr=r["asr_jamah"][:5], maghrib=r["maghrib_jamah"][:5],
                           isha=r["isha_jamah"][:5])
        out[name] = (label, rows, iq)
    return out


def parse_masjidal_saintjohn():
    d = json.load(open(os.path.join(CAP, "masjidal_saintjohn_nb_2026.json")))
    rows, iq = {}, {}

    def iso(label):
        m = re.match(r"\w+,\s+(\w+)\s+(\d{1,2}),\s+(\d{4})", label)
        month = [n for n in MONTHS if n.startswith(m.group(1)[:3])][0]
        return f"{m.group(3)}-{MONTHS.index(month)+1:02d}-{int(m.group(2)):02d}"

    def t(v):
        m = re.match(r"(\d{1,2}):(\d{2})\s*([AP]M)", v.strip(), re.I)
        return clock(f"{m.group(1)}:{m.group(2)}", m.group(3)) if m else None

    for r in d["data"]["salah"]:
        rows[iso(r["date"])] = dict(fajr=t(r["fajr"]), sunrise=t(r["sunrise"]), dhuhr=t(r["zuhr"]),
                                    asr=t(r["asr"]), maghrib=t(r["maghrib"]), isha=t(r["isha"]))
    for r in d["data"]["iqamah"]:
        iq[iso(r["date"])] = dict(fajr=t(r["fajr"]), dhuhr=t(r["zuhr"]), asr=t(r["asr"]),
                                  maghrib=t(r["maghrib"]), isha=t(r["isha"]))
    return rows, iq


def main():
    os.makedirs(DATA, exist_ok=True)
    meta = {}

    rows, iq = parse_windsor()
    json.dump(rows, open(os.path.join(DATA, "dpt-on-windsor-2026.json"), "w"), indent=0, sort_keys=True)
    json.dump(iq, open(os.path.join(DATA, "iqamah-on-windsor-2026.json"), "w"), indent=0, sort_keys=True)
    meta["windsor"] = dict(prov="ON", city="Windsor", source="WIA 2026 Prayer Times PDF",
                           lat=42.3149, lon=-83.0364, tz="America/Toronto", rows=len(rows))

    rows = parse_stjohns()
    json.dump(rows, open(os.path.join(DATA, "pdf-nl-stjohns-2026.json"), "w"), indent=0, sort_keys=True)
    meta["stjohns"] = dict(prov="NL", city="St Johns", source="MANAL StJohnsPrayerTimes2026.pdf",
                           lat=47.5615, lon=-52.7126, tz="America/St_Johns", rows=len(rows))

    rows, iq = parse_london()
    json.dump(rows, open(os.path.join(DATA, "cms-on-london-2025-2026.json"), "w"), indent=0, sort_keys=True)
    json.dump(iq, open(os.path.join(DATA, "iqamah-on-london-2025-2026.json"), "w"), indent=0, sort_keys=True)
    meta["london"] = dict(prov="ON", city="London", source="londonmosque.ca monthly pray_time pages",
                          lat=42.9849, lon=-81.2453, tz="America/Toronto", rows=len(rows))

    for name, (label, rows, iq) in parse_dpt().items():
        if name.startswith("halifax"): city, prov = "Halifax", "NS"
        elif name.startswith("london"): city, prov = "London", "ON"
        else: city, prov = "Saskatoon", "SK"
        json.dump(rows, open(os.path.join(DATA, f"dpt-{prov.lower()}-{name}-{label}.json"), "w"), indent=0, sort_keys=True)
        json.dump(iq, open(os.path.join(DATA, f"iqamah-{prov.lower()}-{name}-{label}.json"), "w"), indent=0, sort_keys=True)
        meta[name] = dict(prov=prov, city=city, source=f"dpt filter=year ({label} label)",
                          lat=44.6488 if prov == "NS" else (42.9849 if prov == "ON" else 52.1332),
                          lon=-63.5752 if prov == "NS" else (-81.2453 if prov == "ON" else -106.6700),
                          tz="America/Halifax" if prov == "NS" else ("America/Toronto" if prov == "ON" else "America/Regina"),
                          rows=len(rows))

    rows, iq = parse_masjidal_saintjohn()
    json.dump(rows, open(os.path.join(DATA, "masjidal-nb-saintjohn-2026.json"), "w"), indent=0, sort_keys=True)
    json.dump(iq, open(os.path.join(DATA, "iqamah-nb-saintjohn-2026.json"), "w"), indent=0, sort_keys=True)
    meta["saintjohn"] = dict(prov="NB", city="Saint John", source="masjidal range API Vdw3zode",
                             lat=45.2733, lon=-66.0633, tz="America/Moncton", rows=len(rows))

    json.dump(meta, open(os.path.join(DATA, "surfaces.json"), "w"), indent=1)
    for k, v in meta.items():
        print(k, v["prov"], v["city"], v["rows"])


if __name__ == "__main__":
    main()
