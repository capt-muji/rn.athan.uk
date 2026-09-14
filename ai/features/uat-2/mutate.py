#!/usr/bin/env python3
"""Mutation sweep: break the code on purpose, see whether the suite notices.

A test that passes against broken code is decorative. This measures that
objectively instead of by opinion.

Runs against the repository this script lives in (two directories above
ai/features/uat-2/), so a worktree sweeps its own copy and never touches the
main checkout.

Each mutant runs only the tests related to the file it mutates:

    npx jest --silent --findRelatedTests <mutated file>

A mutant can only be caught by a test whose dependency graph reaches the
mutated file; every other suite is guaranteed to pass against it, so running
them adds minutes and cannot change a verdict. The flip side: a mutation in a
file no test imports reports "no related tests", which is a survivor.

Every pattern is a literal string that must occur EXACTLY ONCE in its file.
A pattern found zero times is reported SKIP (the code it targeted has moved);
one found more than once is reported SKIP (ambiguous) rather than guessing
which occurrence was meant.

Usage:
    python3 ai/features/uat-2/mutate.py            # run every mutant
    python3 ai/features/uat-2/mutate.py --check    # only verify patterns
    python3 ai/features/uat-2/mutate.py 12 13      # run mutants by number
"""
import os
import re
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))

# A synchronous infinite loop ignores jest's testTimeout; a mutant that hangs is a detected mutant
MUTANT_TIMEOUT_S = 600

# (file, literal pattern, replacement, label) - small semantic mutations, one at a time
MUTATIONS = [
    # --- carried over from the uat-2 sweep (still present in the code) ---
    ('shared/prayer.ts', 'hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR', 'hours <= ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR', 'small-hours cutoff < -> <='),
    ('shared/prayer.ts', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName)', "prayerName === 'Isha'", 'drop Magrib from the date shift'),
    ('shared/prayer.ts', 'TIME_ADJUSTMENTS.istijaba * 60_000', 'TIME_ADJUSTMENTS.istijaba * 60_001', 'istijaba offset off by 1ms/min'),
    ('shared/prayer.ts', "hours >= 12) {\n      return TimeUtils.addDaysToDateString(calendarDate, 1);", "hours > 12) {\n      return TimeUtils.addDaysToDateString(calendarDate, 1);", 'night-row noon boundary >= -> >'),
    ('shared/time.ts', 'length / 2', 'length / 2.01', 'islamic midnight midpoint drift'),
    ('shared/time.ts', '(length * 2) / 3', '(length * 2) / 3.01', 'last third drift'),
    ('shared/notifications.ts', 'NOTIFICATION_ROLLING_DAYS + (isEveningBeforeRow ? 1 : 0)', 'NOTIFICATION_ROLLING_DAYS', 'night rows lose their extra day'),
    ('shared/notifications.ts', 'athan_${soundIndex + 1}_v2', 'athan_${soundIndex + 2}_v2', 'athan channel id off by one'),
    ('api/client.ts', r'/^([01]\d|2[0-3]):[0-5]\d$/', r'/^.*$/', 'time pattern accepts anything'),
    ('shared/versionUtils.ts', ".replace(/^v/i, '')", '', 'version v-prefix strip removed'),
    ('shared/constants.ts', 'Number.isInteger(envIntervalMinutes)', 'Number.isFinite(envIntervalMinutes)', 'interval accepts fractions'),
    ('shared/widgetTimeline.ts', 'stepMs -= COUNTDOWN_STEP_MS', 'stepMs -= COUNTDOWN_STEP_MS * 1', 'no-op control (must SURVIVE)'),

    # --- session 3: api/client.ts ---
    ('api/client.ts', '      day[field] = null;', '      day[field] = value as string;', 'malformed field kept instead of nulled'),
    ('api/client.ts', 'typeof value === \'string\' && TIME_PATTERN.test(value)', 'TIME_PATTERN.test(value as string)', 'non-string field stringified and accepted'),
    ('api/client.ts', 'if (!anyReadable) throw', 'if (false) throw', 'nothing-readable throw removed'),
    ('api/client.ts', 'const counts = !holdsTodayOrLater || date >= today;', 'const counts = true;', 'nothing-readable check counts yesterday'),
    ('api/client.ts', "Object.keys(apiData.times).some((date) => date >= today);", 'true;', 'payload without today judged as if it had it'),
    ('api/client.ts', 'if (body?.date !== date) throw', 'if (false) throw', 'fetchDay date check removed'),
    ('api/client.ts', "selector, '24hours=true'].join('&')", "selector, ...('date' in period ? [] : ['24hours=true'])].join('&')", '24hours=true dropped from the day URL'),

    # --- session 3: shared/prayer.ts ---
    ('shared/prayer.ts', "  if (previousDay?.date !== previousDate) return null;\n\n  const magribTime = previousDay.magrib;", "  const magribTime = previousDay?.date === previousDate ? previousDay.magrib : day.magrib;", 'Magrib borrowed for a missing previous day'),
    ('shared/prayer.ts', '    prayers.push(...createPrayersForSingleDay(type, date, rawData, previousDayData));', '    if (!rawData) {\n      previousDayData = null;\n      continue;\n    }\n    prayers.push(...createPrayersForSingleDay(type, date, rawData, previousDayData));', 'missing day skipped by the sequence'),
    ('shared/prayer.ts', 'time === null ? null : TimeUtils.adjustTime(time, minutesDiff)', 'TimeUtils.adjustTime(time as string, minutesDiff)', 'derived time computed from null'),
    ('shared/prayer.ts', "  if (typeof rawData.magrib !== 'string') return null;\n", '', 'Istijaba kept when Magrib is null'),
    ('shared/prayer.ts', "if (typeof magribTime !== 'string' || typeof fajrTime !== 'string') return null;", "if (typeof magribTime !== 'string') return null;", 'night worked out from a null Fajr'),

    # --- session 3: shared/sequence.ts ---
    ('shared/sequence.ts', 'if (!isReadable(prayer) || prayer.datetime <= now) continue;', 'if (isReadable(prayer) && prayer.datetime <= now) continue;', 'unreadable row allowed to be next'),
    ('shared/sequence.ts', 'if (readable.length === 0 || waitsForItsEnd(prayers, date, readable)) return date;', 'if (waitsForItsEnd(prayers, date, readable)) return date;', 'hold removed (unreadable day skipped)'),
    ('shared/sequence.ts', 'if (readable.length === 0 || waitsForItsEnd(prayers, date, readable)) return date;', 'if (readable.length === 0) return date;', 'day before an unreadable day moves on at its last row'),
    ('shared/sequence.ts', 'if (now >= endOfListDay(date)) continue;', '', 'a waiting or unreadable day never ends'),
    ('shared/sequence.ts', 'if (readable.some((prayer) => prayer.datetime > end)) return false;', '', 'a day with a post-midnight row waits for its 00:00'),
    ('shared/sequence.ts', 'return following.length > 0 && !following.some(isReadable);', 'return !following.some(isReadable);', 'a day missing from the sequence is waited for'),
    ('shared/sequence.ts', 'if (readable.length > 0 && !waitsForItsEnd(prayers, displayDate, readable)) return null;', 'if (readable.length > 0) return null;', 'no hold end for a waiting readable day'),
    ('shared/sequence.ts', '  return endOfListDay(displayDate);', '  return null;', 'hold end removed from the boundary'),
    ('shared/sequence.ts', "TimeUtils.createPrayerDatetime(TimeUtils.addDaysToDateString(date, 1), '00:00')", "TimeUtils.createPrayerDatetime(date, '00:00')", 'hold ends at the start of the day'),
    ('shared/sequence.ts', 'if (holdEnd && holdEnd < next.datetime) return holdEnd;', '', 'hold end ignored when a prayer is due'),
    ('shared/sequence.ts', '    if (prayer.belongsToDate !== next.belongsToDate && prayer.belongsToDate !== listBefore) continue;\n', '', 'previous lookup unbounded'),
    ('shared/sequence.ts', '.every((prayer) => prayer.datetime < now);', '.some((prayer) => prayer.datetime < now);', 'unreadable row passed by some, not every'),
    ('shared/sequence.ts', 'prayer.belongsToDate <= row.belongsToDate) continue;', 'prayer.belongsToDate < row.belongsToDate) continue;', 'next occurrence may be the row itself'),

    # --- session 3: stores/schedule.ts ---
    ('stores/schedule.ts', 'return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;', 'return currentDisplayDate !== null && prayer.belongsToDate === currentDisplayDate;', 'future unreadable days dropped by the filter'),
    ('stores/schedule.ts', '  return store.get(nextBoundaryAtom);', '  const sequence = store.get(getSequenceAtom(type));\n  return sequence ? findNextBoundary(sequence.prayers, TimeUtils.createInstant()) : null;', 'boundary worked out fresh, not cached'),
    ('stores/schedule.ts', '  if (prayers.length === 0) return prayers;\n', '  return prayers;\n', 'lost-week extension removed'),
    ('stores/schedule.ts', 'sequence.prayers\n    .map((prayer) =>', 'sequence.prayers\n    .filter(isReadable)\n    .map((prayer) =>', 'signature ignores unreadable rows'),

    # --- session 3: stores/countdown.ts ---
    ('stores/countdown.ts', 'store.set(countdownAtom, { timeLeft: null, name: target.english });', 'store.set(countdownAtom, { timeLeft: 0, name: target.english });', 'null timeLeft written as 0'),
    ('stores/countdown.ts', 'get(getNextPrayerAtom(type)) !== null && get(getPrevPrayerAtom(type)) !== null', 'true', 'bar availability always true'),
    ('stores/countdown.ts', '    const boundary = getNextBoundary(type);\n\n    if (boundary && Date.now() >= boundary.getTime()) {\n      clearCountdown(countdownKey);', '    const boundary = getNextPrayer(type)?.datetime ?? null;\n\n    if (boundary && Date.now() >= boundary.getTime()) {\n      clearCountdown(countdownKey);', 'tick boundary back to next prayer only'),
    ('stores/countdown.ts', '    const boundary = getNextBoundary(type);\n    if (boundary && Date.now() >= boundary.getTime()) {\n      refreshSequence(type);', '    const boundary = getNextPrayer(type)?.datetime ?? null;\n    if (boundary && Date.now() >= boundary.getTime()) {\n      refreshSequence(type);', 'resync boundary back to next prayer only'),
    ('stores/countdown.ts', 'overlayBoundaryMs = getNextBoundary(type)?.getTime() ?? null;', 'overlayBoundaryMs = getNextPrayer(type)?.datetime.getTime() ?? null;', 'overlay deadline back to next prayer only'),
    ('stores/countdown.ts', ' && !get(getDisplayHeldAtom(type))', '', 'bar shown while the list waits for 00:00'),
    ('stores/countdown.ts', '(!selected && store.get(getDisplayHeldAtom(type)))', 'false', 'countdown runs to a later day while the list waits'),
    ('stores/countdown.ts', '!selected && store.get(getDisplayHeldAtom(type))', 'store.get(getDisplayHeldAtom(type))', 'a real overlay tap shows --:-- while the list waits'),
    ('stores/schedule.ts', 'get(nextPrayerAtom)?.belongsToDate !== displayDate', 'get(nextPrayerAtom) === null', 'list waits only when nothing is next'),
    ('stores/schedule.ts', '  store.set(sequenceAtom, sequence);\n  settleBoundary(type);\n', '  store.set(sequenceAtom, sequence);\n', 'boundary not settled after a sync write'),
    ('stores/schedule.ts', '    store.set(sequenceAtom, { type, prayers: mergedPrayers });\n    settleBoundary(type);\n', '    store.set(sequenceAtom, { type, prayers: mergedPrayers });\n', 'boundary not settled after a refresh that fetched'),
    ('stores/schedule.ts', '    store.set(sequenceAtom, { type, prayers: relevantPrayers });\n    settleBoundary(type);\n', '    store.set(sequenceAtom, { type, prayers: relevantPrayers });\n', 'boundary not settled after a refresh that only filtered'),
    ('stores/schedule.ts', 'if (previous && prayer.belongsToDate >= previous.belongsToDate) return true;', 'if (prayer === previous) return true;', 'previous row kept without its list day'),
    ('stores/schedule.ts', '.sort(compareListOrder)[0] ?? null;', '.sort(compareListOrder).at(-1) ?? null;', 'countdown names the last later row'),
    ('stores/countdown.ts', ' ?? getFirstRowAfterDisplay(type)', '', 'countdown frozen after the last readable prayer'),
    ('hooks/usePrayerAgo.ts', 'if (!prevPrayer || isDisplayHeld(type)) {', 'if (!prevPrayer) {', 'ago badge shown while the list waits'),

    # --- session 3: stores/notifications.ts ---
    ('stores/notifications.ts', "  if (!isReadable(prayer)) {\n    logger.info('Skipping prayer with no readable time:'", "  if (false) {\n    logger.info('Skipping prayer with no readable time:'", 'unreadable rows armed (at-time)'),
    ('stores/notifications.ts', "  if (!isReadable(prayer)) {\n    logger.info('REMINDER: Skipping prayer with no readable time:'", "  if (false) {\n    logger.info('REMINDER: Skipping prayer with no readable time:'", 'unreadable rows armed (reminder)'),
    ('stores/notifications.ts', 'if (!armedListDays.some((date) => Database.getPrayerByDateString(date))) {', 'if (!Database.getPrayerByDateString(armedListDays[0])) {', 'reschedule guard back to today only'),
    ('stores/notifications.ts', 'NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);', 'NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS + 1);', 'reschedule guard widened to three days'),

    # --- session 3: stores/sync.ts ---
    ('stores/sync.ts', '        rebuildSequences();\n', '', 'a late 31 December leaves the lists as they were'),
    ('stores/sync.ts', 'if ((newestDownloadOfYear.get(previousYear) ?? 0) > order) return;', '', 'an older 31 December answer overwrites a newer one'),
    ('stores/sync.ts', '        saveDownloadedDays([fetchedDay]);\n', '        saveDownloadedDays([fetchedDay]);\n        Database.markYearAsFetched(previousYear);\n', 'year marked after a day fetch'),
    ('stores/sync.ts', 'if (!data && !isTodayGapInStoredYear()) return true;', 'if (!data) return true;', 'missing today re-fetched though it is a gap'),
    ('stores/sync.ts', 'key.startsWith(`prayer_${year}-`) && key > todayKey', 'key.startsWith(`prayer_${year}-`) && key !== todayKey', 'a year cut short counts as a gap and is never fetched again'),
    ('stores/sync.ts', ' || isTodayGapInStoredYear();', ';', 'December gap goes back to the error screen'),
    ('stores/sync.ts', '  armedDayChanges += 1;\n  reopenNotificationGate();\n', '  armedDayChanges += 1;\n', 'notification gate not reopened after a stored download'),
    ('stores/sync.ts', '  armedDayChanges += 1;\n', '', 'a running reschedule stamps over a reopen (counter never moves)'),
    ('stores/sync.ts', 'isSameRecord(record, Database.getPrayerByDateString(date))', 'true', 'a changed day never reopens the gate'),

    # --- session 3: stores/bootstrap.ts ---
    ('stores/bootstrap.ts', 'const anyDayStored = SEQUENCE_DAYS.some((offset) =>', 'const anyDayStored = [0].some((offset) =>', 'hydrate only when today is stored'),

    # --- session 3: shared/widgetTimeline.ts ---
    ('shared/widgetTimeline.ts', "const segmentFrom = (prayers: Prayer[], at: Date): Segment | null => {\n", "const segmentFrom = (rawPrayers: Prayer[], at: Date): Segment | null => {\n  const prayers = rawPrayers.map((p) => (p.datetime === null ? { ...p, datetime: TimeUtils.createPrayerDatetime(p.belongsToDate, '12:00') } : p)) as Prayer[];\n", 'unreadable row used as a boundary'),
    ('shared/widgetTimeline.ts', 'prayer.belongsToDate === segment.displayDate).sort(compareListOrder)', 'prayer.belongsToDate === segment.next.belongsToDate).sort(compareListOrder)', "day list from next's day, not display date"),
    ('shared/widgetTimeline.ts', 'formatDateLabel(next.belongsToDate, settings.hijriDate)', 'formatDateLabel(current.displayDate, settings.hijriDate)', "date label from the held day, not next's own day"),
    ('shared/widgetTimeline.ts', 'time: prayer.time ?? UNAVAILABLE_TIME', "time: prayer.time ?? ''", 'unreadable widget row drawn blank'),

    # --- session 3: hooks ---
    ('hooks/usePrayerSequence.ts', 'isPassed[index] = isRowPassed(dayRows, rawPrayers[index], now);', 'isPassed[index] = (rawPrayers[index].datetime as unknown as Date) < now;', 'isPassed back to datetime < now'),
    ('hooks/usePrayer.ts', '(findNextOccurrence(prayers, row) ?? row)', '(prayers.find((p) => p.english === row.english && (p.datetime as Date) > (row.datetime as Date)) ?? row)', 'next occurrence found by instant'),
    ('hooks/usePrayer.ts', 'isUnavailable ? AlertType.Off : saved', 'saved', 'unavailable bell draws the saved glyph'),
    ('hooks/useCountdown.ts', 'isReady: displayDate !== null,', "isReady: displayTime !== '--:--',", 'countdown removed while it shows --:--'),
    ('hooks/useCountdown.ts', 'type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom', 'extraDisplayDateAtom', "countdown ready from the other schedule's list day"),
]

W_LABEL = 46
W_FILE = 28


def locate(path, pat):
    full = os.path.join(REPO, path)
    if not os.path.exists(full):
        return full, None, 0
    src = open(full).read()
    return full, src, src.count(pat)


def run_related(full):
    """Runs the tests related to one file; returns (verdict, detail)"""
    try:
        r = subprocess.run(
            ['npx', 'jest', '--silent', '--findRelatedTests', full],
            cwd=REPO, capture_output=True, text=True, timeout=MUTANT_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        return 'killed', f'timed out after {MUTANT_TIMEOUT_S}s'

    out = r.stderr + r.stdout
    if re.search(r'No tests found', out):
        return 'survived', 'no related tests'

    tests = re.search(r'Tests:\s+(?:(\d+) failed, )?(?:\d+ skipped, )?(?:(\d+) passed, )?(\d+) total', out)
    suites = re.search(r'Test Suites:\s+(?:(\d+) failed, )?', out)
    failed_tests = int(tests.group(1)) if tests and tests.group(1) else 0
    failed_suites = int(suites.group(1)) if suites and suites.group(1) else 0
    total = int(tests.group(3)) if tests else 0

    if failed_tests or failed_suites:
        return 'killed', f'{failed_tests} tests / {failed_suites} suites failed of {total} tests'
    if r.returncode != 0:
        return 'error', f'jest exited {r.returncode} without a failure count'
    return 'survived', f'{total} related tests passed'


def main(argv):
    check_only = '--check' in argv
    picks = {int(a) for a in argv if a.isdigit()}

    print(f'repo: {REPO}')
    print(f"{'#':>3} {'mutation':{W_LABEL}s} {'file':{W_FILE}s} result")
    print('-' * 120)
    killed = survived = skipped = errors = 0

    for number, (path, pat, rep, label) in enumerate(MUTATIONS, start=1):
        if picks and number not in picks:
            continue

        full, src, count = locate(path, pat)
        prefix = f'{number:>3} {label:{W_LABEL}s} {path:{W_FILE}s}'
        if count != 1:
            reason = 'pattern not found' if count == 0 else f'pattern matches {count} times'
            print(f'{prefix} SKIP ({reason})')
            skipped += 1
            continue

        if check_only:
            print(f'{prefix} ok (matches once)')
            continue

        try:
            open(full, 'w').write(src.replace(pat, rep, 1))
            verdict, detail = run_related(full)
        finally:
            open(full, 'w').write(src)

        if verdict == 'killed':
            print(f'{prefix} killed  ({detail})', flush=True)
            killed += 1
        elif verdict == 'survived':
            print(f'{prefix} *** SURVIVED - suite is blind *** ({detail})', flush=True)
            survived += 1
        else:
            print(f'{prefix} ERROR ({detail})', flush=True)
            errors += 1

    print('-' * 120)
    if check_only:
        print(f'patterns checked: {len(MUTATIONS) - skipped} ok, {skipped} skip')
    else:
        print(f'killed {killed}   survived {survived}   skipped {skipped}   errors {errors}')


if __name__ == '__main__':
    main(sys.argv[1:])
