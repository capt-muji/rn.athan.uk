#!/usr/bin/env python3
"""Probe mosque domains for machine-readable prayer-time surfaces."""
import json, os, re, sys, hashlib, urllib.request, urllib.error

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captures")
PATHS = ["/", "/prayer-times", "/prayer-times/", "/prayer-time", "/prayer-timetable",
         "/prayer-timetable/", "/timetable", "/timetable/", "/salah-times", "/salah-timetable",
         "/monthly", "/prayer-times/timetable", "/prayer"]
DPT = ["/?rest_route=/dpt/v1/prayertime&filter=year",
       "/?rest_route=/dpt/v1/prayertime&filter=today"]


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read(), r.headers.get("Content-Type", "")


def save(tag, host, path, body):
    name = re.sub(r"[^a-z0-9]+", "-", (host + path).lower()).strip("-")[:110]
    name = f"{tag}-{name}"
    p = os.path.join(OUT, name + ".bin")
    with open(p, "wb") as f:
        f.write(body)
    return os.path.basename(p)


def score(text):
    times = len(re.findall(r"\b\d{1,2}[:.]\d{2}\b", text))
    months = len(re.findall(r"(?i)\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", text))
    return times, months


def probe(tag, host):
    base = host if host.startswith("http") else "https://" + host
    hostname = re.sub(r"^https?://", "", base).split("/")[0]
    report = {"tag": tag, "host": hostname, "hits": []}
    for path in DPT:
        url = base.rstrip("/") + path
        try:
            st, body, ct = get(url)
        except Exception as e:
            report["hits"].append({"url": url, "err": str(e)[:80]})
            continue
        txt = body.decode("utf-8", "replace")
        rec = {"url": url, "status": st, "bytes": len(body), "ctype": ct}
        if "json" in ct or txt.lstrip()[:1] in "[{":
            try:
                j = json.loads(txt)
                rec["json_keys"] = list(j)[:5] if isinstance(j, dict) else f"list[{len(j)}]"
                rec["nonzero"] = bool(re.search(r"\"?[01]?\d:[0-5]\d", txt)) and "00:00:00" not in txt[:400]
                rec["dpt"] = True
                rec["file"] = save(tag, hostname, path, body)
            except Exception:
                rec["dpt"] = False
        report["hits"].append(rec)
    for path in PATHS:
        url = base.rstrip("/") + path
        try:
            st, body, ct = get(url)
        except Exception as e:
            report["hits"].append({"url": url, "err": str(e)[:60]})
            continue
        txt = body.decode("utf-8", "replace")
        t, m = score(txt)
        rec = {"url": url, "status": st, "times": t, "monthwords": m, "bytes": len(body)}
        # markers of embedded backends
        for marker, label in [("dpt/v1", "dpt"), ("masjidal", "masjidal"),
                              ("mawaqit", "mawaqit"), ("masjidbox", "masjidbox"),
                              ("go2masjid", "go2masjid"), ("prayertimes", "generic"),
                              ("docs.google.com/spreadsheets", "gsheet"),
                              ("monthlytable", "monthlytable-plugin")]:
            if marker in txt.lower():
                rec.setdefault("markers", []).append(label)
        rec["file"] = save(tag, hostname, path, body)
        report["hits"].append(rec)
    return report


if __name__ == "__main__":
    tag = sys.argv[1]
    hosts = sys.argv[2:]
    all_r = []
    for h in hosts:
        r = probe(tag, h)
        all_r.append(r)
        best = [x for x in r["hits"] if x.get("dpt") or x.get("times", 0) > 40]
        print(f"== {h}: {len(best)} candidate surfaces")
        for b in best[:6]:
            print("   ", {k: v for k, v in b.items() if k != "file"})
    with open(os.path.join(OUT, f"probe-{tag}.json"), "w") as f:
        json.dump(all_r, f, indent=1)
