/**
 * What a prayer sequence puts on screen: the next row, which rows have passed, whose list shows,
 * when that changes, and which row the countdown bar measures from.
 *
 * A row the provider gave no readable time for (`datetime: null`) has no moment, so none of these
 * rules may place it in time. It is never next, it counts as passed by where it sits on its list, and
 * a list day made only of such rows comes on screen at 00:00 London at its start and stays until
 * 00:00 at its end instead of being skipped. Nothing here invents a moment for it.
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
 * Whether a list day with readable rows stays on screen after the last of them until 00:00 London at its end
 *
 * It does when the list day after it has no readable row, since that day comes on screen only at its own
 * start (R8, owner ruling 2026-09-14). A readable row after the day's own 00:00 hands the list over at
 * itself instead, and a following day the sequence does not hold is not waited for.
 *
 * @param readable The day's readable rows
 */
const waitsForItsEnd = (prayers: Prayer[], date: string, readable: ReadablePrayer[]): boolean => {
  const end = endOfListDay(date);
  if (readable.some((prayer) => prayer.datetime > end)) return false;

  const following = rowsOfListDay(prayers, TimeUtils.addDaysToDateString(date, 1));
  return following.length > 0 && !following.some(isReadable);
};

/**
 * The list day on screen
 *
 * The earliest list day that still has a readable row to come, which is how the list has always moved
 * on: after its last row. A list day with no readable row at all never has one, so that rule alone
 * would skip it and present the following day as today. Instead it comes on screen at 00:00 London at
 * its start, the day before keeping its place after its last row until then, and stays until 00:00 at
 * its end (R8).
 *
 * @returns The list day (YYYY-MM-DD), or null when nothing in the sequence is still to come
 */
export const resolveDisplayDate = (prayers: Prayer[], now: Date): string | null => {
  const listDays = [...new Set(prayers.map((prayer) => prayer.belongsToDate))].sort();

  for (const date of listDays) {
    const readable = rowsOfListDay(prayers, date).filter(isReadable);
    if (readable.some((prayer) => prayer.datetime > now)) return date;
    if (now >= endOfListDay(date)) continue;
    if (readable.length === 0 || waitsForItsEnd(prayers, date, readable)) return date;
  }

  return null;
};

/**
 * When a list on screen gives way at 00:00 London at its end rather than after a prayer: a list day with
 * no readable row, or one followed by such a day (waitsForItsEnd). Null when the list moves on after its
 * last readable row as usual
 *
 * No prayer is due at that moment, so without it the list would wait for the next prayer before leaving
 * a day that has already ended.
 */
export const getDisplayHoldEnd = (prayers: Prayer[], displayDate: string | null): Date | null => {
  if (!displayDate) return null;

  const readable = rowsOfListDay(prayers, displayDate).filter(isReadable);
  if (readable.length > 0 && !waitsForItsEnd(prayers, displayDate, readable)) return null;
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
 * The row the countdown bar and the "ago" badge measure from: the row just above next on its list, or,
 * for the first row of a list, the last row of the list before. Null when that row is not among `prayers`,
 * has no readable time, or does not fall before next
 *
 * Only that row, never one further up: a bar measured from an earlier prayer would span a prayer it passes
 * over and read as the wrong gap, so an unreadable Magrib leaves no bar before Isha rather than a longer one
 * from Asr, and the badge hides with it (owner ruling 2026-09-14, R14).
 *
 * @param prayers Rows to search. The caller adds the list before from storage when the sequence lacks it
 * @param next The next readable row
 */
export const findPreviousRow = (prayers: Prayer[], next: ReadablePrayer): ReadablePrayer | null => {
  const position = listPosition(next);
  const listDay = position > 0 ? next.belongsToDate : TimeUtils.getPreviousDateString(next.belongsToDate);

  let previous: Prayer | null = null;
  for (const prayer of rowsOfListDay(prayers, listDay)) {
    if (position > 0 && listPosition(prayer) >= position) continue;
    if (!previous || listPosition(prayer) > listPosition(previous)) previous = prayer;
  }

  if (!previous || !isReadable(previous) || previous.datetime >= next.datetime) return null;
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
