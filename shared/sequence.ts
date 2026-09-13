/**
 * What a prayer sequence puts on screen: the next row, which rows have passed, whose list shows,
 * when that changes, and which row the countdown bar measures from.
 *
 * A row the provider gave no readable time for (`datetime: null`) has no moment, so none of these
 * rules may place it in time. It is never next, it counts as passed by where it sits on its list, and
 * a list day made only of such rows stays on screen until 00:00 London at its end instead of being
 * skipped. Nothing here invents a moment for it.
 *
 * Pure: no React Native or MMKV imports, so the iOS widget timeline builder follows exactly the rules
 * the app's own screens do.
 *
 * @see ai/features/uat-2/DASHES-DESIGN.md
 */

import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { type Prayer, type ReadablePrayer, ScheduleType } from '@/shared/types';

/** Whether the provider gave this row a readable time */
export const isReadable = (prayer: Prayer): prayer is ReadablePrayer => prayer.datetime !== null;

/** Position on its own list, in PRAYERS_ENGLISH or EXTRAS_ENGLISH order; unknown names last */
const listPosition = (prayer: Prayer): number => {
  const names = prayer.type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  const position = names.indexOf(prayer.english);
  return position === -1 ? names.length : position;
};

const rowsOfListDay = (prayers: Prayer[], date: string): Prayer[] =>
  prayers.filter((prayer) => prayer.belongsToDate === date);

/** 00:00 London at the end of a list day */
const endOfListDay = (date: string): Date =>
  TimeUtils.createPrayerDatetime(TimeUtils.addDaysToDateString(date, 1), '00:00');

/**
 * Orders a sequence by list day, then by position on the list
 *
 * Not by moment, because an unreadable row has none. For London's readable rows the two orders agree:
 * a list's rows run in time order, and every list ends before the next begins. They can part only at
 * polar extremes (a night shorter than an hour puts Suhoor before Last Third), which is why no rule in
 * this module reads a readable row's position as its time.
 */
export const compareListOrder = (a: Prayer, b: Prayer): number => {
  if (a.belongsToDate !== b.belongsToDate) return a.belongsToDate < b.belongsToDate ? -1 : 1;
  return listPosition(a) - listPosition(b);
};

/**
 * The next row to come: the readable row with the earliest moment after now
 *
 * Searched by moment rather than by position, so the answer cannot depend on how the sequence is
 * ordered. An unreadable row is never next (R9): the highlight and the countdown pass straight over it.
 */
export const findNextReadable = (prayers: Prayer[], now: Date): ReadablePrayer | null => {
  let next: ReadablePrayer | null = null;

  for (const prayer of prayers) {
    if (!isReadable(prayer) || prayer.datetime <= now) continue;
    if (!next || prayer.datetime < next.datetime) next = prayer;
  }

  return next;
};

/**
 * The list day on screen
 *
 * The earliest list day that still has a readable row to come, which is how the list has always moved
 * on: after its last row. A list day with no readable row at all never has one, so that rule alone
 * would skip it and present the following day as today. It stays on screen instead until 00:00 London
 * at its end (R8).
 *
 * @returns The list day (YYYY-MM-DD), or null when nothing in the sequence is still to come
 */
export const resolveDisplayDate = (prayers: Prayer[], now: Date): string | null => {
  const listDays = [...new Set(prayers.map((prayer) => prayer.belongsToDate))].sort();

  for (const date of listDays) {
    const readable = rowsOfListDay(prayers, date).filter(isReadable);
    if (readable.some((prayer) => prayer.datetime > now)) return date;
    if (readable.length === 0 && now < endOfListDay(date)) return date;
  }

  return null;
};

/**
 * When a list held on screen gives way: 00:00 London at the end of a list day with no readable row, or
 * null when the list moves on after a prayer as usual
 *
 * No prayer is due at that moment, so without it the list would wait for the next prayer before leaving
 * a day that has already ended.
 */
export const getDisplayHoldEnd = (prayers: Prayer[], displayDate: string | null): Date | null => {
  if (!displayDate) return null;
  if (rowsOfListDay(prayers, displayDate).some(isReadable)) return null;
  return endOfListDay(displayDate);
};

/**
 * The next moment what is on screen changes: the next readable prayer, or the end of a held list day
 * when that comes first
 */
export const getNextBoundary = (prayers: Prayer[], now: Date): Date | null => {
  const next = findNextReadable(prayers, now);
  const holdEnd = getDisplayHoldEnd(prayers, resolveDisplayDate(prayers, now));

  if (!next) return holdEnd;
  if (holdEnd && holdEnd < next.datetime) return holdEnd;
  return next.datetime;
};

/**
 * Whether a row has passed
 *
 * A readable row passes at its moment. An unreadable row has none, so it passes by where it sits
 * (R10): once every readable row above it on its list has passed, the highlight has moved beyond it. A
 * row with no readable row above it, which includes every row of a list with none, has nothing to wait
 * for.
 *
 * @param prayers The sequence the row belongs to, which must hold the rest of the row's list
 */
export const isRowPassed = (prayers: Prayer[], row: Prayer, now: Date): boolean => {
  if (isReadable(row)) return row.datetime < now;

  return rowsOfListDay(prayers, row.belongsToDate)
    .filter((prayer) => listPosition(prayer) < listPosition(row))
    .filter(isReadable)
    .every((prayer) => prayer.datetime < now);
};

/**
 * The row the countdown bar and the "ago" badge measure from: the latest readable row before next, on
 * next's own list or the list before it
 *
 * Unreadable rows in between are passed over, so an unreadable Magrib leaves a bar from Asr to Isha. It
 * looks no further back than the list before, so a list day with no readable row cannot stretch a bar
 * across itself; there is nothing to work one out from, and the bar is hidden instead (R14).
 *
 * @param prayers Rows to search. The caller adds the list before from storage when the sequence lacks it
 * @param next The next readable row
 */
export const findPreviousReadable = (prayers: Prayer[], next: ReadablePrayer): ReadablePrayer | null => {
  const listBefore = TimeUtils.getPreviousDateString(next.belongsToDate);
  let previous: ReadablePrayer | null = null;

  for (const prayer of prayers) {
    if (!isReadable(prayer) || prayer.datetime >= next.datetime) continue;
    if (prayer.belongsToDate !== next.belongsToDate && prayer.belongsToDate !== listBefore) continue;
    if (!previous || prayer.datetime > previous.datetime) previous = prayer;
  }

  return previous;
};

/**
 * The same prayer on the earliest later list day in the sequence, readable or not
 *
 * What a tap on a passed row opens (R12). Found by list day rather than by moment, so an unreadable row
 * still has one, and an unreadable occurrence is still what opens.
 */
export const findNextOccurrence = (prayers: Prayer[], row: Prayer): Prayer | null => {
  let occurrence: Prayer | null = null;

  for (const prayer of prayers) {
    if (prayer.english !== row.english || prayer.belongsToDate <= row.belongsToDate) continue;
    if (!occurrence || prayer.belongsToDate < occurrence.belongsToDate) occurrence = prayer;
  }

  return occurrence;
};
