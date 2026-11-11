import json

d = json.load(open('fits/SUMMARY.json'))
cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def itxt(isha):
    if isha[0] == 'angle':
        return f"{isha[1]}\u00b0"
    if isha[0] == 'interval':
        return f"maghrib+{isha[1]}"
    return f"{isha[1]}\u00b0 floor maghrib+{isha[2]}"


rows = []
for r in sorted(d, key=lambda x: (x['metro'], x['surface'])):
    pc = r['per_column']
    f = r['isna_15_15']
    rows.append((r, pc, f))

print('| metro | surface | rows | free recipe | free w1 | ISNA 15/15 w1 | exact | amp |')
print('|---|---|---|---|---|---|---|---|')
for r, pc, f in rows:
    rec = r['recipe']
    w1 = sum(pc[c]['w1'] for c in cols) / 6
    print(f"| {r['metro']} | {r['surface'][:44]} | {r['rows']} | "
          f"{rec['fajr_angle']}/{itxt(rec['isha'])}, {rec['madhab']} asr | {w1:.1f} | "
          f"{f['w1']:.1f} | {f['exact']:.1f} | {r['seasonal_fajr_amplitude_min']} |")
print()
n = len(rows)
for thr in (95, 90, 85, 80):
    print(f"ISNA 15/15 at or above {thr} pc within-1: {sum(1 for _, _, f in rows if f['w1'] >= thr)} of {n}")
print('rows total', sum(r['rows'] for r, _, _ in rows))
print('plain 15/15 free recipe:', sum(1 for r, _, _ in rows
                                     if r['recipe']['fajr_angle'] == 15
                                     and r['recipe']['isha'][0] == 'angle'
                                     and abs(r['recipe']['isha'][1] - 15) < 0.25))
