/**
 * The round-9 fasting model (T-623): the two new surfaces' shared brain. The
 * locked take-3 card stays pixel-identical (r8's take 3 rides in), and this
 * module adds what round 9 needs:
 *   - the selection-to-settings mapping and the next-Sahur trigger walk over
 *     the real fasting model (shared/fasting.ts) and the real timetable rows,
 *     injected with `now` so nothing reads the clock,
 *   - the label copy for the automation indicators and the trigger sections,
 *     hoisted per the string-guard law, Suhoor spelled the app's way in all
 *     NEW copy (the locked card's own copy is round 8's, untouched),
 *   - the armed-mode derivation both surfaces share.
 * Dev-only: nothing shipped imports here.
 */

import type { PrayerId } from '@/shared/constants';
import { type FastingDay, type FastingDesignation, type FastingSettings, upcomingFastingDays } from '@/shared/fasting';
import * as PrayerUtils from '@/shared/prayer';
import { isReadable } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type FastingMode, ScheduleType } from '@/shared/types';

import type { R2Selection } from '../r2/model';

export type R9Design = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | number;

// ---------------------------------------------------------------------------
// Armed modes: what a selection arms, the one fact both surfaces render
// ---------------------------------------------------------------------------

export interface R9Armed {
  readonly muhammad: boolean;
  readonly dawood: boolean;
  readonly white: boolean;
}

/** Whether the selection is anything but Every day: the indicator's own gate */
export const r9Automated = (selection: R2Selection): boolean => selection.mode !== 'every';

export const r9ArmedFor = (selection: R2Selection): R9Armed => ({
  muhammad: selection.mode === 'muhammad',
  dawood: selection.mode === 'dawood',
  white: selection.white && selection.mode !== 'every',
});

// ---------------------------------------------------------------------------
// The next-Sahur walk: the real fasting evaluator over the real timetable
// ---------------------------------------------------------------------------

export interface R9Trigger {
  /** The list day the Sahur row belongs to (YYYY-MM-DD) */
  readonly date: string;
  /** The trigger instant */
  readonly at: Date;
  /** The row's wall time (HH:MM), the app's own display format source */
  readonly time: string;
  /** Why the day arms */
  readonly designations: readonly FastingDesignation[];
}

export const r9SettingsFor = (selection: R2Selection, nowMs: number): FastingSettings => {
  const mode: FastingMode =
    selection.mode === 'every' ? 'everyDay' : selection.mode === null ? 'whiteDays' : selection.mode;
  return {
    mode,
    whiteDaysAddOn: selection.white && selection.mode !== 'every' && selection.mode !== null,
    dawoodAnchorMs: selection.mode === 'dawood' ? nowMs : 0,
  };
};

/** The suhoor row of one list day, null when the day has no readable row */
export const r9SuhoorAt = (date: string): { at: Date; time: string } | null => {
  const prayer = PrayerUtils.getPrayerForDate(ScheduleType.Extra, SUHOOR_ID, date);
  return prayer !== null && isReadable(prayer) && prayer.datetime !== null
    ? { at: prayer.datetime, time: prayer.time }
    : null;
};

/** How many future triggers the sections show by default */
export const R9_TRIGGER_COUNT = 4;

/**
 * The next triggers for one selection, soonest first, each strictly ahead of
 * `now`. The walk runs the real evaluator (shared/fasting.ts) from today, so
 * a trigger on today's list still counts while its instant is ahead.
 */
export const r9TriggersWith = (
  selection: R2Selection,
  now: Date,
  count: number,
  suhoorAt: (date: string) => { at: Date; time: string } | null
): R9Trigger[] => {
  const settings = r9SettingsFor(selection, now.getTime());
  const today = TimeUtils.formatDateShort(now);
  const days: { date: string; verdict: FastingDay }[] = upcomingFastingDays(
    today,
    count + SEARCH_PAD,
    settings,
    (date) => suhoorAt(date)?.at ?? null
  );

  const triggers: R9Trigger[] = [];
  for (const day of days) {
    const row = suhoorAt(day.date);
    if (row === null || row.at.getTime() <= now.getTime()) continue;
    triggers.push({ date: day.date, at: row.at, time: row.time, designations: day.verdict.designations });
    if (triggers.length >= count) break;
  }
  return triggers;
};

/** The harness entry: the real timetable rows */
export const r9Triggers = (selection: R2Selection, now: Date, count: number = R9_TRIGGER_COUNT): R9Trigger[] =>
  r9TriggersWith(selection, now, count, r9SuhoorAt);

/** Extra candidate days so the past-today rows never starve the window */
const SEARCH_PAD = 4;

const SUHOOR_ID: PrayerId = 'suhoor';

// ---------------------------------------------------------------------------
// Display formatting: the app's own time format, computed labels
// ---------------------------------------------------------------------------

/** The wall time in the app's display format (12h by default, the harness fixes 12h) */
export const r9TimeLabel = (time: string): string => TimeUtils.formatDisplayTime(time, false);

/** The weekday-day-month label of a list day, London time like the app's own day label */
export const r9DayLabel = (date: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(`${date}T12:00:00`));

/** The compact day label: weekday short + day number only */
export const r9ShortDayLabel = (date: string): string =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'Europe/London' }).format(
    new Date(`${date}T12:00:00`)
  );

/** The relative distance to a trigger, the app's spoken cadence */
export const r9Relative = (at: Date, now: Date): string => {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 2) return RELATIVE_NOW;
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
  const days = Math.round(minutes / 1440);
  if (days === 1) return RELATIVE_TOMORROW;
  return `in ${days} days`;
};

/** Days and hours until a trigger, the countdown archetypes' parts */
export const r9CountdownParts = (at: Date, now: Date): { days: number; hours: number; minutes: number } => {
  const total = Math.max(0, Math.round((at.getTime() - now.getTime()) / 60_000));
  return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
};

const RELATIVE_NOW = 'in a few minutes';
const RELATIVE_TOMORROW = 'tomorrow';

// ---------------------------------------------------------------------------
// Copy: every visible literal, hoisted. NEW copy spells Suhoor the app's way
// ---------------------------------------------------------------------------

/** The indicator's short mode marks */
export const MARK_MUHAMMAD = 'M';
export const MARK_DAWOOD = 'D';
export const MARK_WHITE = 'W';

/** The joined mark when one badge speaks for the whole selection */
export const r9JoinedMark = (armed: R9Armed): string =>
  [armed.muhammad ? MARK_MUHAMMAD : '', armed.dawood ? MARK_DAWOOD : '', armed.white ? MARK_WHITE : '']
    .filter(Boolean)
    .join('+');

/** How many regimens the selection arms, the counter archetypes' number */
export const r9ArmedCount = (armed: R9Armed): number =>
  Number(armed.muhammad) + Number(armed.dawood) + Number(armed.white);

/** The pill's short regimen label */
export const r9PillLabel = (armed: R9Armed): string => {
  const parts: string[] = [];
  if (armed.muhammad) parts.push(PILL_MUHAMMAD);
  if (armed.dawood) parts.push(PILL_DAWOOD);
  if (armed.white) parts.push(PILL_WHITE);
  return parts.join(' + ');
};

const PILL_MUHAMMAD = 'Mon/Thu';
const PILL_DAWOOD = 'Alt days';
const PILL_WHITE = 'White days';

/** The trigger sections' small heading */
export const TRIGGER_HEADING = 'NEXT SUHOOR';

/** The schedule rows' leading word for the soonest trigger */
export const TRIGGER_NEXT_WORD = 'Next';

/** The schedule's empty-day fallback (no readable rows ahead) */
export const TRIGGER_NONE = 'No upcoming Suhoor rows';

/** The week bar's day letters, Monday first */
export const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** The week bar's unique cell keys, Monday first */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** The harness strips' label prefix, hoisted for the string guard */
export const STRIP_LABEL_PREFIX = 'R9';

/** The layer attribute value, hoisted for the string guard */
export const POINTER_NONE = 'none';

/** The week bar's caption */
export const WEEK_CAPTION = 'Armed weekdays';

/** The dot strip's caption */
export const STRIP_CAPTION = 'Coming days';

/** The table's time column heading */
export const TABLE_TIME_HEAD = 'At';

/** The table's day column heading */
export const TABLE_DAY_HEAD = 'Day';

/** The ring's centre label */
export const RING_LABEL = 'next';

/** The stacked cards' label */
export const STACK_LABEL = 'then';

/** The timeline's end label */
export const TIMELINE_LATER = 'later';

/** The timeline's start label */
export const TIMELINE_NOW = 'now';
