import re, json, sys, os, glob

COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def yearly_tables(html):
    """Every <table class="...vakit-table..."> block, as {date: [6 times]}."""
    out = []
    for m in re.finditer(r'<table[^>]*class="[^"]*vakit-table[^"]*"[^>]*>(.*?)</table>', html, re.S):
        body = m.group(1)
        d = {}
        for r in re.finditer(r'<tr>\s*<td>(\d{2})\.(\d{2})\.(\d{4})</td>(.*?)</tr>', body, re.S):
            day, mon, yr, rest = r.groups()
            times = re.findall(r'<td>\s*(\d{1,2}:\d{2})\s*</td>', rest)
            if len(times) < 6:
                continue
            d[f'{yr}-{mon}-{day}'] = dict(zip(COLS, times[:6]))
        out.append(d)
    return out


def main(paths):
    for p in paths:
        tag = os.path.basename(p).replace('de-diyanet-', '').replace('.bin', '')
        html = open(p, encoding='utf-8', errors='replace').read()
        tabs = yearly_tables(html)
        good = [t for t in tabs if len(t) >= 360]
        if not good:
            print(f'{tag}: NO YEAR TABLE (sizes {[len(t) for t in tabs]})')
            continue
        base = good[0]
        conflict = 0
        for other in good[1:]:
            for k, v in base.items():
                if other.get(k) and other[k] != v:
                    conflict += 1
        keys = sorted(base)
        span = f'{keys[0]}..{keys[-1]}'
        print(f'{tag}: {len(base)} rows {span} tables={[len(t) for t in tabs]} conflicts={conflict} 2027={html.count("2027")}')
        out = f'data/de-diyanet-{tag}-2026.json'
        json.dump(base, open(out, 'w'), indent=0)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:] or sorted(glob.glob('captures/de-diyanet-*.bin'))))
