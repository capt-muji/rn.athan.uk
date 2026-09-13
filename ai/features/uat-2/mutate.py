#!/usr/bin/env python3
"""Mutation sweep: break the code on purpose, see whether the suite notices.

A test that passes against broken code is decorative. This measures that
objectively instead of by opinion.
"""
import re, subprocess, sys, shutil, os, tempfile

REPO = '$HOME/repos/rn.athan.uk'

# (file, regex, replacement, label) — small semantic mutations, one at a time
MUTATIONS = [
    ('shared/prayer.ts', r'hours < ISLAMIC_DAY\.EARLY_MORNING_CUTOFF_HOUR', 'hours <= ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR', 'small-hours cutoff < -> <='),
    ('shared/prayer.ts', r"MIDNIGHT_CROSSING_PRAYERS\.includes\(prayerName\)", "prayerName === 'Isha'", 'drop Magrib from the date shift'),
    ('shared/prayer.ts', r'TIME_ADJUSTMENTS\.istijaba \* 60_000', 'TIME_ADJUSTMENTS.istijaba * 60_001', 'istijaba offset off by 1ms/min'),
    ('shared/prayer.ts', r'hours >= 12', 'hours > 12', 'night-row noon boundary >= -> >'),
    ('shared/time.ts', r'length / 2', 'length / 2.01', 'islamic midnight midpoint drift'),
    ('shared/time.ts', r'\(length \* 2\) / 3', '(length * 2) / 3.01', 'last third drift'),
    ('shared/notifications.ts', r'NOTIFICATION_ROLLING_DAYS \+ \(isEveningBeforeRow \? 1 : 0\)', 'NOTIFICATION_ROLLING_DAYS', 'night rows lose their extra day'),
    ('shared/notifications.ts', r'soundIndex \+ 1', 'soundIndex + 2', 'athan channel id off by one'),
    ('api/client.ts', r'\^\(\[01\]\\d\|2\[0-3\]\):\[0-5\]\\d\$', r'^.*$', 'time pattern accepts anything'),
    ('api/client.ts', r'if \(todayDropped\) throw', 'if (false && todayDropped) throw', 'today may be silently dropped'),
    ('stores/notifications.ts', r'!Database\.getPrayerByDate\(TimeUtils\.createInstant\(\)\)', 'false', 'reschedule ignores an empty cache'),
    ('stores/schedule.ts', r"\.map\(\(prayer\) => prayer\.datetime\.getTime\(\)\)\.join\('\|'\)", ".map((prayer) => prayer.datetime.getTime()).slice(0, 1).join('|')", 'sequence signature back to first-only'),
    ('shared/widgetTimeline.ts', r'stepMs -= COUNTDOWN_STEP_MS', 'stepMs -= COUNTDOWN_STEP_MS * 1', 'no-op control (must SURVIVE)'),
    ('shared/versionUtils.ts', r"\.replace\(/\^v/i, ''\)", '', 'version v-prefix strip removed'),
    ('shared/constants.ts', r'Number\.isInteger\(envIntervalMinutes\)', 'Number.isFinite(envIntervalMinutes)', 'interval accepts fractions'),
]

def run_suite():
    r = subprocess.run(['npx', 'jest', '--silent'], cwd=REPO, capture_output=True, text=True)
    m = re.search(r'Tests:\s+(?:(\d+) failed, )?(\d+) passed', r.stderr + r.stdout)
    failed = int(m.group(1)) if m and m.group(1) else 0
    return failed

print(f"{'mutation':52s} {'file':26s} result")
print('-' * 96)
killed = survived = skipped = 0
for path, pat, rep, label in MUTATIONS:
    full = os.path.join(REPO, path)
    src = open(full).read()
    new, n = re.subn(pat, rep, src, count=1)
    if n == 0:
        print(f"{label:52s} {path:26s} SKIP (pattern not found)")
        skipped += 1
        continue
    backup = src
    try:
        open(full, 'w').write(new)
        failed = run_suite()
        if failed > 0:
            print(f"{label:52s} {path:26s} killed  ({failed} tests failed)")
            killed += 1
        else:
            print(f"{label:52s} {path:26s} *** SURVIVED — suite is blind ***")
            survived += 1
    finally:
        open(full, 'w').write(backup)

print('-' * 96)
print(f"killed {killed}   survived {survived}   skipped {skipped}")
