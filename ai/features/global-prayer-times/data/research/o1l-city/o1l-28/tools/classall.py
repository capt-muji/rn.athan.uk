#!/usr/bin/env python3
"""classall.py <glob> — classify every surface file against its own coordinates."""
import json, sys, glob, datetime, os, pathlib, math

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from classify import solar_altitude, stat, tz

DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/o1l-28"))


def classify(path):
    payload = json.loads(pathlib.Path(path).read_text())
    rows, meta = payload["rows"], payload.get("meta", {})
    lat, lng = float(meta["lat"]), float(meta["lon"])
    months = {}
    for date, r in sorted(rows.items()):
        if not r.get("fajr") or not r.get("isha") or r["fajr"] in ("00:00", "0:00"):
            continue
        d = datetime.date.fromisoformat(date)

        def alt(hhmm):
            h, m = map(int, hhmm.split(":")[:2])
            local = datetime.datetime(d.year, d.month, d.day, h % 24, m, tzinfo=tz)
            return solar_altitude(local.astimezone(datetime.timezone.utc), lat, lng)

        months.setdefault(date[:7], []).append((-alt(r["fajr"]), -alt(r["isha"])))
    core = [x for m in ("2025-11", "2025-12", "2026-01", "2026-02", "2026-11", "2026-12", "2027-01", "2027-02")
            for x in months.get(m, [])]
    if not core:
        return None
    f = stat([x[0] for x in core])
    i = stat([x[1] for x in core])
    jul = [x[0] for m in ("2026-07", "2027-07") for x in months.get(m, [])]
    jan = [x[0] for m in ("2026-01", "2027-01") for x in months.get(m, [])]
    return {"tag": pathlib.Path(path).stem, "name": meta.get("name"), "days": len(rows),
            "core": len(core), "fajr": f, "isha": i,
            "jan": stat(jan)["mean"] if jan else None,
            "jul": stat(jul)["mean"] if jul else None}


def main():
    for path in sorted(glob.glob(sys.argv[1])):
        r = classify(path)
        if not r:
            print(f"{pathlib.Path(path).stem}: no core days")
            continue
        print(f"{r['tag'][:34]:34} {r['days']:4}d core{r['core']:4} | "
              f"fajr {r['fajr']['mean']:5.2f} sd{r['fajr']['sd']:4.2f} | "
              f"isha {r['isha']['mean']:5.2f} sd{r['isha']['sd']:4.2f} | "
              f"Jan {r['jan'] if r['jan'] else 0:5.1f} Jul {r['jul'] if r['jul'] else 0:5.1f}")


main()
