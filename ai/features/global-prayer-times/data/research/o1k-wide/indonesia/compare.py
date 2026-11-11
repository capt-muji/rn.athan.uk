import json, os, statistics as st

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
CITIES = ["jakarta-pusat", "surabaya", "medan", "makassar", "jayapura"]
COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"]


def minutes(t):
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def sign(v):
    return f"{v:+d}" if v else "0"


for slug in CITIES:
    a_p = os.path.join(DATA, f"sihat-2026-{slug}.json")
    b_p = os.path.join(DATA, f"khgt-2026-{slug}.json")
    if not (os.path.exists(a_p) and os.path.exists(b_p)):
        continue
    a = json.load(open(a_p))["rows"]
    b = json.load(open(b_p))["rows"]
    dates = sorted(set(a) & set(b))
    print(f"\n== {slug} 2026, {len(dates)} shared days (KHGT minus SIHAT, minutes)")
    for c in COLS:
        d = [minutes(b[k][c]) - minutes(a[k][c]) for k in dates]
        print(f"  {c:8s} median {sign(round(st.median(d)))}  range {sign(min(d))}..{sign(max(d))}  "
              f"sd {round(st.pstdev(d),1)}  zeros {d.count(0)}")
