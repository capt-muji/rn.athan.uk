# dump per-sheet rows (time cells + day column) from the DUM RB Ufa PDFs as JSON
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer
import re, json, glob

TIME = re.compile(r'^\d{1,2}:\d{2}$')
COLS = {'suhur': 68, 'fajr': 126, 'sunrise': 183, 'zaual': 237, 'dhuhr': 289, 'asr': 339, 'maghrib': 392, 'isha': 445}

def colof(x):
    best = min(COLS, key=lambda k: abs(COLS[k] - x))
    return best if abs(COLS[best] - x) < 25 else None

sheets = []
for f in sorted(glob.glob('../captures/dumrb_ufa_2026-*.pdf')):
    rows_y = []   # sorted row y positions
    cells = {}    # y -> {col: time}
    days = {}     # y -> day number from Дата column
    for page in extract_pages(f):
        for c in page:
            if not isinstance(c, LTTextContainer):
                continue
            for line in c:
                if not hasattr(line, 'get_text'):
                    continue
                try:
                    t = line.get_text().strip()
                    y = round(line.y0)
                    x = line.x0
                except AttributeError:
                    continue
                if TIME.match(t):
                    k = colof(x)
                    if k:
                        cells.setdefault(y, {})[k] = t
                elif t.isdigit() and len(t) <= 2 and x < 45 and y > 680:
                    pass  # header row day markers excluded by y guard? keep simple: skip
                elif t.isdigit() and len(t) <= 2 and x < 45:
                    days.setdefault(y, int(t))
    ys = sorted(set(cells) & set(days), reverse=True)
    rows = []
    for y in ys:
        rows.append(cells[y])
    sheets.append({'file': f.split('/')[-1], 'rows': rows})
print(json.dumps(sheets))
