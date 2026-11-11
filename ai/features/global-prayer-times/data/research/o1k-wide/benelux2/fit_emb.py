import sys, json
sys.path.insert(0, '$HOME/athan-gitree/census/o1k-wide/benelux2')
from solar import *
from datetime import date, datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Brussels')
CITIES = {"bruxelles": (50.8503, 4.3517), "gent": (51.0541, 3.7174), "liege": (50.6326, 5.5797)}

def m(s):
    h, mm = s.split(':'); return int(h) * 60 + int(mm)

def offset(dt):
    return int(datetime(dt.year, dt.month, dt.day, 12, tzinfo=TZ).utcoffset().total_seconds() // 60)

def local(x, dt):
    return (x + offset(dt)) % 1440 if x is not None else None

def load(path, city, delta=0):
    d = json.load(open(path))
    return {k: {c: (m(v[c]) + (delta if c != 'sunrise' or True else 0)) % 1440 for c in v} for k, v in d.items()}

def deltas(path, lat, lon):
    """Printed minus model, in minutes, per prayer."""
    d = json.load(open(path))
    res = {}
    for k, v in sorted(d.items()):
        y, mo, dy = map(int, k.split('-')); dt = date(y, mo, dy)
        sr, ss = sunrise_sunset(dt, lat, lon)
        tr = transit_minutes(dt, lon)
        row = {'sunrise': m(v['sunrise']) - local(sr, dt),
               'dhuhr': m(v['dhuhr']) - local(tr, dt),
               'asr': m(v['asr']) - local(asr(dt, lat, lon), dt),
               'magrib': m(v['magrib']) - local(ss, dt)}
        f50 = time_at_angle(dt, lat, lon, 18, True)
        i50 = time_at_angle(dt, lat, lon, 18, False)
        f45 = time_at_angle(dt, 45.0, lon, 18, True)
        i45 = time_at_angle(dt, 45.0, lon, 18, False)
        for tag, val, mod in (('fajr50', v['fajr'], f50), ('isha50', v['isha'], i50),
                              ('fajr45', v['fajr'], f45), ('isha45', v['isha'], i45)):
            row[tag] = None if mod is None else ((m(val) - local(mod, dt) + 720) % 1440) - 720
        res[k] = row
    return res

if __name__ == '__main__':
    path, lat, lon = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    r = deltas(path, lat, lon)
    for k in sorted(r):
        row = r[k]
        fmt = lambda x: '  .  ' if x is None else f'{x:+6.1f}'
        print(k, ' '.join(f'{c}={fmt(row[c])}' for c in row))
