import json, os, re, sys

CENSUS = os.path.expanduser("~/athan-gitree/census")
DATE_RE = re.compile(r"20\d\d-\d\d-\d\d")
PRAYER_RE = re.compile(r"(fajr|isha|maghrib|dhuhr|zuhr|asr|sunrise|shuruq)", re.I)


def scan(path):
    try:
        text = open(path, errors="ignore").read()
    except Exception:
        return None
    dates = sorted(set(DATE_RE.findall(text)))
    if len(dates) < 7 or not PRAYER_RE.search(text):
        return None
    return {"dates": len(dates), "first": dates[0], "last": dates[-1],
            "years": sorted({d[:4] for d in dates})}


def main():
    here = os.path.dirname(__file__)
    caps = json.load(open(os.path.join(here, "capitals.json")))
    hits = json.load(open(os.path.join(here, "archive-hits.json")))
    inv = {}
    for c in caps:
        cc = c[0]
        rows = []
        for p in hits.get(cc, []):
            if not p.endswith(".json") or "/data/" not in p:
                continue
            full = os.path.join(CENSUS, p[2:] if p.startswith("./") else p)
            s = scan(full)
            if not s:
                continue
            s["path"] = full.replace(CENSUS + "/", "")
            rows.append(s)
        inv[cc] = sorted(rows, key=lambda x: (-x["dates"], x["path"]))
    json.dump(inv, open(os.path.join(here, "inventory.json"), "w"), indent=1)
    for c in caps:
        cc = c[0]
        r = inv[cc]
        best = r[0] if r else None
        print(f"{cc:6}|{c[2][:20]:20}|{len(r):3}|" + (f"{best['dates']:4} {best['first']}..{best['last']} {best['path'][-56:]}" if best else "GAP"))


if __name__ == "__main__":
    main()
