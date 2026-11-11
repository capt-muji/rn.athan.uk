import sys, json, calendar
sys.path.insert(0, '.')
from xlsx import read

MON = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
NAMES = {'Isha':'isha','Maghreb':'magrib','Asr':'asr','Dohr':'dhuhr','Shuruq':'sunrise','Fadjr':'fajr','Imsak':'imsak'}
KEEP = ['fajr','sunrise','dhuhr','asr','magrib','isha']

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

def hm(x):
    t = round(x * 1440) % 1440
    return f"{t // 60:02d}:{t % 60:02d}"

def parse(path, year):
    rows = read(path)
    width = max((len(r) for r in rows), default=0)
    heads = []
    for i, r in enumerate(rows):
        hits = [(MON.index(c.strip()), j) for j, c in enumerate(r)
                if isinstance(c, str) and c.strip() in MON]
        for n, (mon, j) in enumerate(hits):
            ends = [h for _, h in hits if h > j]
            heads.append((mon, i, j, ends[0] if ends else width))
    out = {}
    for mon, r0, lo, hi in heads:
        r_end = min([h2 for _, h2, _, _ in heads if h2 > r0] or [len(rows)])
        hdr = next((rr for rr in range(r0, min(r0 + 4, len(rows)))
                    if any(isinstance(c, str) and c.strip() in NAMES for c in rows[rr][lo:hi])), None)
        if hdr is None: continue
        cmap = {}
        for j in range(lo, min(hi, len(rows[hdr]))):
            c = rows[hdr][j]
            if isinstance(c, str) and c.strip() in NAMES:
                cmap[NAMES[c.strip()]] = j
        if not {'fajr','isha'} <= set(cmap): continue
        body = [rows[rr] for rr in range(hdr + 1, r_end)]
        dcol = None
        for col in range(lo, hi):
            seq = [num(r[col]) if col < len(r) else None for r in body]
            vals = [v for v in seq if v is not None and v == int(v) and 1 <= v <= 31]
            if len(vals) >= 27 and vals == list(range(1, len(vals) + 1)):
                dcol, ndays = col, len(vals); break
        if dcol is None:
            print(f"  !! no day column for {MON[mon]}", file=sys.stderr); continue
        for d in range(1, calendar.monthrange(year, mon + 1)[1] + 1):
            row = body[d - 1] if d - 1 < len(body) else []
            rec = {}
            for p, col in cmap.items():
                v = num(row[col]) if col < len(row) else None
                if v is None: rec = {}; break
                rec[p] = hm(v)
            if rec and 'fajr' in rec:
                out[f"{year}-{mon+1:02d}-{d:02d}"] = {p: rec[p] for p in KEEP if p in rec}
    return out

if __name__ == '__main__':
    d = parse(sys.argv[1], int(sys.argv[2]))
    print(len(d), "rows ->", sys.argv[3], file=sys.stderr)
    json.dump(d, open(sys.argv[3], 'w'), indent=0, sort_keys=True)
