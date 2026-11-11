"""Parse a Jamiat perpetual month.html into normalized dated rows."""
import json, re, sys, calendar

KEEP = {"The_Date": None, "Day": "weekday", "Suhoor": "suhoor", "Fajr": "fajr",
        "Sunrise": "sunrise", "Ishraaq": "ishraaq", "Chast": "dhuha",
        "Zawaal": "zawaal", "Zuhr": "zuhr", "Asr_S": "asr_shafi",
        "Asr_H": "asr_hanafi", "Sunset": "sunset", "Maghrib": "maghrib",
        "Isha_S": "isha_shafi", "Isha_H": "isha_hanafi"}


def parse(path):
    html = open(path).read()
    month = re.search(r'<div class="header">([A-Za-z]+)<span class="perp-year">\s*(\d{4})', html)
    mname, year = month.group(1), int(month.group(2))
    mnum = list(calendar.month_name).index(mname)
    # rows: each <div class="tr ..."> containing The_Date..Isha_H cells
    rows_out = {}
    for tr in re.findall(r'<div class="tr (?!col-group)[^"]*"[^>]*>(.*?)</div>\s*(?=<div class="tr |</section>)', html, re.S):
        cells = dict(re.findall(r'<div class="td (?:col-title )?([A-Za-z_]+)[^"]*"\s*>\s*(?:<span>)*([^<]*)', tr))
        # fallback: extract td class + inner text more robustly
        cells = {}
        for m in re.finditer(r'<div class="td ([A-Za-z_]+)[^"]*"[^>]*>(.*?)</div>', tr, re.S):
            key = m.group(1)
            txt = re.sub(r'<span>\s*</span>', ' ', m.group(2))
            txt = re.sub(r'<[^>]+>', ' ', txt)
            txt = re.sub(r'\s+', ' ', txt).strip()
            if key in KEEP:
                cells[key] = txt
        if 'The_Date' not in cells:
            continue
        d = cells['The_Date'].strip()
        if not d.isdigit():
            continue
        date = f"{year}-{mnum:02d}-{int(d):02d}"
        rows_out[date] = {v: cells.get(k, '').strip() for k, v in KEEP.items() if v}
    return mname, year, rows_out


if __name__ == '__main__':
    name, year, rows = parse(sys.argv[1])
    print(name, year, len(rows))
    print(json.dumps(dict(list(rows.items())[:2]), indent=1))
