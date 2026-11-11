"""NOAA/Meeus solar events for Jamiat margin analysis."""
import math
from datetime import datetime, timedelta, timezone

J2000 = datetime(2000, 1, 1, 12, tzinfo=timezone.utc)


def _sun(date_local_noon, lon, tz_off):
    """Declination (deg) and equation of time (min) at local noon."""
    utc = (date_local_noon - timedelta(hours=tz_off)).replace(tzinfo=timezone.utc)
    jd = (utc - J2000).total_seconds() / 86400.0 + 2451545.0
    T = (jd - 2451545.0) / 36525.0
    L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    Mr = math.radians(M)
    C = (1.914602 - T * (0.004817 + 0.000014 * T)) * math.sin(Mr) + \
        (0.019993 - 0.000101 * T) * math.sin(2 * Mr) + 0.000289 * math.sin(3 * Mr)
    omega = 125.04 - 0.053 * T
    lam = L0 + C - 0.00569 - 0.00478 * math.sin(math.radians(omega))
    eps = 23.439291 - 0.0130042 * T + 0.00256 * math.cos(math.radians(omega))
    decl = math.degrees(math.asin(math.sin(math.radians(eps)) * math.sin(math.radians(lam))))
    y = math.tan(math.radians(eps / 2)) ** 2
    Lr = math.radians(L0)
    eot = 4 * math.degrees(
        y * math.sin(2 * Lr) - 2 * e * math.sin(Mr) + 4 * e * y * math.sin(Mr) * math.cos(2 * Lr)
        - 0.5 * y * y * math.sin(4 * Lr) - 1.25 * e * e * math.sin(2 * Mr))
    return decl, eot


def _noon(date, lon, tz_off, eot):
    return datetime(date.year, date.month, date.day, 12) - timedelta(minutes=eot) - timedelta(hours=lon / 15.0) + timedelta(hours=tz_off)


def _hour_angle(angle_deg, lat, decl):
    cosH = (math.cos(math.radians(angle_deg)) - math.sin(math.radians(lat)) * math.sin(math.radians(decl))) / \
           (math.cos(math.radians(lat)) * math.cos(math.radians(decl)))
    if not -1 <= cosH <= 1:
        return None
    return math.degrees(math.acos(cosH))


def day_events(date, lat, lon, tz_off):
    """All events as minutes-from-local-midnight, None when the sun never crosses."""
    noon0 = datetime(date.year, date.month, date.day, 12)
    decl, eot = _sun(noon0, lon, tz_off)
    noon = _noon(date, lon, tz_off, eot)
    decl2, eot2 = _sun(noon, lon, tz_off)
    noon = _noon(date, lon, tz_off, eot2)
    decl = decl2

    def at(hours_from_noon):
        return noon + timedelta(hours=hours_from_noon)

    def crossing(angle_deg, morning):
        H = _hour_angle(angle_deg, lat, decl)
        return None if H is None else noon - timedelta(minutes=4 * H) if morning else noon + timedelta(minutes=4 * H)

    def asr(shadow):
        alt = math.degrees(math.atan(1.0 / (shadow + math.tan(math.radians(abs(lat - decl))))))
        H = _hour_angle(90 - alt, lat, decl)
        return None if H is None else noon + timedelta(minutes=4 * H)

    def mins(dt):
        return None if dt is None else round((dt - datetime(date.year, date.month, date.day)).total_seconds() / 60.0, 1)

    return {
        'fajr18': mins(crossing(108.0, True)),          # 18 deg depression
        'sunrise': mins(crossing(90.833, True)),
        'transit': mins(noon),
        'asr_shafi': mins(asr(1.0)),
        'asr_hanafi': mins(asr(2.0)),
        'sunset': mins(crossing(90.833, False)),
        'isha15': mins(crossing(105.0, False)),         # 15 deg depression
    }


def printed_min(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)
