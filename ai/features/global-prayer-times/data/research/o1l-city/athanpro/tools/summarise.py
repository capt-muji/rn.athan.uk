#!/usr/bin/env python3
"""Merge the fit shards and summarise the athanpro city universe."""
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())


def main():
    universe = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "universe.tsv"))]
    index = json.load(open(os.path.join(DATA, "index.json")))
    fits = []
    for f in sorted(os.listdir(DATA)):
        if re.fullmatch(r"fits-\d+\.json", f):
            fits.extend(json.load(open(os.path.join(DATA, f))))
    # The second stage re-fits every page that fell short of 99pc, adding the platform's own
    # per-prayer minute adjustments. Where a record exists there, it wins. The third stage
    # re-tests the high-latitude rule on the pages whose twilight adjustment stayed large.
    second = {}
    for f in sorted(os.listdir(DATA)):
        if re.fullmatch(r"fits2-\d+\.json", f):
            for r in json.load(open(os.path.join(DATA, f))):
                second[(r["cc"], r["city"])] = r
    if second:
        fits = [second.get((r["cc"], r["city"]), r) for r in fits]
        print(f"second stage applied to {len(second)} records")
    third = {}
    for f in sorted(os.listdir(DATA)):
        if re.fullmatch(r"fits3-\d+\.json", f):
            for r in json.load(open(os.path.join(DATA, f))):
                third[(r["cc"], r["city"])] = r
    if third:
        fits = [third.get((r["cc"], r["city"]), r) for r in fits]
        print(f"third stage applied to {len(third)} records")
    capitals = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "capitals.tsv"))]
    cap_by_country = {}
    for _, country, capital in capitals:
        cap_by_country.setdefault(norm(country), set()).add(norm(capital))

    by_country = Counter(u[1] for u in universe)
    rows_total = sum(r["rows"] for r in fits)
    lines = []
    for r in fits:
        is_cap = norm(r["name"]) in cap_by_country.get(norm(r["country"]), set())
        r["capital"] = is_cap
    json.dump(fits, open(os.path.join(DATA, "fits.json"), "w"), indent=1)

    # summary buckets
    gate_fail = [r for r in fits if r.get("solar") is not None and r["solar"] > 3]
    errs = [r for r in fits if r.get("err")]
    ok = [r for r in fits if r.get("pct") is not None]
    pass100 = [r for r in ok if r["pct"] == 100.0]
    pass99 = [r for r in ok if r["pct"] >= 99.0]
    pass90 = [r for r in ok if r["pct"] >= 90.0]
    methods = Counter(r.get("method") for r in fits)
    recipes = Counter(re.sub(r"\s*(Hanafi|Shafi)$", "", r.get("recipe") or r.get("err") or "?")
                      for r in fits)

    # live-page gate: the Today block against the table row it names
    today_bad = []
    for rec in index:
        t = rec.get("today") or {}
        rows = json.load(open(os.path.join(DATA, f"{rec['country_slug']}-{rec['city_slug']}.json")))
        day = f"{rec['year']}-{ {'September':9,'October':10,'August':8}.get(rec['month'],0):02d}-{int(t.get('day',0)):02d}"
        row = rows.get(day)
        if not row or not t:
            continue
        bad = [c for c in ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
               if t.get(c) and row.get(c) and t[c] != row[c]]
        if bad:
            today_bad.append((rec["country_slug"], rec["city_slug"], day, bad))

    # The country record carries a fixed offset label; the city record carries an IANA zone.
    # Where they disagree, and where the zone sits far from the city's own longitude, the page
    # is rendering a clock the city does not keep.
    label_bad = []
    zone_far = []
    from datetime import datetime, timezone
    from zoneinfo import ZoneInfo
    for rec in index:
        if not rec.get("tz"):
            continue
        try:
            off = datetime(2026, 9, 15, 12, tzinfo=timezone.utc).astimezone(
                ZoneInfo(rec["tz"])).utcoffset()
        except Exception:
            continue
        real = int(off.total_seconds() // 60)
        lab = rec.get("country_tz_label") or ""
        m = re.fullmatch(r"([+-])(\d{2}):(\d{2})", lab)
        if m:
            labm = (1 if m.group(1) == "+" else -1) * (int(m.group(2)) * 60 + int(m.group(3)))
            if labm != real:
                label_bad.append((rec["country_slug"], rec["city_slug"], lab, real))
        lon = rec.get("table_lon") or rec.get("lon")
        if lon is not None:
            natural = round(float(lon) / 15 * 60)
            delta = real - natural
            # A zone near the date line sits ~24h from its longitude and is legitimate.
            if abs(delta) > 180 and abs(abs(delta) - 1440) > 180:
                zone_far.append((rec["country_slug"], rec["city_slug"], rec["tz"], real, natural))

    out = dict(
        cities=len(universe), countries=len(by_country), tables=len(fits), rows=rows_total,
        gate_fail=len(gate_fail), errs=len(errs),
        pct100=len(pass100), pct99=len(pass99), pct90=len(pass90),
        methods=methods.most_common(), recipes=recipes.most_common(12),
        capitals=sum(1 for r in fits if r["capital"]),
        today_bad=len(today_bad),
        label_bad=len(label_bad),
        zone_far=len(zone_far),
    )
    json.dump(dict(summary=out, today_bad=today_bad[:200],
                   label_bad=label_bad,
                   zone_far=zone_far,
                   gate_fail=[[r["cc"], r["city"], r["name"], r["solar"]] for r in gate_fail],
                   errors=[[r["cc"], r["city"], r.get("err")] for r in errs]),
              open(os.path.join(DATA, "summary.json"), "w"), indent=1)
    print(json.dumps(out, indent=1, default=str))


if __name__ == "__main__":
    main()
