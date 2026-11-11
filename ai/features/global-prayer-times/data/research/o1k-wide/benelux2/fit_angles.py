import json, sys
sys.path.insert(0, '.')
from solar import *
from datetime import date, datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Brussels')

def m(s):
    h, mm = s.split(':'); return int(h) * 60 + int(mm)

def offset(dt):
    return int(datetime(dt.year, dt.month, dt.day, 12, tzinfo=TZ).utcoffset().total_seconds() // 60)

def rel(a, b):
    return ((a - b + 720) % 1440) - 720

def fit(rows, lat, lon, rising, lo=8.0, hi=22.0, step=0.02):
    best = None
    a = lo
    while a <= hi:
        res = []
        for dt, target in rows:
            t = time_at_angle(dt, lat, lon, a, rising)
            if t is None:
                res = None; break
            res.append(rel(target, t + offset(dt)))
        if res:
            bias = round(sum(res) / len(res) * 2) / 2
            err = [r - bias for r in res]
            rms = (sum(e * e for e in err) / len(err)) ** 0.5
            if best is None or rms < best[2]:
                best = (a, bias, rms, max(abs(e) for e in err))
        a += step
    return best

if __name__ == '__main__':
    path, lat, lon = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    d = json.load(open(path))
    out = []
    for k in sorted(d):
        y, mo, dy = map(int, k.split('-'))
        out.append((date(y, mo, dy), k, d[k]))
    inside = [r for r in out if date(2026, 5, 1) <= r[0] <= date(2026, 8, 11)]
    outside = [r for r in out if not (date(2026, 5, 1) <= r[0] <= date(2026, 8, 11))]
    print(f"{path}: {len(out)} days, outside-window {len(outside)}, inside {len(inside)}")
    for label, rows in (("OUTSIDE", outside), ("INSIDE", inside)):
        for name, rising in (("fajr", True), ("isha", False)):
            r = fit([(dt, m(v[name])) for dt, k, v in rows], lat, lon, rising)
            print(f"  {label:8} {name:5} angle={r[0]:5.2f} bias={r[1]:+5.1f} rms={r[2]:5.2f} max={r[3]:5.1f}")
