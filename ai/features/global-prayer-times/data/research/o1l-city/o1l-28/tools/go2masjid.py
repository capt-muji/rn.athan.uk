#!/usr/bin/env python3
"""go2masjid.py <city> — pull every masjid in a city and its 365-day salat window."""
import json, sys, subprocess, os, pathlib, urllib.parse

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/o1l-28"))
API = "https://go2masjid.com/api/papi"


def get(url, out):
    subprocess.run(["curl", "-sS", "-L", "--max-time", "60", "-A", UA, "-o", str(out), url], check=False)
    try:
        return json.loads(out.read_text())
    except Exception:
        return None


def rows_of(salats):
    out = {}
    for s in salats:
        out[s["salatdate"]] = {
            "fajr": s["fajarstart"], "sunrise": s["sunrise"], "dhuhr": s["zuhrstart"],
            "asr": s["asarstart"], "maghrib": s["maghrib"], "isha": s["eshastart"]}
    return out


def main():
    city = sys.argv[1]
    only = set(sys.argv[2:])
    tag = city.lower().replace(" ", "_").replace("/", "_")
    raw = DIR / "captures" / f"go2masjid-{tag}.json"
    data = get(f"{API}/loc_getcity.php?name={urllib.parse.quote(city)}", raw)
    if not data:
        print(f"{city}: no payload")
        return
    for m in data:
        mid, lat, lon = m["masjidid"], m["lat"], m["lon"]
        if only and mid not in only:
            continue
        year = DIR / "captures" / f"go2masjid-{tag}-{mid}-365.json"
        payload = get(f"{API}/loc_getfavmasjid.php?lat={lat}&lon={lon}&dist=1&mlim=1&slim=365&mid={mid}", year)
        if not payload:
            print(f"{city} {mid} {m['masjidname'][:34]}: window fetch failed")
            continue
        rec = payload[0]
        rows = rows_of(rec.get("salats", []))
        out = DIR / "data" / f"{tag}-{mid}-go2masjid.json"
        out.write_text(json.dumps({"meta": {
            "name": rec["masjidname"], "id": mid, "lat": lat, "lon": lon,
            "address": rec.get("address"), "postcode": rec.get("postcode"),
            "city": rec.get("city"), "table": rec.get("masjidtable"),
            "live_page": f"https://go2masjid.com/wordpress/timetable.html?mid={rec.get('masjidtable')}"},
            "rows": rows}, indent=1))
        print(f"{city} {mid} {rec['masjidname'][:34]:34} {len(rows)} rows "
              f"{min(rows)}..{max(rows)} tz={rec.get('ioffset')}")


main()
