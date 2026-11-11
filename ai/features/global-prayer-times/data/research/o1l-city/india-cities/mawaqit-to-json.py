#!/usr/bin/env python3
"""Write a mawaqit page's embedded calendar + coordinates to a small JSON for the fitter."""
import json, re, sys


def extract(path):
    s = open(path, encoding='utf-8', errors='replace').read()
    i = s.find('"calendar":[')
    if i < 0:
        raise SystemExit(f'no calendar in {path}')
    start = s.index('[', i)
    depth = 0
    for j in range(start, len(s)):
        if s[j] == '[':
            depth += 1
        elif s[j] == ']':
            depth -= 1
            if depth == 0:
                raw = s[start:j + 1]
                break
    cal = json.loads(raw)
    lat = re.search(r'"latitude":([-\d.]+)', s)
    lon = re.search(r'"longitude":([-\d.]+)', s)
    tz = re.search(r'"timezone":"([^"]+)"', s)
    name = re.search(r'"name":"([^"]{0,80})"', s)
    return {'calendar': cal,
            'lat': float(lat.group(1)) if lat else None,
            'lon': float(lon.group(1)) if lon else None,
            'tz': tz.group(1).replace('\\/', '/') if tz else None,
            'name': name.group(1) if name else None}


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    r = extract(src)
    json.dump(r, open(out, 'w'), ensure_ascii=False)
    print(out, 'months', len(r['calendar']), 'lat', r['lat'], 'lon', r['lon'], 'tz', r['tz'], '|', r['name'])
