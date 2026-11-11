#!/usr/bin/env python3
"""Pull athanplus / Masjidal monthly athan+iqamah tables.

The widget is the publisher's own monthly board: 10 time cells per day,
[fajr athan, fajr iqamah, sunrise, dhuhr athan, dhuhr iqamah, asr athan,
 asr iqamah, maghrib, isha athan, isha iqamah]. `date=YYYY-MM-01` selects any
month in any year, so the span is the endpoint's, not the page's.
"""
import os, re, sys, json, urllib.request, urllib.error, concurrent.futures

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "captures", "athanplus")
OUT = os.path.join(HERE, "data")
os.makedirs(RAW, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")

TARGETS = {
    "Flint": [("E5Avv2AX", "Flint Islamic Center")],
    "Gainesville": [("rdRvbbdG", "Islamic Community Center of Gainesville")],
    "Knoxville": [("BYADPlAN", "Quran Center of Knoxville")],
    "Portland": [("adJmGxAk", "Islamic Center of Portland - Masjid As-Saber"),
                 ("3AO2n4Le", "Towhid Islamic Center")],
    "Tucson": [("Edol0GK7", "Islamic Center of Tucson")],
    "Detroit": [("4nL1kgda", "Islamic Association of Greater Detroit (Rochester Hills)")],
    "Rochester": [("Vdw3P8de", "Masjid Tawfeeq of Rochester")],
    "Baton Rouge": [("4KB0kPA5", "Masjid Al-Noor (ICBR)"), ("jKZpJ7AX", "Ar-Rahman (ICBR)")],
    "Providence": [("YAD4yNAN", "Masjid Al-Islam (North Smithfield RI)")],
}

CELLS = ["fajr_athan", "fajr_iqamah", "sunrise", "dhuhr_athan", "dhuhr_iqamah",
         "asr_athan", "asr_iqamah", "maghrib", "isha_athan", "isha_iqamah"]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")


def parse(html):
    """Return ({date: [10 cells]}, month, year, masjid name, address)."""
    cm = re.search(r'class="cMonth">\s*([A-Za-z]+)', html)
    cy = re.search(r'class="cYear">\s*(\d{4})', html)
    month = cm.group(1) if cm else None
    year = int(cy.group(1)) if cy else None
    name = re.search(r'class="masjidName">\s*([^<]+)', html)
    addr = re.search(r'class="masjidAddress"[^>]*>([^<]*)', html)
    body = html[html.find('<table id="time-table"'):]
    cell = re.compile(r'<td class="(?:regCell|iqamahCell)[^"]*">\s*<span>\s*([^<]*?)\s*</span>', re.S)
    rows = {}
    for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S):
        spans = cell.findall(tr)
        if not spans or not spans[0].isdigit():
            continue
        day = spans[0]
        vals = [v for v in spans[1:] if re.fullmatch(r"\d{1,2}:\d{2}", v)]
        if len(vals) < len(CELLS):
            continue
        rows[int(day)] = vals[:len(CELLS)]
    return rows, month, year, (name.group(1).strip() if name else None), (addr.group(1).strip() if addr else None)


def pull(job):
    metro, mid, name, year, month = job
    path = os.path.join(RAW, f"{metro}-{mid}-{year}-{month:02d}.html")
    try:
        if os.path.exists(path):
            html = open(path, encoding="utf-8", errors="replace").read()
        else:
            url = (f"https://timing.athanplus.com/masjid/widgets/monthly"
                   f"?theme=2&masjid_id={mid}&date={year}-{month:02d}-01")
            html = get(url)
            open(path, "w").write(html)
    except Exception as e:
        return (metro, mid, year, month, None, "ERR:" + type(e).__name__)
    rows, mon, yr, mname, addr = parse(html)
    if not rows:
        return (metro, mid, year, month, None, "NOPARSE")
    want = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
            "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"][month - 1]
    if mon is None or mon.upper() != want:
        return (metro, mid, year, month, None, f"MISMATCH {mon}")
    return (metro, mid, year, month, {"rows": rows, "name": mname, "addr": addr}, "ok")


def main():
    years = [int(y) for y in sys.argv[1:]] or [2025, 2026, 2027]
    jobs = [(m, mid, name, y, mo) for m, lst in TARGETS.items() for (mid, name) in lst
            for y in years for mo in range(1, 13)]
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for metro, mid, year, month, data, status in ex.map(pull, jobs):
            if status != "ok":
                print("FAIL", metro, mid, year, month, status, flush=True)
                continue
            key = (metro, mid)
            results.setdefault(key, {"name": data["name"], "addr": data["addr"], "days": {}})
            for d, vals in data["rows"].items():
                results[key]["days"][f"{year}-{month:02d}-{d:02d}"] = dict(zip(CELLS, vals))
    for (metro, mid), v in results.items():
        path = os.path.join(OUT, f"{metro}-{mid}-athanplus.json")
        json.dump({"metro": metro, "masjid_id": mid, "name": v["name"], "address": v["addr"],
                   "source": f"https://timing.athanplus.com/masjid/widgets/monthly?masjid_id={mid}",
                   "engine": "Masjidal/athanplus", "days": v["days"]}, open(path, "w"), indent=1)
        print(metro, mid, v["name"], len(v["days"]), "rows ->", os.path.basename(path))


if __name__ == "__main__":
    main()
