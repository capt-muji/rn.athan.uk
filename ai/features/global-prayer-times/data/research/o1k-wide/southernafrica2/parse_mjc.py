"""Parse the MJC salaah-times month table into normalized dated rows."""
import json, re, sys, calendar, html as htmllib


def parse(path):
    h = open(path).read()
    cap = re.search(r'Cape Town — ([A-Za-z]+) (\d{4})', h)
    mname, year = cap.group(1), int(cap.group(2))
    mnum = list(calendar.month_name).index(mname)
    table = re.search(r'<div class="mjc-salaah-calendar"[^>]*>\s*<table>.*?</table>', h, re.S).group(0)
    rows_out = {}
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', table, re.S):
        cells = [htmllib.unescape(re.sub(r'<[^>]+>', '', c)).strip()
                 for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', tr, re.S)]
        d = re.search(r'\b(\d{1,2})\b', cells[0])
        if not d:
            continue
        date = f"{year}-{mnum:02d}-{int(d.group(1)):02d}"
        times = [c for c in cells[1:] if re.match(r'\d{1,2}:\d{2}', c)]
        if len(times) < 6:
            continue
        rows_out[date] = {'fajr': times[0], 'sunrise': times[1], 'dhuhr': times[2],
                          'asr': times[3], 'maghrib': times[4], 'isha': times[5]}
    return mname, year, rows_out


if __name__ == '__main__':
    name, year, rows = parse(sys.argv[1])
    print(name, year, len(rows), json.dumps(dict(list(rows.items())[:1]), indent=1))
