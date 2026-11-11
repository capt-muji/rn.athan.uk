"""Solar engine for prayer-time fitting (NOAA solar position equations).
Times are minutes after local midnight; angles are sun-centre altitudes."""

import math

R = math.pi / 180.0


def _day_of_year(y, m, d):
    import datetime
    return datetime.date(y, m, d).timetuple().tm_yday


def _gamma(y, m, d, frac):
    return 2 * math.pi / 365.0 * (_day_of_year(y, m, d) - 1 + (frac * 24 - 12) / 24.0)


def eqtime(y, m, d, frac=0.5):
    g = _gamma(y, m, d, frac)
    return 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g)
                     - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))


def declination(y, m, d, frac=0.5):
    g = _gamma(y, m, d, frac)
    return (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g)
            - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g)) / R


def noon(y, m, d, lon, tz):
    return 720 - 4.0 * lon - eqtime(y, m, d) + tz * 60


def altitude_time(y, m, d, lat, lon, tz, alt_deg, morning):
    t = 0.25 if morning else 0.75
    val = None
    for _ in range(4):
        dec = declination(y, m, d, t) * R
        cosH = (math.sin(alt_deg * R) - math.sin(lat * R) * math.sin(dec)) / (
            math.cos(lat * R) * math.cos(dec))
        if cosH > 1 or cosH < -1:
            return None
        H = math.acos(cosH) / R * 4.0
        tn = noon(y, m, d, lon, tz)
        val = tn - H if morning else tn + H
        t = val / 1440.0
    return val


def asr_time(y, m, d, lat, lon, tz, shadow):
    t = 0.6
    val = None
    for _ in range(4):
        dec = declination(y, m, d, t) * R
        alt = math.atan(1.0 / (shadow + math.tan(abs(lat * R - dec)))) / R
        cosH = (math.sin(alt * R) - math.sin(lat * R) * math.sin(dec)) / (
            math.cos(lat * R) * math.cos(dec))
        H = math.acos(max(-1, min(1, cosH))) / R * 4.0
        val = noon(y, m, d, lon, tz) + H
        t = val / 1440.0
    return val


def invert_altitude(y, m, d, lat, lon, tz, minute, morning):
    dec = declination(y, m, d, minute / 1440.0) * R
    H = abs(minute - noon(y, m, d, lon, tz)) / 4.0 * R
    s = math.sin(lat * R) * math.sin(dec) + math.cos(lat * R) * math.cos(dec) * math.cos(H)
    return math.asin(max(-1, min(1, s))) / R


def invert_asr(y, m, d, lat, lon, tz, minute):
    dec = declination(y, m, d, minute / 1440.0) * R
    H = (minute - noon(y, m, d, lon, tz)) / 4.0 * R
    alt = math.asin(max(-1, min(1, math.sin(lat * R) * math.sin(dec)
                             + math.cos(lat * R) * math.cos(dec) * math.cos(H))))
    return math.cos(alt) / math.sin(alt) - math.tan(abs(lat * R - dec))


def minutes(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)
