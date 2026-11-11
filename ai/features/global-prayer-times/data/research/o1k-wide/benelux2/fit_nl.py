import json, sys
sys.path.insert(0, '.')
from solar import *
from datetime import date, datetime
from zoneinfo import ZoneInfo
TZ = ZoneInfo('Europe/Amsterdam')
CITY = {"amsterdam": (52.3676, 4.9041), "utrecht": (52.0907, 5.1214),
        "rotterdam": (51.9244, 4.4777), "ypenburg": (52.0400, 4.3600)}

def m(s):
    h, mm = s.split(':'); return int(h) * 60 + int(mm)

def off(dt):
    return int(datetime(dt.year, dt.month, dt.day, 12, tzinfo=TZ).utcoffset().total_seconds() // 60)

def rel(a, b): return ((a - b + 720) % 1440) - 720

def fit(name, path, lat, lon, lo, hi, rising, cap):
    d = json.load(open(path))
    rows = [(date(*map(int, k.split('-'))), m(v[name])) for k, v in sorted(d.items())]
    best = None
    a = lo
    while a <= hi:
        res = []
        for dt, target in rows:
            t = time_at_angle(dt, lat, lon, a, rising)
            if t is None: res = None; break
            res.append(rel(target, t + off(dt)))
        if res:
            rms = (sum(r * r for r in res) / len(res)) ** 0.5
            if best is None or rms < best[1]: best = (a, rms)
        a += 0.02
    return best[0], best[1]

if __name__ == '__main__':
    path, city, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
    lat, lon = CITY[city]
    print(f"{path} ({city} {lat},{lon})")
    f = fit('fajr', path, lat, lon, 14, 21, True, None)
    i = fit('isha', path, lat, lon, 13, 20, False, None)
    print(f"  fajr best angle {f[0]:5.2f} rms {f[1]:5.2f} | isha best angle {i[0]:5.2f} rms {i[1]:5.2f}")
    d = json.load(open(path))
    for a in (18.0,):
        for name, rising in (('fajr', True), ('isha', False)):
            res = []
            for k, v in sorted(d.items()):
                dt = date(*map(int, k.split('-')))
                t = time_at_angle(dt, lat, lon, a, rising)
                if t is None: continue
                res.append(rel(m(v[name]), t + off(dt)))
            mu = sum(res) / len(res)
            print(f"  at {a}: {name} n={len(res)} mean {mu:+.2f} rms {(sum((x-mu)**2 for x in res)/len(res))**0.5:.2f} max {max(abs(x-mu) for x in res):.1f}")
    # caps
    caps = sorted({v['fajr'] for v in d.values()})
    print("  fajr earliest:", caps[:3], " isha latest:", sorted({v['isha'] for v in d.values()})[-3:])
