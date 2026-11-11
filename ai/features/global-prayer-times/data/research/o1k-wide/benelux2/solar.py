"""NOAA solar position -> prayer times. Angles in degrees, times in minutes UTC."""
import math
from datetime import date, timedelta

def _julian(d):
    y, m = d.year, d.month
    if m <= 2: y -= 1; m += 12
    A = y // 100
    B = 2 - A + A // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d.day + B - 1524.5

def _geom_mean_long(jd):
    T = (jd - 2451545.0) / 36525.0
    L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360.0
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    C = (math.sin(math.radians(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
         + math.sin(math.radians(2 * M)) * (0.019993 - 0.000101 * T)
         + math.sin(math.radians(3 * M)) * 0.000289)
    true_long = L0 + C
    omega = 125.04 - 1934.136 * T
    app_long = true_long - 0.00569 - 0.00478 * math.sin(math.radians(omega))
    mean_obliq = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60
    obliq = mean_obliq + 0.00256 * math.cos(math.radians(omega))
    decl = math.degrees(math.asin(math.sin(math.radians(obliq)) * math.sin(math.radians(app_long))))
    y = math.tan(math.radians(obliq / 2)) ** 2
    eot = 4 * math.degrees(y * math.sin(2 * math.radians(L0))
                           - 2 * e * math.sin(math.radians(M))
                           + 4 * e * y * math.sin(math.radians(M)) * math.cos(2 * math.radians(L0))
                           - 0.5 * y * y * math.sin(4 * math.radians(L0))
                           - 1.25 * e * e * math.sin(2 * math.radians(M)))
    return decl, eot

def transit_minutes(d, lon):
    """True solar noon in minutes UTC."""
    decl, eot = _geom_mean_long(_julian(d) + 0.5)
    return 720 - 4 * lon - eot

def decl_eot(d):
    return _geom_mean_long(_julian(d) + 0.5)

def time_at_angle(d, lat, lon, angle, rising):
    decl, eot = decl_eot(d)
    dl = math.radians(decl); la = math.radians(lat)
    cosH = (math.sin(math.radians(-angle)) - math.sin(la) * math.sin(dl)) / (math.cos(la) * math.cos(dl))
    if cosH > 1 or cosH < -1:
        return None
    H = math.degrees(math.acos(cosH))
    noon = 720 - 4 * lon - eot
    return noon - 4 * H if rising else noon + 4 * H

def sunrise_sunset(d, lat, lon, angle=0.833):
    return time_at_angle(d, lat, lon, angle, True), time_at_angle(d, lat, lon, angle, False)

def asr(d, lat, lon, factor=1):
    decl, eot = decl_eot(d)
    noon = 720 - 4 * lon - eot
    ang = math.degrees(math.atan(1.0 / (factor + math.tan(math.radians(abs(lat - decl))))))
    cosH = (math.sin(math.radians(ang)) - math.sin(math.radians(lat)) * math.sin(math.radians(decl))) \
           / (math.cos(math.radians(lat)) * math.cos(math.radians(decl)))
    H = math.degrees(math.acos(cosH))
    return noon + 4 * H
