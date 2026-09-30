"""R3 oracle cross-check: is the astronomy oracle itself trustworthy?

`astronomy.mjs` measures each prayer library's solar engine against
`astronomy-engine`. That is only worth anything if `astronomy-engine` is itself
right. This script answers that by computing the same two quantities from
Skyfield driven by the JPL DE440 ephemeris, which is the reference the USNO and
HM Nautical Almanac Office themselves publish against, and reporting the
disagreement between the two oracles in arcseconds.

If the two oracles agree to well inside the libraries' errors, the oracle is
adequate and the library numbers stand.

Run:  ../../../../../../athan-global-scratch/venv/bin/python oracle_crosscheck.py
(any Python with `skyfield` installed works; DE440s is downloaded on first run)
"""

import json
import sys

from skyfield.api import load
from skyfield.framelib import true_equator_and_equinox_of_date

ts = load.timescale()
eph = load("de440s.bsp")
earth, sun = eph["earth"], eph["sun"]


def skyfield_sun(year, month, day, hour=0.0):
    """Geocentric apparent declination (deg) and equation of time (minutes).

    `observe().apparent()` applies light-time and aberration, and the
    true-equator-and-equinox-of-date frame applies precession and nutation, so
    this is the same quantity the prayer libraries call "declination".
    """
    t = ts.utc(year, month, day, hour)
    astrometric = earth.at(t).observe(sun).apparent()
    ra, dec, _ = astrometric.radec(epoch="date")

    # Equation of time = apparent solar time minus mean solar time. Greenwich
    # apparent sidereal time minus the sun's apparent right ascension gives the
    # sun's hour angle; apparent solar time is that plus 12 hours.
    gast = t.gast  # hours
    hour_angle = gast - ra.hours
    eot = hour_angle + 12.0 - (t.utc.hour + t.utc.minute / 60 + t.utc.second / 3600)
    while eot > 12:
        eot -= 24
    while eot < -12:
        eot += 24
    return dec.degrees, eot * 60.0


def main():
    # The daily grid `astronomy.mjs` uses, for the same three years.
    rows = []
    for year in (1950, 2026, 2100):
        for month, day in [(1, 15), (3, 20), (4, 11), (6, 21), (9, 22), (12, 21)]:
            dec, eot = skyfield_sun(year, month, day)
            rows.append(
                {"year": year, "month": month, "day": day, "dec": dec, "eot": eot}
            )

    # Full daily series for 2026, so the JS side can diff every day.
    daily = []
    import datetime

    d = datetime.date(2026, 1, 1)
    while d.year == 2026:
        dec, eot = skyfield_sun(d.year, d.month, d.day)
        daily.append({"date": d.isoformat(), "dec": dec, "eot": eot})
        d += datetime.timedelta(days=1)

    out = {
        "ephemeris": "de440s.bsp",
        "skyfield": __import__("skyfield").__version__,
        "spot": rows,
        "daily_2026": daily,
    }
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
