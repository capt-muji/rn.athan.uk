#!/usr/bin/env python3
"""Mutation pass for the midnight countdown and sync tests: python3 ai/features/uat-2/coverage-sweep/mutants_countdown_sync.py"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

TESTS = [
    'stores/__tests__/countdownMidnight.test.ts',
    'stores/__tests__/syncUnreadableDay.test.ts',
]


def run_these_tests(_mutated_file):
    """Runs only this pass's own test files and names each test that fails

    The harness's related-tests run counts a failure in any suite, so it cannot show that these tests catch a mutant.
    The JSON result goes to a temporary directory: biome checks every JSON file in the worktree, scratch ones included.
    """
    with tempfile.TemporaryDirectory() as scratch:
        result_path = os.path.join(scratch, 'result.json')
        try:
            subprocess.run(
                ['npx', 'jest', '--silent', '--json', f'--outputFile={result_path}', *TESTS],
                cwd=mutate.REPO, capture_output=True, text=True, timeout=mutate.MUTANT_TIMEOUT_S,
            )
        except subprocess.TimeoutExpired:
            return 'killed', f'timed out after {mutate.MUTANT_TIMEOUT_S}s'
        if not os.path.exists(result_path):
            return 'error', 'jest wrote no result'
        result = json.load(open(result_path))

    failed = [test['fullName'] for suite in result['testResults'] for test in suite['assertionResults']
              if test['status'] == 'failed']
    unrun = [os.path.basename(suite['name']) for suite in result['testResults']
             if suite['status'] == 'failed' and not suite['assertionResults']]
    if failed or unrun:
        named = ''.join(f'\n      - {name}' for name in failed + [f'suite did not run: {name}' for name in unrun])
        return 'killed', f"{len(failed)} of {result['numTotalTests']} failed{named}"
    return 'survived', f"all {result['numTotalTests']} passed"


# `--related` keeps the harness's own run over every test related to the mutated file
if '--related' not in sys.argv:
    mutate.run_related = run_these_tests

mutate.MUTATIONS[:] = [
    # --- the ticker as the clock reaches a boundary ---
    ('stores/countdown.ts',
     '    if (boundary && Date.now() >= boundary.getTime()) {\n      clearCountdown(countdownKey);',
     '    if (boundary && Date.now() > boundary.getTime()) {\n      clearCountdown(countdownKey);',
     'transition waits a second past its boundary'),
    ('stores/countdown.ts',
     "      refreshSequence(type);\n      logger.debug('TICK: transition'",
     "      refreshSequence(type);\n      refreshSequence(type);\n      logger.debug('TICK: transition'",
     'a second sequence write on the transition tick'),
    ('stores/countdown.ts',
     "      refreshSequence(type);\n      logger.debug('TICK: transition'",
     "      refreshSequence(ScheduleType.Standard);\n      refreshSequence(ScheduleType.Extra);\n      logger.debug('TICK: transition'",
     "one schedule's boundary refreshes both"),
    ('stores/countdown.ts',
     '  writeDisplayCountdown(type);\n\n  startWallClockTicker(countdownKey, tick);',
     '  startWallClockTicker(countdownKey, tick);',
     'a started countdown shows nothing until the next tick'),
    ('stores/countdown.ts',
     '    const boundary = getNextBoundary(type);\n\n    if (boundary && Date.now() >= boundary.getTime()) {\n      clearCountdown(countdownKey);',
     '    const boundary = getNextPrayer(type)?.datetime ?? null;\n\n    if (boundary && Date.now() >= boundary.getTime()) {\n      clearCountdown(countdownKey);',
     'tick boundary back to next prayer only'),
    ('stores/countdown.ts',
     '    if (boundary && Date.now() >= boundary.getTime()) {\n      refreshSequence(type);',
     '    if (false) {\n      refreshSequence(type);',
     'a return skips a boundary crossed while away'),
    ('shared/time.ts',
     'return Math.max(1, Math.ceil(msLeft / 1000));',
     'return Math.max(1, Math.floor(msLeft / 1000));',
     'countdown floors the second being lived through'),
    ('shared/sequence.ts',
     'if (!isReadable(prayer) || prayer.datetime <= now) continue;',
     'if (!isReadable(prayer) || prayer.datetime < now) continue;',
     'a prayer is still next at its own instant'),

    # --- the lists either side of 00:00 ---
    ('stores/schedule.ts',
     '    return resolveDisplayDate(sequence.prayers, TimeUtils.createInstant());',
     '    return TimeUtils.getTodayDateString();',
     'list day on screen read from the wall clock'),
    ('stores/schedule.ts',
     '    if (previous && prayer.belongsToDate >= previous.belongsToDate) return true;\n    return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;',
     '    return false;',
     'a refresh keeps only rows still to come'),
    ('stores/schedule.ts',
     '    return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;',
     '    return true;',
     'a refresh keeps the finished list before'),
    ('stores/schedule.ts',
     '  if (fromStorage && fromStorage.datetime <= now) return fromStorage;\n',
     '',
     "bar's previous row never read from storage"),

    # --- a day with no readable time on screen, and the countdown while it waits ---
    ('shared/sequence.ts',
     'if (readable.length === 0 || waitsForItsEnd(prayers, date, readable)) return date;',
     'if (waitsForItsEnd(prayers, date, readable)) return date;',
     'hold removed (unreadable day skipped)'),
    ('shared/sequence.ts',
     'if (readable.length === 0 || waitsForItsEnd(prayers, date, readable)) return date;',
     'if (readable.length === 0) return date;',
     'day before an unreadable day moves on at its last row'),
    ('stores/countdown.ts',
     'if (store.get(getDisplayHeldAtom(type))) {',
     'if (false) {',
     'countdown runs to a later day while the list waits'),
    ('stores/countdown.ts',
     'name: COUNTDOWN_WAITING_NAME',
     "name: getNextPrayer(type)?.english ?? ''",
     'a waiting countdown names a later prayer'),
    ('shared/prayer.ts',
     '    prayers.push(...createPrayersForSingleDay(type, date, rawData, previousDayData));',
     '    if (!rawData) {\n      previousDayData = null;\n      continue;\n    }\n    prayers.push(...createPrayersForSingleDay(type, date, rawData, previousDayData));',
     'missing day skipped by the sequence'),
    ('shared/prayer.ts',
     '    const rawData = Database.getPrayerByDateString(date);\n',
     '    const rawData = Database.getPrayerByDateString(date) ?? previousDayData;\n',
     "a day not stored takes the day before's times"),
    ('shared/prayer.ts',
     "  if (previousDay?.date !== previousDate) return null;\n\n  const magribTime = previousDay.magrib;",
     "  const magribTime = previousDay?.date === previousDate ? previousDay.magrib : day.magrib;",
     'Magrib borrowed for a missing previous day'),

    # --- what a download stores around a day it could not give, and when it asks again ---
    ('stores/sync.ts',
     'if (!data && !isTodayGapInStoredYear()) return true;',
     'if (!data) return true;',
     'missing today re-fetched though it is a gap'),
    ('stores/sync.ts',
     '  saveDownloadedDays(prayers, armedBefore);\n  Database.markYearAsFetched(year);\n  if (trusted)',
     '  saveDownloadedDays(prayers, armedBefore);\n  if (trusted) Database.markYearAsFetched(year);\n  if (trusted)',
     'a download without today leaves its year unmarked'),
    ('api/client.ts',
     '    validatedTimes[date] = day;',
     '    if (Object.values(day).every((time) => time !== null)) validatedTimes[date] = day;',
     'a day with an unreadable time is dropped'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
