"""Find the exact generation rule of a hsalah edition: which (solar event, margin, rounding)
reproduces all 365 printed minutes of a column.

Longitude is anchored on the printed Zawal (its residual is 0.00, so the edition's own noon is
recoverable exactly); latitude is the one free parameter and is chosen to maximise the number of
days reproduced exactly in the sunrise and asr columns.
"""
import math, sys
from datetime import date
sys.path.insert(0, "$HOME/athan-gitree/census/o1k-wide/benelux2")
import solar
from parse_pt import parse
from analyze_pt import mins, dst_shift

RULES = {
    "floor": math.floor,
    "round": lambda x: math.floor(x + 0.5),
    "ceil": math.ceil,
}


def anchored(rows):
    out = []
    for k in sorted(rows):
        d = date.fromisoformat(k)
        v = rows[k]
        dst = dst_shift(d)
        lon_eff = (720 - solar.decl_eot(d)[1] - (mins(v["zawal"]) - dst)) / 4.0
        out.append((d, v, dst, lon_eff))
    return out


def hit(printed, solar_min, margin, rule):
    return RULES[rule](solar_min + margin) == printed


def score_lat(anch, lat):
    best = 0
    for col, event in (("sunrise", "sr"), ("asr", "asr")):
        for margin in range(-3, 4):
            for rule in RULES:
                n = 0
                for d, v, dst, lon_eff in anch:
                    t = solar.sunrise_sunset(d, lat, lon_eff)[0] if event == "sr" else solar.asr(d, lat, lon_eff)
                    if t is None:
                        continue
                    if hit(mins(v[col]), t + dst, margin, rule):
                        n += 1
                best = max(best, n)
    return best


def best_rule(anch, lat, col, angle=None, rising=True):
    results = []
    for margin in range(-8, 10):
        for rule in RULES:
            n = 0
            for d, v, dst, lon_eff in anch:
                if angle is None:
                    if col == "sunrise":
                        t = solar.sunrise_sunset(d, lat, lon_eff)[0]
                    elif col == "magrib":
                        t = solar.sunrise_sunset(d, lat, lon_eff)[1]
                    elif col == "dhuhr":
                        t = solar.transit_minutes(d, lon_eff)
                    elif col == "asr":
                        t = solar.asr(d, lat, lon_eff)
                else:
                    t = solar.time_at_angle(d, lat, lon_eff, angle, rising)
                if t is None:
                    continue
                if hit(mins(v[col]), t + dst, margin, rule):
                    n += 1
            results.append((n, margin, rule))
    results.sort(reverse=True)
    return results[:3]


def best_angle(anch, lat, col, rising, angles):
    out = []
    for a in angles:
        for margin in range(-4, 5):
            for rule in RULES:
                n = 0
                for d, v, dst, lon_eff in anch:
                    t = solar.time_at_angle(d, lat, lon_eff, a, rising)
                    if t is None:
                        continue
                    if hit(mins(v[col]), t + dst, margin, rule):
                        n += 1
                out.append((n, a, margin, rule))
    out.sort(reverse=True)
    return out[:3]


def run(name, path):
    rows = parse(path)
    anch = anchored(rows)
    best_lat, best_n = None, -1
    lat = 36.0
    while lat <= 43.0:
        n = score_lat(anch, lat)
        if n > best_n:
            best_lat, best_n = lat, n
        lat += 0.02
    print(f"\n== {name}: rows={len(rows)} lat={best_lat:.2f} (sunrise/asr exact {best_n}/730)")
    for col in ("sunrise", "magrib", "dhuhr", "asr"):
        print(f"   {col:8s}", best_rule(anch, best_lat, col))
    print("   fajr   ", best_angle(anch, best_lat, "fajr", True, [15 + 0.5 * i for i in range(9)]))
    print("   isha   ", best_angle(anch, best_lat, "isha", False, [11 + 1.0 * i for i in range(6)]))
    if "isha_alt" in next(iter(rows.values())):
        d_, v_, dst_, lon_ = anch[0]
        print("   isha_alt = magrib +", mins(v_["isha_alt"]) - mins(v_["magrib"]))
    return best_lat


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        name, path = arg.split("=", 1)
        run(name, path)
