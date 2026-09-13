#!/usr/bin/env python3
"""Follow-up sweep on the one survivor: is the noon boundary untested, or the whole branch?

The first sweep only mutated occurrence #1 and only at the boundary. Distinguish
"the suite misses hour===12" (cheap, arguably unreachable) from "the suite misses the
entire PM->previous-day path" (expensive, a real hole).
"""
import re, subprocess, os

REPO = '$HOME/repos/rn.athan.uk'
F = 'shared/prayer.ts'
OLD = 'hours >= 12'

# (occurrence index 1-based, replacement, label)
MUTATIONS = [
    (1, 'hours > 12',  'calculateBelongsToDate: boundary >= -> >'),
    (1, 'false',       'calculateBelongsToDate: whole PM branch dead'),
    (2, 'hours > 12',  'adjustPrayerDateForMidnightCrossing: boundary >= -> >'),
    (2, 'false',       'adjustPrayerDateForMidnightCrossing: whole PM branch dead'),
]


def apply_nth(src, old, new, n):
    idx = -1
    for _ in range(n):
        idx = src.find(old, idx + 1)
        if idx == -1:
            return None
    return src[:idx] + new + src[idx + len(old):]


def run_suite():
    r = subprocess.run(['npx', 'jest', '--silent'], cwd=REPO, capture_output=True, text=True)
    out = r.stderr + r.stdout
    m = re.search(r'Tests:\s+(?:(\d+) failed, )?(\d+) passed', out)
    return int(m.group(1)) if m and m.group(1) else 0


full = os.path.join(REPO, F)
original = open(full).read()
print(f"{'mutation':62s} result")
print('-' * 96)
for n, rep, label in MUTATIONS:
    new = apply_nth(original, OLD, rep, n)
    assert new is not None, label
    try:
        open(full, 'w').write(new)
        failed = run_suite()
        verdict = f'killed  ({failed} tests failed)' if failed else '*** SURVIVED — suite is blind ***'
        print(f'{label:62s} {verdict}')
    finally:
        open(full, 'w').write(original)
