import json, re, sys, glob, os
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer

MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY",
          "AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"]
TIME = re.compile(r'^\d{1,2}:\d{2}$')
DAY = re.compile(r'^\d{1,2}$')
NAMES = ["fajr","sunrise","dhuhr","asr","maghrib","isha"]


def tokens(page):
    """Yield (x_centre, y_centre, text) for every time and day token."""
    out = []
    for el in page:
        if not isinstance(el, LTTextContainer):
            continue
        for line in el.get_text().split("\n"):
            t = line.strip()
            if TIME.match(t) or DAY.match(t):
                out.append(t)
    return out


def positioned(page):
    """Per-line boxes, so each token keeps its own y."""
    out = []
    for el in page:
        if not isinstance(el, LTTextContainer):
            continue
        for line in el:
            try:
                txt = line.get_text().strip()
            except AttributeError:
                continue
            if TIME.match(txt) or DAY.match(txt):
                out.append((round((line.x0 + line.x1) / 2, 1),
                            round((line.y0 + line.y1) / 2, 1), txt))
    return out


def month_of(page):
    for el in page:
        if isinstance(el, LTTextContainer):
            flat = re.sub(r'\s+', '', el.get_text()).upper()
            for i, m in enumerate(MONTHS):
                if flat == m:
                    return i + 1
    return None


def parse_page(page):
    toks = positioned(page)
    days = [t for t in toks if DAY.match(t[2]) and 1 <= int(t[2]) <= 31]
    times = [t for t in toks if TIME.match(t[2])]
    if not days or len(times) < 26:
        return None, {"days": len(days), "times": len(times)}
    # column x bands from the time tokens themselves
    xs = sorted({t[0] for t in times})
    bands = []
    for x in xs:
        if not bands or x - bands[-1][-1] > 20:
            bands.append([x])
        else:
            bands[-1].append(x)
    centres = [sum(b) / len(b) for b in bands]
    if len(centres) != 6:
        return None, {"bands": len(centres), "times": len(times)}
    rows = {}
    for x, y, txt in days:
        d = int(txt)
        rec = {}
        for name, cx in zip(NAMES, centres):
            cands = [t for t in times if abs(t[0] - cx) < 20 and abs(t[1] - y) < 6]
            if len(cands) == 1:
                rec[name] = cands[0][2]
        if len(rec) == 6:
            rows[d] = rec
    return rows, None


def parse(path):
    out, bad = {}, []
    for idx, page in enumerate(extract_pages(path), 1):
        m = month_of(page)
        rows, err = parse_page(page)
        if m is None or rows is None or len(rows) < 26:
            bad.append({"page": idx, "month": m, "err": err,
                        "rows": 0 if rows is None else len(rows)})
            continue
        out[m] = rows
    return out, bad


def main():
    total = 0
    for path in sorted(glob.glob(sys.argv[1])):
        city = os.path.basename(path).replace("ifi_", "").replace("_prayer_timetable.pdf", "")
        d, bad = parse(path)
        n = sum(len(v) for v in d.values())
        total += n
        flag = "" if not bad else f"  BAD {bad}"
        print(f"{city:14s} months={len(d):2d} rows={n:3d} days={[len(d[m]) for m in sorted(d)]}{flag}")
    print("TOTAL ROWS", total)


if __name__ == "__main__":
    main()
