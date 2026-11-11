import pypdf, re, json, sys, calendar

TOKEN = re.compile(r'\d{1,2}\.\d{2}')
MONTHNO = re.compile(r'(\d{1,2})\s*/\s*(20\d\d)')

def scan_times(text):
    """Left-to-right scan of HH.MM tokens in a run-together timetable line."""
    text = re.sub(r'(\d{1,2}):(\d{2})', r'\1.\2', text)
    out, i = [], 0
    while i < len(text):
        m = TOKEN.match(text, i)
        if m:
            out.append(m.group(0))
            i = m.end()
        else:
            i += 1
    return out

def rows_of(text):
    t = scan_times(text)
    return [(t[i], t[i+1], t[i+2], t[i+3], t[i+4], t[i+5])
            for i in range(0, len(t) - 5, 6)]

def parse(path, year):
    r = pypdf.PdfReader(path)
    out = {}
    for pi in range(1, min(13, len(r.pages))):
        txt = r.pages[pi].extract_text()
        m = MONTHNO.search(txt)
        month = int(m.group(1))
        n = calendar.monthrange(year, month)[1]
        rows = rows_of(txt)
        if len(rows) != n:
            print(f"page {pi+1} month {month}: rows={len(rows)} expected={n}", file=sys.stderr)
        for d, row in enumerate(rows[:n], start=1):
            out[f"{year}-{month:02d}-{d:02d}"] = dict(zip(
                ("fajr","sunrise","dhuhr","asr","magrib","isha"),
                (x.replace('.', ':') for x in row)))
    return out

if __name__ == "__main__":
    path, year, dest = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    d = parse(path, year)
    print(len(d), "rows ->", dest)
    json.dump(d, open(dest, "w"), indent=0, sort_keys=True)
