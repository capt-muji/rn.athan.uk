import json, sys
def mins(s):
    h, m = s.split(':'); return int(h)*60+int(m)
for f in sys.argv[1:]:
    d = json.load(open(f))
    print("==", f, len(d), "rows")
    keys = sorted(d)
    for k in keys:
        v = d[k]
        t = [mins(v[c]) for c in ("fajr","sunrise","dhuhr","asr","magrib","isha")]
        bad = [c for c, x, y in zip(("fajr","sunrise","dhuhr","asr","magrib","isha"), t, t[1:]) if x >= y]
        if bad:
            print("  ORDER", k, v, "breaks at", bad)
    for a, b in zip(keys, keys[1:]):
        for c in ("fajr","sunrise","dhuhr","asr","magrib","isha"):
            j = mins(d[b][c]) - mins(d[a][c])
            if abs(j) > 6:
                print("  JUMP", a, b, c, d[a][c], "->", d[b][c], j)
