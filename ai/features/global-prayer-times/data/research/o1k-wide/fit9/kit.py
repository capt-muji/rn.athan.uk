"""Shared helpers for the fit9 jobs. Solar engine: benelux2's solar.py (NOAA, minutes UTC).

Rounding discipline: compute at float (sub-second) resolution, round once, explicitly,
with round-half-up to the printed minute (rmin). Scores (exact/within-1/worst) are
integer minute differences printed - rounded(computed); parameter diagnostics (bias/RMS
on floats) are reported separately where they matter.
"""
import json, math
from datetime import date, datetime
from zoneinfo import ZoneInfo
import solar


def mins(s):
    s = s.strip()
    if "." in s and ":" not in s:
        s = s.replace(".", ":")
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def rmin(x):
    return math.floor(x + 0.5)


def floor_min(x):
    return math.floor(x)


def tzoff(dt, tzname):
    return int(datetime(dt.year, dt.month, dt.day, 12,
                        tzinfo=ZoneInfo(tzname)).utcoffset().total_seconds() // 60)


def local(t_utc, dt, tzname):
    return None if t_utc is None else (t_utc + tzoff(dt, tzname)) % 1440


def rel(a, b):
    return ((a - b + 720) % 1440) - 720


def load_dated(path):
    d = json.load(open(path))
    return {date(*map(int, k.split("-"))): v for k, v in d.items()}


def load_dated_list(path, cols):
    """Granada-style: {'YYYY-MM-DD': [t0..t5]} -> {date: {col: 'HH:MM'}}."""
    d = json.load(open(path))
    return {date(*map(int, k.split("-"))): dict(zip(cols, v)) for k, v in d.items()}


def score(rows, lat, lon, tzname, col, compute, rounder=rmin):
    """rows: {date: {col: 'HH:MM'}}. compute(dt) -> float local minutes or None.

    Returns dict with n, exact, within1, worst, rms (int diffs), bias (float mean of
    printed - computed), float_max.
    """
    ints, floats = [], []
    for dt in sorted(rows):
        c = compute(dt)
        if c is None:
            continue
        p = mins(rows[dt][col])
        ints.append(rel(p, rounder(c) % 1440))
        floats.append(rel(p, c))
    n = len(ints)
    return {
        "n": n,
        "exact": sum(1 for x in ints if x == 0),
        "within1": sum(1 for x in ints if abs(x) <= 1),
        "worst": max((abs(x) for x in ints), default=None),
        "rms": round((sum(x * x for x in ints) / n) ** 0.5, 2) if n else None,
        "bias": round(sum(floats) / n, 2) if n else None,
        "float_min": round(min(floats), 2) if n else None,
        "float_max": round(max(floats), 2) if n else None,
    }


def score_hist(rows, lat, lon, tzname, col, compute, rounder=rmin):
    """Per-integer-diff histogram plus the score dict."""
    s = score(rows, lat, lon, tzname, col, compute, rounder)
    hist = {}
    for dt in sorted(rows):
        c = compute(dt)
        if c is None:
            continue
        d = rel(mins(rows[dt][col]), rounder(c) % 1440)
        hist[d] = hist.get(d, 0) + 1
    s["hist"] = {str(k): v for k, v in sorted(hist.items())}
    return s


def fit_angle(rows, lat, lon, tzname, col, rising, lo, hi, step=0.02):
    """Free-angle grid fit on unrounded residuals. Returns (angle, rms, bias)."""
    pts = []
    for dt in sorted(rows):
        pts.append((dt, mins(rows[dt][col])))
    best = None
    a = lo
    while a <= hi + 1e-9:
        res = []
        for dt, p in pts:
            t = solar.time_at_angle(dt, lat, lon, a, rising)
            if t is None:
                res = None
                break
            res.append(rel(p, local(t, dt, tzname)))
        if res:
            mu = sum(res) / len(res)
            rms = (sum((x - mu) ** 2 for x in res) / len(res)) ** 0.5
            if best is None or rms < best[1]:
                best = (a, rms, mu)
        a += step
    return best


def season_amplitude(rows, lat, lon, tzname, col, rising, angle):
    """Jan-15 vs solstice-window computed value and the year's computed span (minutes)."""
    vals = {}
    for dt in sorted(rows):
        t = solar.time_at_angle(dt, lat, lon, angle, rising)
        if t is not None:
            vals[dt] = local(t, dt, tzname)
    jan15 = vals.get(date(vals and min(vals).year, 1, 15))
    jul = [v for d, v in vals.items() if d.month == 7]
    span = max(vals.values()) - min(vals.values())
    return {"jan15": jan15, "jul_min": min(jul) if jul else None,
            "jul_max": max(jul) if jul else None,
            "year_min": min(vals.values()), "year_max": max(vals.values()),
            "amplitude": round(span, 1)}
