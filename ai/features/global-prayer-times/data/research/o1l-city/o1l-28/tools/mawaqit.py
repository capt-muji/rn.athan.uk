#!/usr/bin/env python3
"""mawaqit.py <tag> <slug> — fetch a mawaqit mosque page, save raw, extract the full-year calendar."""
import json, re, subprocess, sys, os, pathlib

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
DIR = pathlib.Path(os.path.expanduser("~/athan-gitree/census/o1l-city/o1l-28"))

def main():
    tag, slug = sys.argv[1], sys.argv[2]
    raw = DIR / "captures" / f"mawaqit-{tag}.html"
    forms = [slug] if slug.startswith("http") else [
        f"https://mawaqit.net/en/m/{slug}", f"https://mawaqit.net/en/{slug}"]
    html, m = "", None
    for url in forms:
        subprocess.run(["curl", "-sS", "-L", "--http1.1", "--max-time", "45", "-A", UA,
                        "-o", str(raw), url], check=False)
        html = raw.read_text(errors="ignore")
        m = re.search(r"confData\s*=\s*(\{.*?\});\s*\n", html, re.S)
        if m:
            break
    if not m:
        print(f"{tag}: NO confData ({len(html)} bytes)")
        return
    d = json.loads(m.group(1))
    cal = d.get("calendar") or []
    if not cal:
        print(f"{tag}: confData without calendar")
        return
    year = 2026
    rows, iqama = {}, {}
    for mi, month in enumerate(cal, start=1):
        for day, times in month.items():
            if len(times) < 6:
                continue
            key = f"{year}-{mi:02d}-{int(day):02d}"
            rows[key] = dict(zip(("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"), times))
    iq = d.get("iqamaCalendar") or []
    for mi, month in enumerate(iq, start=1):
        for day, times in month.items():
            iqama[f"{year}-{mi:02d}-{int(day):02d}"] = times
    meta = {k: d.get(k) for k in ("name", "label", "latitude", "longitude", "timezone",
                                 "countryCode", "site", "jumua", "jumua2", "jumuaAsDuhr")}
    today = rows.get("2026-11-11")
    live = d.get("times") or []
    gate = "no-live-times"
    if live and today:
        got = [today[k][:5] for k in ("fajr", "dhuhr", "asr", "maghrib", "isha")]
        gate = "GATE-PASS" if got == [t[:5] for t in live] else f"GATE-FAIL live={live} cal={got}"
    meta["gate"] = gate
    meta["shuruq"] = d.get("shuruq")
    out = DIR / "data" / f"{tag}-mawaqit-{year}.json"
    out.write_text(json.dumps({"meta": meta, "rows": rows, "iqama": iqama}, indent=1))
    print(f"{tag}: {len(rows)} rows, {meta['name']}, lat={meta['latitude']}, tz={meta['timezone']}, "
          f"jumua={meta['jumua']}, {meta['gate']}, {rows.get('2026-11-11')}")

main()
