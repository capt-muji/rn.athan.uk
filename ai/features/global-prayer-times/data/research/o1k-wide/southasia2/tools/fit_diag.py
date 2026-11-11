"""Fit the federal Nizam-e-Salat Islamabad chart against candidate methods.

The chart is a leap-anchored perpetual template (February carries 29 rows), so
geometry is evaluated on 2028 (a leap year, same row era) and compared with a
2026 re-phasing of the rows after 29 February."""
import json
import glob
import statistics as st
import sys

sys.path.insert(0, "tools")
import solar

LAT, LON, TZ = 33.6844, 73.0479, 5.0
SRC = sorted(glob.glob("../southasia/data/pk-islamabad-nizam-m*.json"))
COLS = ["fajr_a", "fajr_j", "sunrise", "dhuhr_a", "dhuhr_j", "asr_a", "asr_j",
        "sunset", "maghrib", "isha_a", "isha_j"]

PM = {"dhuhr_a", "dhuhr_j", "asr_a", "asr_j", "sunset", "maghrib", "isha_a", "isha_j"}

def clock(col, hhmm):
    """Chart prints evening columns on a 12-hour face; normalise to 24h."""
    m = solar.minutes(hhmm)
    return m + 720 if col in PM and m < 720 else m

raw = {}
for f in SRC:
    d = json.load(open(f))
    for k, v in d.items():
        if k.startswith("2026-"):
            raw[k] = {c: clock(c, x) for c, x in zip(COLS, v)}

# leap-anchored row order: key -> (y,m,d) for each alignment
def align(k, year):
    y, m, d = (int(x) for x in k.split("-"))
    return (year, m, d)

rows = {}
for k, r in raw.items():
    y, m, d = (int(x) for x in k.split("-"))
    if m == 2 and d == 29:
        rows[k] = dict(r, _d=(2028, 2, 29))
    else:
        rows[k] = dict(r, _d=(2026, m, d))
print("rows:", len(rows))


def resid(col, alt, morning, key="_d"):
    out = []
    for r in rows.values():
        y, m, d = r[key]
        t = solar.altitude_time(y, m, d, LAT, LON, TZ, alt, morning)
        out.append(r[col] - t)
    return out


print("\n== anchor probe: sunrise vs geometric -0.833 ==")
for label, key in (("2026 re-phase", "_d"),):
    v = resid("sunrise", -0.833, True, key)
    print(" %s: mean %+.2f sd %.2f  min %+.1f max %+.1f" % (label, st.mean(v), st.pstdev(v), min(v), max(v)))
v = []
for k, r in rows.items():
    y, m, d = (int(x) for x in k.split("-"))
    t = solar.altitude_time(2028, m, d, LAT, LON, TZ, -0.833, True)
    v.append(r["sunrise"] - t)
print(" 2028 leap anchor: mean %+.2f sd %.2f  min %+.1f max %+.1f" % (st.mean(v), st.pstdev(v), min(v), max(v)))

print("\n== column residuals vs geometry (min) ==")
for col, alt, morning in (("fajr_a", -18, True), ("isha_a", -18, False),
                          ("sunset", -0.833, False), ("maghrib", -0.833, False)):
    v = resid(col, alt, morning)
    print(" %-8s vs %6.1f deg: mean %+6.2f sd %5.2f min %+6.1f max %+6.1f"
          % (col, alt, st.mean(v), st.pstdev(v), min(v), max(v)))

print("\n== asr implied shadow factor ==")
sa = {}
for k, r in rows.items():
    y, m, d = r["_d"]
    sa[k] = solar.invert_asr(y, m, d, LAT, LON, TZ, r["asr_a"])
vals = sorted(sa.values())
print(" median %.3f  p05 %.3f p95 %.3f" % (st.median(vals), vals[len(vals)//20], vals[19*len(vals)//20]))
for mo in range(1, 13):
    v = [sa[k] for k in sa if k.startswith("2026-%02d" % mo)]
    print("  M%02d n=%2d median %.3f  range %.2f..%.2f" % (mo, len(v), st.median(v), min(v), max(v)))

print("\n== fajr / isha implied depression angle by month ==")
imp = {}
for col, morning in (("fajr_a", True), ("isha_a", False)):
    imp[col] = {k: -solar.invert_altitude(*rows[k]["_d"], LAT, LON, TZ, rows[k][col], morning)
                for k in rows}
for mo in range(1, 13):
    f = [imp["fajr_a"][k] for k in imp["fajr_a"] if k.startswith("2026-%02d" % mo)]
    i = [imp["isha_a"][k] for k in imp["isha_a"] if k.startswith("2026-%02d" % mo)]
    print("  M%02d fajr med %5.2f (%5.2f..%5.2f)  isha med %6.2f (%5.2f..%6.2f)"
          % (mo, st.median(f), min(f), max(f), st.median(i), min(i), max(i)))

print("\n== dhuhr adhan minus solar transit, monthly ==")
for mo in range(1, 13):
    v = []
    for k, r in rows.items():
        if k.startswith("2026-%02d" % mo):
            y, m, d = r["_d"]
            v.append(r["dhuhr_a"] - solar.noon(y, m, d, LON, TZ))
    print("  M%02d median %5.1f  range %5.1f..%5.1f" % (mo, st.median(v), min(v), max(v)))

print("\n== isha minus maghrib (min), monthly ==")
for mo in range(1, 13):
    v = []
    for k, r in rows.items():
        if k.startswith("2026-%02d" % mo):
            v.append(r["isha_a"] - r["maghrib"])
    print("  M%02d median %5.1f  range %5.1f..%5.1f" % (mo, st.median(v), min(v), max(v)))
