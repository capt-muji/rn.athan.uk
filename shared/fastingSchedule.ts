/**
 * The fasting schedule walks (design 427): the next Suhoor triggers and the
 * ten-day calendar over the real fasting evaluator and the baked timetable's
 * rows. Every instant is injected - `now` and the Dawood anchor arrive as
 * arguments - so nothing here reads the clock and the suites run on fixed
 * dates.
 */

import {
  type FastingDay,
  type FastingDesignation,
  type FastingSettings,
  fastingEvaluator,
  upcomingFastingDays,
} from '@/shared/fasting';
import type { TranslationKey } from '@/shared/i18n';
import * as TimeUtils from '@/shared/time';
import type { FastingSelection } from '@/shared/types';

/** What one day's marks carry: the identity of each regimen that arms it */
export type FastingIdentity = 'green' | 'cyan' | 'white';

const DESIGNATION_IDENTITY: Partial<Record<FastingDesignation, FastingIdentity>> = {
  muhammad: 'green',
  dawood: 'cyan',
  whiteDay: 'white',
};

/** The identities one day's designations carry, in the designations' order (each regimen names at most one) */
export const fastingIdentitiesFor = (designations: readonly FastingDesignation[]): FastingIdentity[] => {
  const identities: FastingIdentity[] = [];
  for (const designation of designations) {
    const identity = DESIGNATION_IDENTITY[designation];
    if (identity !== undefined) identities.push(identity);
  }
  return identities;
};

/** Whether a day's identity list names a cluster: one mark or a mark beside the white days */
export const hasFastingIdentities = (
  identities: readonly FastingIdentity[]
): identities is readonly [FastingIdentity, ...FastingIdentity[]] => identities.length > 0;

/** The identities the selection arms, in regimen order (Muhammad, Dawood, white) */
export const armedFastingIdentities = (selection: FastingSelection): FastingIdentity[] => {
  const identities: FastingIdentity[] = [];
  if (selection.mode === 'muhammad') identities.push('green');
  if (selection.mode === 'dawood') identities.push('cyan');
  if (selection.mode === 'whiteDays' || selection.whiteDaysAddOn) identities.push('white');
  return identities;
};

/**
 * The settings the selection drafts: the sheet's own mode and add-on, with the
 * Dawood cycle anchored by the stored anchor or by `nowMs` when none is stored
 * yet (where the commit's own enablement anchors anyway).
 */
export const fastingSettingsFor = (selection: FastingSelection, nowMs: number, anchorMs: number): FastingSettings => ({
  mode: selection.mode,
  whiteDaysAddOn: selection.whiteDaysAddOn,
  dawoodAnchorMs: selection.mode === 'dawood' ? (anchorMs > 0 ? anchorMs : nowMs) : 0,
});

/** One upcoming Suhoor: its list day, its trigger instant, its wall time, why it arms */
export interface FastingTrigger {
  readonly date: string;
  readonly at: Date;
  readonly time: string;
  readonly designations: readonly FastingDesignation[];
}

/** Extra candidate days so rows already spent today never starve the window */
const SEARCH_PAD = 4;

/**
 * The next triggers for one selection, soonest first, each strictly ahead of
 * `now`. The walk rides the real evaluator from today, so a trigger on today's
 * list still counts while its instant is ahead.
 */
export const nextFastingTriggers = (
  settings: FastingSettings,
  now: Date,
  count: number,
  suhoorAt: (date: string) => { at: Date; time: string } | null
): FastingTrigger[] => {
  const today = TimeUtils.formatDateShort(now);
  const days = upcomingFastingDays(today, count + SEARCH_PAD, settings, (date) => suhoorAt(date)?.at ?? null);

  const triggers: FastingTrigger[] = [];
  for (const day of days) {
    const row = suhoorAt(day.date);
    if (row === null || row.at.getTime() <= now.getTime()) continue;
    triggers.push({ date: day.date, at: row.at, time: row.time, designations: day.verdict.designations });
    if (triggers.length >= count) break;
  }
  return triggers;
};

/** How many upcoming triggers the card's entries show */
export const FASTING_ENTRY_COUNT = 2;

/** One calendar day: whether it arms and why */
export interface FastingCalendarDay {
  readonly date: string;
  readonly arms: boolean;
  readonly designations: readonly FastingDesignation[];
}

/** How many days the card's strip carries, today first */
export const FASTING_CALENDAR_DAYS = 10;

/** The next `count` days from `now`'s day, today first, each with its verdict */
export const fastingCalendarDays = (
  settings: FastingSettings,
  now: Date,
  count: number,
  suhoorAt: (date: string) => { at: Date; time: string } | null
): FastingCalendarDay[] => {
  const verdictFor = fastingEvaluator(settings, (date) => suhoorAt(date)?.at ?? null);

  const days: FastingCalendarDay[] = [];
  let date = TimeUtils.formatDateShort(now);
  for (let step = 0; step < count; step += 1) {
    const verdict: FastingDay = verdictFor(date);
    days.push({ date, arms: verdict.arms, designations: verdict.designations });
    date = TimeUtils.addDaysToDateString(date, 1);
  }
  return days;
};

/** The distance to a trigger the entry speaks: hours under a day, days above it */
export type FastingRelative = { readonly hours: number } | { readonly days: number };

export const fastingRelative = (at: Date, now: Date): FastingRelative => {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 1440) return { hours: Math.max(1, Math.round(minutes / 60)) };
  return { days: Math.max(1, Math.round(minutes / 1440)) };
};

// The weekday name composes from the calendar's own translated keys, ISO-numbered
// Monday 1 to Sunday 7 (the formatDateLocalized precedent)
const WEEKDAY_KEYS = [
  'calendar.weekdayShort.1',
  'calendar.weekdayShort.2',
  'calendar.weekdayShort.3',
  'calendar.weekdayShort.4',
  'calendar.weekdayShort.5',
  'calendar.weekdayShort.6',
  'calendar.weekdayShort.7',
] as const satisfies readonly TranslationKey[];

/** The weekday key of a list day, for the days-distance entry's trailing name */
export const fastingWeekdayKey = (date: string): TranslationKey => {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(year, month - 1, day, 12).getDay();
  return WEEKDAY_KEYS[(weekday === 0 ? 7 : weekday) - 1];
};
