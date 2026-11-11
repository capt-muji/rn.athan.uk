"""Normalise the captured grid rows to the census data shape.

The grid prints a 12-hour clock with no meridiem. The four afternoon columns are read
through their clock window (noon keeps hour 11 as morning), the same rule the verifier
uses. Output is date-keyed for the census shape, but every file says in its own header
that this is a calculator's sample: yearless, 2004 declination, 3-4 day sampling.
"""
import json
from pathlib import Path

DATA = Path(__file__).parent / "data"
OUT = DATA / "normalized"
FLOOR = {'noon': 10, 'asr': 11, 'sunset': 11, 'isha': 11}
# printed column names, kept verbatim: 日中 is solar noon, not dhuhr, and 日没 is
# geometric sunset, not maghrib. The grid's own rules put dhuhr at noon +5 and maghrib
# at sunset +5, so those two are derived and labelled as such.
KEYS = [('fajr', 'fajr'), ('sunrise', 'sunrise'), ('noon', 'noon'),
        ('asr', 'asr'), ('sunset', 'sunset'), ('isha', 'isha')]


def clock(value, col):
    h, m = (int(x) for x in value.split(':'))
    if col in FLOOR and h <= FLOOR[col]:
        h += 12
    return f"{h:02d}:{m:02d}"


def main():
    OUT.mkdir(exist_ok=True)
    for f in sorted(DATA.glob('grid_*.json')):
        if f.name in ('grid-points.json', 'grid-fetch-log.json'):
            continue
        d = json.loads(f.read_text())
        rows = {}
        for r in d['rows']:
            key = f"{r['month']:02d}-{r['day']:02d}"
            printed = {out: clock(r[src], src) for src, out in KEYS}
            h, m = (int(x) for x in printed['noon'].split(':'))
            dhuhr = f"{h + (m + 5) // 60:02d}:{(m + 5) % 60:02d}"
            h, m = (int(x) for x in printed['sunset'].split(':'))
            maghrib = f"{h + (m + 5) // 60:02d}:{(m + 5) % 60:02d}"
            h, m = (int(x) for x in printed['fajr'].split(':'))
            imsak = f"{(h * 60 + m - 10) // 60:02d}:{(h * 60 + m - 10) % 60:02d}"
            rows[key] = {**printed, 'derived': {'dhuhr': dhuhr, 'maghrib': maghrib,
                                                'imsak': imsak}}
        (OUT / f.name).write_text(json.dumps(
            {'city': d['city'], 'class': d['class'], 'lon': d['lon'], 'lat': d['lat'],
             'source': d['source'], 'clock': 'Asia/Shanghai (UTC+8), 24h',
             'note': 'sampled days only (3-4 day step), no year on the surface',
             'stated_margins': 'dhuhr = noon +5, maghrib = sunset +5, imsak = fajr -10 '
                               '(printed columns carry none of them)',
             'rows': rows}, ensure_ascii=False, indent=1))
        print(f"{d['city']:7s} {len(rows):3d} sampled days -> data/normalized/{f.name}")


if __name__ == '__main__':
    main()
