"""Compare fit9/solar.py against adhan 4.4.6 output (adhan_times.json), seconds.

Skip None events (18-degree fajr does not exist at Amsterdam in July; adhan substitutes
its high-latitude rule there, which is not the raw-angle engine under test).
"""
import json, os
import solar

a = json.load(open(os.path.expanduser("~/athan-gitree/census/o1k-wide/fit9/adhan_times.json")))
lat, lon = 52.3702, 4.8952
worst = 0.0
for iso, t in sorted(a.items()):
    y, m, d = map(int, iso.split("-"))
    dt = solar.date(y, m, d)
    decl, eot = solar.decl_eot(dt)
    f18 = solar.time_at_angle(dt, lat, lon, 18, True)
    i17 = solar.time_at_angle(dt, lat, lon, 17, False)
    sr, ss = solar.sunrise_sunset(dt, lat, lon)
    pairs = [("sunrise", sr, t["sunrise"]), ("dhuhr", 720 - 4 * lon - eot, t["dhuhr"]),
             ("maghrib", ss, t["maghrib"])]
    if f18 is not None and t["fajr18"] is not None:
        pairs.append(("fajr18", f18, t["fajr18"]))
    if i17 is not None and t["isha17"] is not None:
        pairs.append(("isha17", i17, t["isha17"]))
    for name, mine, theirs in pairs:
        dsec = abs(mine - theirs) * 60
        worst = max(worst, dsec)
        print(f"{iso} {name:8s} solar.py {mine:12.4f}  adhan {theirs:12.4f}  d {dsec:6.2f}s")
print(f"WORST {worst:.2f}s")
