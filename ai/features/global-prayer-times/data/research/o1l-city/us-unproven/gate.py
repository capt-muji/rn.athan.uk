#!/usr/bin/env python3
"""Live-page gate (R5): the captured table must equal what the publisher serves now.

Each surface is re-fetched for explicit dates taken from the capture itself, and the
rows must agree cell for cell. No system clock is read anywhere.
"""
import os, re, json, glob, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "fits", "gates.json")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")
CELLS = ["fajr_athan", "fajr_iqamah", "sunrise", "dhuhr_athan", "dhuhr_iqamah",
         "asr_athan", "asr_iqamah", "maghrib", "isha_athan", "isha_iqamah"]
MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
          "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]


def get(url, headers=None):
    h = {"User-Agent": UA}
    h.update(headers or {})
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=60) as r:
        return r.read().decode("utf-8", "ignore")


def sample_dates(days):
    keys = sorted(days)
    picks = [keys[len(keys) // 6], keys[len(keys) // 2], keys[-3]]
    return picks


def athanplus_rows(mid, year, month):
    html = get(f"https://timing.athanplus.com/masjid/widgets/monthly"
               f"?theme=2&masjid_id={mid}&date={year}-{month:02d}-01")
    mon = re.search(r'class="cMonth">\s*([A-Za-z]+)', html)
    if not mon or mon.group(1).upper() != MONTHS[month - 1]:
        return None
    body = html[html.find('<table id="time-table"'):]
    cell = re.compile(r'<td class="(?:regCell|iqamahCell)[^"]*">\s*<span>\s*([^<]*?)\s*</span>', re.S)
    rows = {}
    for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S):
        spans = cell.findall(tr)
        if not spans or not spans[0].isdigit():
            continue
        vals = [v for v in spans[1:] if re.fullmatch(r"\d{1,2}:\d{2}", v)][:10]
        if len(vals) == 10:
            rows[f"{year}-{month:02d}-{int(spans[0]):02d}"] = vals
    return rows


def gate_athanplus(path):
    d = json.load(open(path))
    mid = d["masjid_id"]
    checked = []
    for date in sample_dates(d["days"]):
        y, m = int(date[:4]), int(date[5:7])
        live = athanplus_rows(mid, y, m)
        if live is None:
            return {"surface": path, "status": "LIVE_MONTH_MISMATCH", "date": date}
        cap = [d["days"][date][c] for c in CELLS]
        if live.get(date) != cap:
            return {"surface": path, "status": "MISMATCH", "date": date,
                    "capture": cap, "live": live.get(date)}
        checked.append(date)
    return {"surface": path, "status": "MATCH", "dates": checked}


def gate_masjidbox(path):
    d = json.load(open(path))
    slug = d["slug"]
    checked = []
    for date in sample_dates(d["rows"]):
        j = json.loads(get(f"https://api.masjidbox.com/1.0/masjidbox/landing/athany/{slug}"
                           f"?get=at&days=7&begin={date}",
                           {"apikey": "JejYcMS7hsOsZTPDk2ZhKOAlW9IyQ6Px"}))
        row = next((r for r in (j.get("timetable") or []) if r["date"][:10] == date), None)
        if not row:
            return {"surface": path, "status": "LIVE_MISSING_ROW", "date": date}
        cap = d["rows"][date]
        if any(cap[c] != row[c] for c in ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]):
            return {"surface": path, "status": "MISMATCH", "date": date}
        checked.append(date)
    return {"surface": path, "status": "MATCH", "dates": checked}


def gate_birmingham(path):
    d = json.load(open(path))
    checked = []
    for date in sample_dates(d["days"]):
        j = json.loads(get(f"https://www.bisweb.org/wp-json/bis/v1/adhans?date={date}"))
        if not j.get("data"):
            return {"surface": path, "status": "LIVE_EMPTY", "date": date}
        pt = j["data"]["prayer_times"]
        live = {"fajr": pt["fajr"][:5], "sunrise": pt["sunrise"][:5], "dhuhr": pt["dhur"][:5],
                "asr": pt["asr"][:5], "maghrib": pt["maghrib"][:5], "isha": pt["isha"][:5]}
        cap = d["days"][date]
        if any(cap[c] != live[c] for c in live):
            return {"surface": path, "status": "MISMATCH", "date": date, "capture": cap, "live": live}
        checked.append(date)
    return {"surface": path, "status": "MATCH", "dates": checked}


def gate_raleigh(path):
    d = json.load(open(path))
    keys = sorted(d["days"])
    checked = []
    for date in [keys[0], keys[len(keys) // 2], keys[-1]]:
        y, m = int(date[:4]), int(date[5:7])
        html = get(f"https://raleighmasjid.org/prayer/prayer-schedule.php?month={m}&year={y}")
        body = html[html.find("Prayer Schedule"):]
        live = {}
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
            cells = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", c)).strip()
                     for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
            if len(cells) < 13:
                continue
            m0 = re.match(r"^(\d{1,2})\s+[A-Z][a-z]{2}$", cells[0])
            if not m0:
                continue
            times = [c for c in cells[2:] if re.fullmatch(r"\d{1,2}:\d{2}", c)]
            if len(times) == 11:
                live[f"{y}-{m:02d}-{int(m0.group(1)):02d}"] = times
        cap = d["days"][date]
        want = [cap[c] for c in ["fajr_athan", "fajr_iqamah", "sunrise", "dhuhr_athan",
                                 "dhuhr_iqamah", "asr_athan", "asr_iqamah", "maghrib_athan",
                                 "maghrib_iqamah", "isha_athan", "isha_iqamah"]]
        if live.get(date) != want:
            return {"surface": path, "status": "MISMATCH", "date": date,
                    "capture": want, "live": live.get(date)}
        checked.append(date)
    return {"surface": path, "status": "MATCH", "dates": checked}


def gate_mawaqit(path):
    d = json.load(open(path))
    html = get(d["url"])
    times = re.search(r'times":\[([^\]]+)\]', html)
    if not times:
        return {"surface": path, "status": "UNPARSED"}
    live = [x.strip().strip('"')[:5] for x in times.group(1).split(",")][:5]
    for mi, month in enumerate(d["calendar"], start=1):
        for day, vals in month.items():
            # six solar columns, or seven when the mosque pins an iqamah in front
            cols = vals[1:] if len(vals) >= 7 else vals
            if [cols[0][:5], cols[2][:5], cols[3][:5], cols[4][:5], cols[5][:5]] == live:
                return {"surface": path, "status": "MATCH",
                        "date": f"{d.get('year', 2026)}-{mi:02d}-{int(day):02d}"}
    return {"surface": path, "status": "MISMATCH", "live": live}


def gate_harrisburg(path):
    d = json.load(open(path))
    url = "https://isghpa.alminaret.com/salah-calendar"
    html = get(url)
    rows = re.findall(r"(\d{2}/\d{2}/\d{4})", html)
    if not rows:
        return {"surface": path, "status": "JS_RENDERED_ONLY"}
    return {"surface": path, "status": "SEE_CAPTURE", "dates_on_page": rows[:2]}


def main():
    gates = []
    for path in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        base = os.path.basename(path)
        try:
            if base.endswith("-athanplus.json"):
                g = gate_athanplus(path)
            elif base.endswith("-masjidbox.json"):
                g = gate_masjidbox(path)
            elif base.startswith("Birmingham-"):
                g = gate_birmingham(path)
            elif base.startswith("Raleigh-"):
                g = gate_raleigh(path)
            elif base.endswith("-mawaqit.json"):
                g = gate_mawaqit(path)
            elif base.startswith("Harrisburg-"):
                g = gate_harrisburg(path)
            else:
                g = {"surface": path, "status": "SINGLE_CAPTURE"}
        except Exception as e:
            g = {"surface": path, "status": "ERR:" + type(e).__name__}
        print(base, g["status"], g.get("dates", g.get("date", "")), flush=True)
        gates.append(g)
    json.dump(gates, open(OUT, "w"), indent=1)


if __name__ == "__main__":
    main()
