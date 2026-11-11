#!/usr/bin/env python3
"""go2scan.py <city> — one request per city, 14-day window, implied depression per masjid."""
import json, sys, subprocess, os, pathlib, urllib.parse, datetime

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from classify import solar_altitude, stat, tz

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/o1l-28"))


def main():
    for city in sys.argv[1:]:
        tag = city.lower().replace(" ", "_")
        raw = DIR / "captures" / f"go2scan-{tag}.json"
        url = f"https://go2masjid.com/api/papi/loc_getcity.php?name={urllib.parse.quote(city)}"
        subprocess.run(["curl", "-sS", "-L", "--max-time", "40", "-A", UA, "-o", str(raw), url], check=False)
        try:
            data = json.loads(raw.read_text())
        except Exception:
            print(f"{city}: no payload")
            continue
        for m in data:
            faj, ish, lat, lon = [], [], float(m["lat"]), float(m["lon"])
            for s in m.get("salats", []):
                if s["fajarstart"] in ("00:00", ""):
                    continue
                d = datetime.date.fromisoformat(s["salatdate"])

                def alt(hhmm):
                    h, mm = map(int, hhmm.split(":")[:2])
                    local = datetime.datetime(d.year, d.month, d.day, h, mm, tzinfo=tz)
                    return solar_altitude(local.astimezone(datetime.timezone.utc), lat, lon)
                faj.append(-alt(s["fajarstart"]))
                ish.append(-alt(s["eshastart"]))
            if not faj:
                print(f"{city:14} {m['masjidid']:>4} {m['masjidname'][:32]:32} DEAD")
                continue
            f, i = stat(faj), stat(ish)
            print(f"{city:14} {m['masjidid']:>4} {m['masjidname'][:32]:32} n{len(faj):3} "
                  f"fajr {f['mean']:5.2f} sd{f['sd']:4.2f} isha {i['mean']:5.2f} sd{i['sd']:4.2f}")


main()
