import json, re, sys

src, out, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
t = open(src, encoding='utf-8', errors='replace').read()
i = t.find('"calendar":[')
assert i > 0, 'no calendar'
# take the balanced bracket run after "calendar":
s = t[i + len('"calendar":'):]
depth = 0
for n, ch in enumerate(s):
    if ch == '[':
        depth += 1
    elif ch == ']':
        depth -= 1
        if depth == 0:
            s = s[:n + 1]
            break
cal = json.loads(s)
times = json.loads(re.search(r'"times":(\[[^\]]*\])', t).group(1))
shuruq = re.search(r'"shuruq":"(\d\d:\d\d)"', t).group(1)

rows = {}
for mi, month in enumerate(cal, start=1):
    days = month if isinstance(month, list) else [month[str(d)] for d in range(1, 32) if str(d) in month]
    for di, v in enumerate(days, start=1):
        if not v:
            continue
        rows[f'{year}-{mi:02d}-{di:02d}'] = {
            'fajr': v[0], 'sunrise': v[1], 'dhuhr': v[2], 'asr': v[3], 'maghrib': v[4], 'isha': v[5]}
json.dump(rows, open(out, 'w'), indent=1, sort_keys=True)
gate_day = f'{year}-11-11'
print(out, len(rows), min(rows), max(rows))
print('live times', times, 'shuruq', shuruq)
print('calendar row', gate_day, rows.get(gate_day))
print('GATE', 'PASS' if rows.get(gate_day) and [rows[gate_day][k] for k in ('fajr','sunrise','dhuhr','asr','maghrib','isha')] == times[:1] + [shuruq] + times[1:] else 'FAIL')
