#!/usr/bin/env python3
"""Mutation pass for the list and clock-reading tests: python3 ai/features/uat-2/coverage-sweep/mutants_lists_clock.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- a Standard row either side of 00:00 and at 06:00 ---
    ('shared/prayer.ts',
     'const isSmallHours = (hours: number): boolean => hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR;',
     'const isSmallHours = (hours: number): boolean => hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR || hours === 23;',
     'hour 23 read as the small hours'),
    ('shared/prayer.ts',
     'const isSmallHours = (hours: number): boolean => hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR;',
     'const isSmallHours = (hours: number): boolean => hours > 0 && hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR;',
     'hour 0 not read as the small hours'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && hours <= ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR',
     'moment shift also takes 06:00'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR - 1',
     'moment shift stops at 05:00'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && isSmallHours(hours)',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && hours <= ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR',
     'list-day shift also takes 06:00'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && isSmallHours(hours)',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR - 1',
     'list-day shift stops at 05:00'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)',
     "prayerName === 'Isha' && isSmallHours(hours)",
     'Magrib dropped from the moment shift'),
    ('shared/prayer.ts',
     'MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && isSmallHours(hours)',
     "prayerEnglish === 'Isha' && isSmallHours(hours)",
     'Magrib dropped from the list-day shift'),
    ('shared/prayer.ts',
     'return TimeUtils.addDaysToDateString(date, 1);',
     'return date;',
     'moment shift removed (list-day shift alone)'),
    ('shared/prayer.ts',
     'return TimeUtils.getPreviousDateString(calendarDate);',
     'return calendarDate;',
     'list-day shift removed (moment shift alone)'),

    # --- Fajr near 00:00 ---
    ('shared/prayer.ts',
     'isStandard && MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)',
     'isStandard && isSmallHours(hours)',
     'name gate dropped: Fajr joins the moment shift'),
    ('shared/prayer.ts',
     'type === ScheduleType.Standard && MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && isSmallHours(hours)',
     'type === ScheduleType.Standard && isSmallHours(hours)',
     'name gate dropped: Fajr joins the list-day shift'),

    # --- Extras night rows either side of 00:00 ---
    ('shared/prayer.ts',
     'return { ...unreadable, datetime: rowInstant, time: TimeUtils.formatPrayerTime(rowInstant) };',
     'return { ...unreadable, belongsToDate: TimeUtils.formatDateShort(rowInstant), datetime: rowInstant, time: TimeUtils.formatPrayerTime(rowInstant) };',
     "night row filed by its moment's calendar day"),
    ('shared/prayer.ts',
     'const magribTime = previousDay.magrib;',
     'const magribTime = day.magrib;',
     "night starts at the list day's own Magrib"),
    ('shared/prayer.ts',
     'const previousDate = TimeUtils.getPreviousDateString(date);',
     'const previousDate = date;',
     'alarm path reads the list day as the day before'),
    ('shared/time.ts',
     'midnight: floorToMinute(start + length / 2),',
     'midnight: new Date(Math.round((start + length / 2) / MINUTE_MS) * MINUTE_MS),',
     'Midnight rounded to the minute, not floored'),
    ('shared/time.ts',
     '(length * 2) / 3',
     'length / 3',
     'Last Third a third of the night, not two'),

    # --- a morning Suhoor on its own day ---
    ('shared/prayer.ts',
     'NIGHT_PRAYER_NAMES.includes(prayerEnglish as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 12',
     'NIGHT_PRAYER_NAMES.includes(prayerEnglish as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 5',
     'noon rule moved to 05:00 (morning Suhoor)'),

    # --- clock readings on the clock-change days ---
    ('shared/time.ts',
     '  // A reading the clocks skip over\n  return new Date(reading - offsetAfter);',
     '  // A reading the clocks skip over\n  return new Date(reading - offsetBefore);',
     'skipped reading takes the pre-change offset'),
    ('shared/time.ts',
     '  if (holds(offsetAfter)) return new Date(reading - offsetAfter);\n  if (holds(offsetBefore)) return new Date(reading - offsetBefore);',
     '  if (holds(offsetBefore)) return new Date(reading - offsetBefore);\n  if (holds(offsetAfter)) return new Date(reading - offsetAfter);',
     'repeated reading takes the earlier pass'),
    ('shared/time.ts',
     'if (offsetBefore === offsetAfter) return new Date(reading - offsetBefore);',
     'if (true) return new Date(reading - offsetBefore);',
     'clock change within half a day ignored'),
    ('shared/time.ts',
     'dayOffset = first === last ? first : null;',
     'dayOffset = first;',
     'clock-change day read at its first offset'),
    ('shared/time.ts',
     'const quarterHour = Math.floor(instant / QUARTER_HOUR_MS);',
     'const quarterHour = Math.round(instant / QUARTER_HOUR_MS);',
     'offset read at the nearest quarter hour'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
