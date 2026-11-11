#!/usr/bin/env python3
"""Scan candidate masjid domains for a dated prayer-times layer.

Writes one TSV row per (metro, url, path) with the platform markers found, and saves
every fetched body under captures/scan/.
"""
import os, re, sys, urllib.request, urllib.error, concurrent.futures, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "captures", "scan")
os.makedirs(OUT, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")
PATHS = ["", "/prayer-times", "/prayer-times/", "/prayers", "/prayer", "/prayertimes",
         "/prayer-timings", "/salah", "/prayer-schedule", "/prayer-times/monthly"]

MARKERS = {
    "masjidal": r"masjid_id=([A-Za-z0-9]{6,14})",
    "athanplus": r"athanplus\.com[^\"'<>\s]*masjid_id=([A-Za-z0-9]{6,14})",
    "mawaqit": r"mawaqit\.net/(?:en|fr|es|ar|m)/(?:m/)?([a-z0-9][a-z0-9-]{4,})",
    "masjidbox": r"masjidbox\.com/(?:prayer-times|embed|prayer)/([a-z0-9][a-z0-9-]{2,})",
    "mohid": r"(?:us\.)?mohid\.co/([a-z]{2}/[a-z0-9-]+/[a-z0-9-]+)",
    "ifinder": r"islamicfinder\.org/prayer-widget/(\d+)/([a-z]+)/(\d+)/([0-9.]+)/([0-9.]+)",
    "alminaret": r"alminaret\.com/([a-z0-9-]+)",
    "masjidway": r"masjidway\.com/masjid/(\d+)",
    "ics": r"href=\"([^\"]+\.ics[^\"]*)\"",
    "pdf": r"href=\"([^\"]+\.pdf[^\"]*)\"",
    "json": r"(?:fetch|ajax|url)\s*[:(]\s*[\"']([^\"']*(?:json|prayer|athan|times)[^\"']*)[\"']",
}


def fetch(metro, domain, path):
    url = domain if not path else domain.rstrip("/") + path
    key = re.sub(r"[^a-z0-9]+", "-", (metro + "-" + url).lower())[:110]
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": UA, "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"})
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read()
            status = r.status
    except urllib.error.HTTPError as e:
        return {"metro": metro, "url": url, "status": e.code, "size": 0, "markers": {}}
    except Exception as e:
        return {"metro": metro, "url": url, "status": "ERR:" + type(e).__name__, "size": 0, "markers": {}}
    open(os.path.join(OUT, key + ".html"), "wb").write(body)
    h = body.decode("utf-8", "ignore")
    m = {}
    for name, pat in MARKERS.items():
        hits = sorted(set(x if isinstance(x, str) else "|".join(x) for x in re.findall(pat, h, re.I)))
        if hits:
            m[name] = hits[:6]
    return {"metro": metro, "url": url, "status": status, "size": len(body), "markers": m}


def main():
    targets = json.load(open(os.path.join(HERE, "targets.json")))
    jobs = []
    for metro, domains in targets.items():
        for d in domains:
            for p in PATHS:
                jobs.append((metro, d, p))
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        for r in ex.map(lambda j: fetch(*j), jobs):
            rows.append(r)
            if r["markers"]:
                print(json.dumps(r), flush=True)
    with open(os.path.join(HERE, "scan.tsv"), "w") as fh:
        for r in rows:
            fh.write("%s\t%s\t%s\t%s\t%s\n" % (r["metro"], r["url"], r["status"], r["size"],
                                               json.dumps(r["markers"], sort_keys=True)))
    print("rows", len(rows))


if __name__ == "__main__":
    main()
