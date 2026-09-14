#!/usr/bin/env python3
"""Mutation pass for the alarm tests: python3 ai/features/uat-2/coverage-sweep/mutants_alarms.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- the skip rules ---
    ('stores/notifications.ts', 'if (prayer.datetime <= TimeUtils.createInstant()) {', 'if (prayer.datetime < TimeUtils.createInstant()) {', 'at-time armed when now equals its instant'),
    ('stores/notifications.ts', 'if (prayer.datetime <= TimeUtils.createInstant()) {', 'if (false) {', 'past at-time rows armed'),
    ('stores/notifications.ts', 'if (prayer.datetime <= TimeUtils.createInstant()) {', 'if (`${TimeUtils.formatDateShort(prayer.datetime)} ${prayer.time}` <= `${TimeUtils.getTodayDateString()} ${TimeUtils.formatPrayerTime(TimeUtils.createInstant())}`) {', 'at-time skip read off the wall clock'),
    ('stores/notifications.ts', 'if (secondsUntilReminder < REMINDER_BUFFER_SECONDS) {', 'if (secondsUntilReminder <= REMINDER_BUFFER_SECONDS) {', 'reminder buffer boundary < -> <='),
    ('stores/notifications.ts', 'if (secondsUntilReminder < REMINDER_BUFFER_SECONDS) {', 'if (secondsUntilReminder < 0) {', 'reminder armed inside the 30 s buffer'),
    ('stores/notifications.ts', 'const reminderDateTime = subMinutes(prayer.datetime, intervalMinutes);', 'const reminderDateTime = TimeUtils.createPrayerDatetime(TimeUtils.formatDateShort(prayer.datetime), TimeUtils.adjustTime(prayer.time, -intervalMinutes));', 'reminder skip counted on the clock face'),

    # --- the window ---
    ('shared/notifications.ts', 'NOTIFICATION_ROLLING_DAYS + (isEveningBeforeRow ? 1 : 0)', 'NOTIFICATION_ROLLING_DAYS', 'night rows lose their extra day'),
    ('shared/notifications.ts', 'TimeUtils.addDaysToDateString(today, i)', 'TimeUtils.addDaysToDateString(today, i - 1)', 'window starts a list day early'),
    ('shared/time.ts', 'export const getTodayDateString = (): string => formatDateShort(new Date());', 'export const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);', 'list days counted from the UTC date'),

    # --- instants around the clock changes ---
    ('shared/time.ts', 'if (offsetBefore === offsetAfter) return new Date(reading - offsetBefore);', 'return new Date(reading - offsetBefore);', 'a reading near a change takes the earlier offset'),
    ('shared/time.ts', 'const length = createPrayerDatetime(date, fajrTime).getTime() - start;', 'const length = createPrayerDatetime(previousDate, fajrTime).getTime() + 86_400_000 - start;', 'night length counted on the clock face'),
    ('shared/time.ts', '(length * 2) / 3', '(length * 2) / 3.01', 'last third drift'),
    ('device/notifications.ts', 'const triggerDate = subMinutes(prayer.datetime, intervalMinutes);', "const triggerDate = require('@/shared/time').createPrayerDatetime(require('@/shared/time').formatDateShort(prayer.datetime), require('@/shared/time').adjustTime(time, -intervalMinutes));", 'reminder trigger counted on the clock face'),
    ('device/notifications.ts', 'const triggerDate = subMinutes(prayer.datetime, intervalMinutes);', 'const triggerDate = subMinutes(prayer.datetime, 30);', 'reminder interval ignored'),
    ('device/notifications.ts', 'const triggerDate = subMinutes(prayer.datetime, intervalMinutes);', 'const triggerDate = prayer.datetime;', 'reminder fires at the prayer itself'),

    # --- rows either side of 00:00 and 06:00 ---
    ('shared/prayer.ts', 'hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR', 'hours <= ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR', 'small-hours cutoff < -> <='),
    ('shared/prayer.ts', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)', "prayerName === 'Isha' && isSmallHours(hours)", 'drop Magrib from the date shift'),
    ('shared/prayer.ts', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && hours === 0', 'only the 00:xx hour moves to the next day'),
    ('shared/prayer.ts', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)', 'MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && (isSmallHours(hours) || hours === 23)', 'hour 23 moves to the next day too'),
    ('shared/constants.ts', "export const MIDNIGHT_CROSSING_PRAYERS: string[] = ['Isha', 'Magrib'];", "export const MIDNIGHT_CROSSING_PRAYERS: string[] = ['Isha', 'Magrib', 'Fajr'];", 'Fajr moves to the next day like Isha'),

    # --- identifiers ---
    ('device/notifications.ts', 'const identifier = prayerNotificationIdentifier(scheduleType, englishName, date);', "const identifier = prayerNotificationIdentifier(scheduleType, englishName, require('@/shared/time').formatDateShort(prayer.datetime));", "at-time identifier from the instant's date"),
    ('device/notifications.ts', 'const identifier = reminderNotificationIdentifier(scheduleType, englishName, date, intervalMinutes);', "const identifier = reminderNotificationIdentifier(scheduleType, englishName, require('@/shared/time').formatDateShort(prayer.datetime), intervalMinutes);", "reminder identifier from the instant's date"),

    # --- Friday Istijaba ---
    ('shared/prayer.ts', 'getPrayerNamesForDate(type, date);', 'getPrayerNamesForDate(type, rawData && getIstijabaTime(rawData, date) ? TimeUtils.formatDateShort(getIstijabaTime(rawData, date) as Date) : date);', "Friday read from Istijaba's own instant"),
    ('shared/prayer.ts', 'if (!TimeUtils.isFriday(date)) {', 'if (!TimeUtils.isFriday()) {', 'Friday read from today, not the list day'),

    # --- 00:00 itself ---
    ('stores/countdown.ts', "      refreshSequence(type);\n      logger.debug('TICK: transition'", "      refreshSequence(type);\n      require('@/stores/notifications').rescheduleAllNotifications();\n      logger.debug('TICK: transition'", 'the ticker reschedules when a boundary passes'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
