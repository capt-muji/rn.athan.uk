#!/usr/bin/env python3
"""Harvest masjidbox dated timetables in 7-day windows and merge to one JSON per mosque-year."""
import json, os, subprocess, sys, datetime, time

CAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'captures')
KEY = 'JejYcMS7hsOsZTPDk2ZhKOAlW9IyQ6Px'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
BASE = 'https://api.masjidbox.com/1.0/masjidbox/landing/athany/'


def fetch(slug, begin):
    url = f'{BASE}{slug}?get=at&days=7&begin={begin}'
    for attempt in range(3):
        p = subprocess.run(['curl', '-s', '-m', '40', '-H', f'apikey: {KEY}', '-H', f'User-Agent: {UA}', url],
                           capture_output=True, text=True)
        if p.returncode == 0 and p.stdout.strip().startswith('{'):
            try:
                return json.loads(p.stdout)
            except json.JSONDecodeError:
                pass
        time.sleep(2 + attempt * 3)
    return None


def harvest(slug, tag, year):
    out = {}
    meta = None
    d = datetime.date(year, 1, 1)
    end = datetime.date(year, 12, 31)
    while d <= end:
        data = fetch(slug, d.isoformat())
        if data is None:
            print(f'  MISS {slug} {d}', flush=True)
        else:
            if meta is None:
                meta = {k: data.get(k) for k in ('name', 'address', 'country', 'settings')}
            for row in data.get('timetable', []):
                out[row['date'][:10]] = row
        d += datetime.timedelta(days=7)
    name = f'mbx-{tag}-{year}.json'
    with open(os.path.join(CAP, name), 'w') as f:
        json.dump({'meta': meta, 'slug': slug, 'days': out}, f, ensure_ascii=False)
    print(f'{name}: {len(out)} days, meta={meta and meta.get("name")}', flush=True)
    return len(out)


if __name__ == '__main__':
    slug, tag, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
    harvest(slug, tag, year)
