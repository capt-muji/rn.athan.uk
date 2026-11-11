"""Solar position engine (NOAA/Meeus low-precision), used to measure the implied
twilight depression angle of a printed timetable. Validated against adhan 4.4.6
by validate_vs_adhan.mjs before any measurement is trusted."""
import math
from datetime import date, datetime, timedelta

RAD = math.pi / 180.0


def _julian_day(d, hour_utc=0.0):
    y, m = d.year, d.month
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return (math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1))
            + d.day + b - 1524.5) + hour_utc / 24.0


def _sun(jd):
    """Return (declination deg, equation of time minutes)."""
    t = (jd - 2451545.0) / 36525.0
    l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360
    m = 357.52911 + t * (35999.05029 - 0.0001537 * t)
    e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
    c = (math.sin(m * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t))
         + math.sin(2 * m * RAD) * (0.019993 - 0.000101 * t)
         + math.sin(3 * m * RAD) * 0.000289)
    true_long = l0 + c
    omega = 125.04 - 1934.136 * t
    app_long = true_long - 0.00569 - 0.00478 * math.sin(omega * RAD)
    mean_obliq = 23 + (26 + ((21.448 - t * (46.815 + t * (0.00059 - t * 0.001813)))) / 60) / 60
    obliq = mean_obliq + 0.00256 * math.cos(omega * RAD)
    decl = math.asin(math.sin(obliq * RAD) * math.sin(app_long * RAD)) / RAD
    y = math.tan(obliq * RAD / 2) ** 2
    eot = 4 * (y * math.sin(2 * l0 * RAD) - 2 * e * math.sin(m * RAD)
               + 4 * e * y * math.sin(m * RAD) * math.cos(2 * l0 * RAD)
               - 0.5 * y * y * math.sin(4 * l0 * RAD)
               - 1.25 * e * e * math.sin(2 * m * RAD)) / RAD
    return decl, eot


def solar_noon_utc(d, lon):
    """Minutes after 00:00 UTC of solar transit."""
    jd = _julian_day(d)
    _, eot = _sun(jd)
    return 720.0 - 4.0 * lon - eot


def altitude(d, lon, lat, minutes_utc):
    jd = _julian_day(d) + minutes_utc / 1440.0
    decl, eot = _sun(jd)
    tst = (minutes_utc + eot + 4.0 * lon) % 1440
    ha = (tst / 4.0 - 180.0)
    sin_alt = (math.sin(lat * RAD) * math.sin(decl * RAD)
               + math.cos(lat * RAD) * math.cos(decl * RAD) * math.cos(ha * RAD))
    return math.asin(max(-1.0, min(1.0, sin_alt))) / RAD


def transit_and_altitude(d, lon, lat, clock_minutes, tz_offset_minutes):
    """clock_minutes are local wall-clock minutes; tz_offset is minutes east of UTC."""
    return altitude(d, lon, lat, clock_minutes - tz_offset_minutes)


def hhmm(s):
    h, m = s.split(":")
    return int(h) * 60 + int(m)
