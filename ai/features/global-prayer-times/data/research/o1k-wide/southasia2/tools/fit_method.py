"""Fit the federal Nizam-e-Salat Islamabad chart against named method pairs.

The chart is a leap-anchored perpetual template (February carries 29 rows), so
the geometry is evaluated on 2028; the common-year re-phase is reported for
comparison. Coordinates are the published Islamabad point."""
import glob
import json
import math
import statistics as st
import sys

sys.path.insert(0, "tools")
import solar

LAT, LON, TZ = 33.6844, 73.0479, 5.0
COLS = ["fajr_a", "fajr_j", "sunrise", "dhuhr_a", "dhuhr_j", "asr_a", "asr_j",
        "sunset", "maghrib", "isha_a", "isha_j"]
PM = {"dhuhr_a", "dhuhr_j", "asr_a", "asr_j", "sunset", "maghrib", "isha_a", "isha_j"}

raw = {}
for f in sorted(glob.glob("../southasia/data/pk-islamabad-nizam-m*.json")):
    for k, v in json.load(open(f)).items():
        if k.startswith("2026-"):
            raw[k] = {c: solar.minutes(x) + (720 if c in PM and solar.minutes(x) < 720 else 0)
                      for c, x in zip(COLS, v)}


def days(anchor):
    out = []
    for k in sorted(raw):
        y, m, d = (int(x) for x in k.split("-"))
        if anchor == "leap":
            out.append((k, 2028, m, d))
        elif not (m == 2 and d == 29):
            out.append((k, 2026, m, d))
    return out


def resid(anchor, col, alt, morning):
    return [raw[k][col] - solar.altitude_time(y, m, d, LAT, LON, TZ, alt, morning)
            for k, y, m, d in days(anchor)]


def show(label, v):
    print("  %-26s n=%3d mean %+6.2f  sd %5.2f  range [%+.1f,%+.1f]"
          % (label, len(v), st.mean(v), st.pstdev(v), min(v), max(v)))


print("== anchor: which date mapping the perpetual template follows ==")
for a in ("common", "leap"):
    show("sunrise vs -0.833, " + a, resid(a, "sunrise", -0.833, True))
A = "leap"

print("\n== solar columns against plain geometry (no method margin) ==")
show("sunrise -0.833", resid(A, "sunrise", -0.833, True))
show("sunset  -0.833", resid(A, "sunset", -0.833, False))
show("maghrib -0.833", resid(A, "maghrib", -0.833, False))
print("  maghrib - sunset = %s -> a flat +5 min institutional margin"
      % sorted({raw[k]["maghrib"] - raw[k]["sunset"] for k in raw}))

print("\n== fajr ==")
show("fajr vs 18 deg", resid(A, "fajr_a", -18, True))


def rms(angle):
    v = [raw[k]["fajr_a"] - solar.altitude_time(y, m, d, LAT, LON, TZ, -angle, True)
         for k, y, m, d in days(A)]
    return math.sqrt(sum(x * x for x in v) / len(v))


lo, hi = 14.0, 22.0
for _ in range(50):
    a, b = lo + (hi - lo) / 3, hi - (hi - lo) / 3
    if rms(a) < rms(b):
        hi = b
    else:
        lo = a
print("  least-squares fajr angle %.2f deg (rms %.2f min); 18.00 -> rms %.2f; 17.00 -> %.2f; 19.00 -> %.2f"
      % ((lo + hi) / 2, rms((lo + hi) / 2), rms(18.0), rms(17.0), rms(19.0)))

print("\n== asr ==")
sa = [solar.invert_asr(y, m, d, LAT, LON, TZ, raw[k]["asr_a"]) for k, y, m, d in days(A)]
print("  implied shadow factor: median %.3f  mean %.3f  sd %.3f  range [%.2f,%.2f]"
      % (st.median(sa), st.mean(sa), st.pstdev(sa), min(sa), max(sa)))
print("  Hanafi (2) fits at a +2..+3 min margin; Shafi (1) is 44 min early")

print("\n== isha: is it an angle at all? ==")
show("isha vs 18 deg", resid(A, "isha_a", -18, False))


def rms_isha(angle):
    v = [raw[k]["isha_a"] - solar.altitude_time(y, m, d, LAT, LON, TZ, -angle, False)
         for k, y, m, d in days(A)]
    return math.sqrt(sum(x * x for x in v) / len(v))


lo, hi = 12.0, 26.0
for _ in range(50):
    a, b = lo + (hi - lo) / 3, hi - (hi - lo) / 3
    if rms_isha(a) < rms_isha(b):
        hi = b
    else:
        lo = a
print("  least-squares isha angle %.2f deg, rms %.2f min -> no angle reproduces it"
      % ((lo + hi) / 2, rms_isha((lo + hi) / 2)))

seq = [(k, raw[k]["isha_a"]) for k, *_ in days(A)]
steps = [(k, a, b) for (_, a), (k, b) in zip(seq, seq[1:]) if a != b]
print("  distinct values: %s" % [v // 60 * 100 + v % 60 for v in sorted({v for _, v in seq})])
print("  %d plateaus, %d transitions" % (len({v for _, v in seq}), len(steps)))
for k, a, b in steps:
    y, m, d = (int(x) for x in k.split("-"))
    base = solar.altitude_time(2028, m, d, LAT, LON, TZ, -18, False)
    print("    %s  %02d:%02d -> %02d:%02d (%+d min), 18 deg at band start %02d:%02d, offset %+.0f"
          % (k, a // 60, a % 60, b // 60, b % 60, b - a, base // 60, base % 60, b - base))

print("\n== dhuhr ==")
seq = [(k, raw[k]["dhuhr_a"]) for k, *_ in days(A)]
print("  distinct values: %s" % sorted({v for _, v in seq}))
for (k0, a), (k, b) in zip(seq, seq[1:]):
    if a != b:
        y, m, d = (int(x) for x in k.split("-"))
        print("    switch on %s: %02d:%02d -> %02d:%02d; solar transit then %02d:%02d"
              % (k, a // 60, a % 60, b // 60, b % 60,
                 solar.noon(2028, m, d, LON, TZ) // 60, solar.noon(2028, m, d, LON, TZ) % 60))
res = [raw[k]["dhuhr_a"] - solar.noon(y, m, d, LON, TZ) for k, y, m, d in days(A)]
print("  adhan minus transit: mean %+.1f min, range [%+.1f,%+.1f] -> institutional clock, not a margin"
      % (st.mean(res), min(res), max(res)))

print("\n== named pairs, nearest-minute emulation, whole template ==")
PROBE = {"fajr": "fajr_a", "sunrise": "sunrise", "dhuhr": "dhuhr_a",
         "asr": "asr_a", "maghrib": "sunset", "isha": "isha_a"}
print("  %-26s %s" % ("method", " ".join("%-16s" % c for c in PROBE)))


def emulate(fajr, isha, shadow):
    out = {}
    for k, y, m, d in days(A):
        out[k] = {
            "fajr": round(solar.altitude_time(y, m, d, LAT, LON, TZ, -fajr, True)),
            "sunrise": round(solar.altitude_time(y, m, d, LAT, LON, TZ, -0.833, True)),
            "dhuhr": round(solar.noon(y, m, d, LON, TZ)),
            "asr": round(solar.asr_time(y, m, d, LAT, LON, TZ, shadow)),
            "maghrib": round(solar.altitude_time(y, m, d, LAT, LON, TZ, -0.833, False)),
            "isha": round(solar.altitude_time(y, m, d, LAT, LON, TZ, -isha, False)),
        }
    return out


for name, (fa, ia, sh) in {
    "Karachi 18/18 + Hanafi asr": (18, 18, 2),
    "MWL 18/17 + Shafi asr": (18, 17, 1),
    "18/18 + Shafi asr": (18, 18, 1),
}.items():
    e = emulate(fa, ia, sh)
    cells = []
    for col, key in PROBE.items():
        diff = [e[k][col] - raw[k][key] for k, *_ in days(A)]
        cells.append("%+5.1f/%4.1f/%3d" % (st.mean(diff),
                                           math.sqrt(sum(x * x for x in diff) / len(diff)),
                                           sum(1 for x in diff if x == 0)))
    print("  %-26s %s" % (name, " ".join("%-16s" % c for c in cells)))
print("  cells: mean error / rms / exact-minute hits of %d rows" % len(days(A)))
