#!/usr/bin/env python3
"""Capture masjidi.app tenant screens and their regional athan tables.

Selects up to 3 tenants per country from the public directory, reads each screen page
for its prayer_times_region_json_<n>.json reference, and banks that table.
"""
import json, re, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PER_COUNTRY = int(sys.argv[1]) if len(sys.argv) > 1 else 3


def get(u, timeout=30):
    req = urllib.request.Request(u, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf8", "replace")


def main():
    d = json.load(open(os.path.join(ROOT, "probe/masjidi_directory.json"), encoding="utf8"))
    by_country = {}
    for t in d:
        by_country.setdefault(t["country"], []).append(t)
    picked = []
    for c, ts in by_country.items():
        picked.extend(ts[:PER_COUNTRY])

    def one(t):
        tid = t["id"]
        page = os.path.join(ROOT, "captures", f"masjidi_{tid}.html")
        try:
            h = open(page, encoding="utf8").read() if os.path.exists(page) else get(f"https://tv.masjidi.app/{tid}")
            if not os.path.exists(page):
                open(page, "w", encoding="utf8").write(h)
        except Exception as e:
            return {"id": tid, "err": str(e)}
        ref = re.search(r"prayer_times_region_json_(\d+)\.json", h)
        rec = {"id": tid, "country": t["country"], "city": t["city"], "name": t["name"], "region": None}
        if not ref:
            return rec
        n = ref.group(1)
        rec["region"] = int(n)
        f = os.path.join(ROOT, "captures", f"masjidi_region_{n}.json")
        if not os.path.exists(f):
            try:
                open(f, "w", encoding="utf8").write(get(f"https://tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_{n}.json"))
            except Exception as e:
                rec["err"] = str(e)
        return rec

    with ThreadPoolExecutor(max_workers=6) as ex:
        out = list(ex.map(one, picked))
    json.dump(out, open(os.path.join(ROOT, "probe/masjidi_captured.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    ok = [o for o in out if o.get("region")]
    print(f"{len(picked)} tenants picked, {len(ok)} with a region table, "
          f"{len({o['region'] for o in ok})} distinct tables")


if __name__ == "__main__":
    main()
