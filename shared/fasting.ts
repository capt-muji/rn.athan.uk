/**
 * The fasting-day predicate: which calendar days carry a Sahur alert, and why
 *
 * Four modes drive the Sahur row's scheduling: every day, the Mondays and
 * Thursdays the Prophet (peace be upon him) was keen to fast, the alternate
 * days of Dawood's fast, and the three white days of each Hijri month, with
 * the white days stackable on the two regimen modes (Abu Dawud 2449; Bukhari
 * 1977, 1131; Muslim 1159; Nasa'i 2361 - the ticket's research reports carry
 * the citations). Ramadan subsumes every regimen: each of its days arms.
 *
 * Purity contract: no function here reads the clock, the store or isRamadan
 * (which reads the real clock and includes the Sha'ban decoration window).
 * Everything time-bearing is injected, so the suite runs on fixed dates.
 *
 * The Hijri source is the same engine the app already displays through:
 * Intl.DateTimeFormat with ca-islamic-umalqura over PRAYER_TIMEZONE
 * (shared/time.ts formatHijriDateLocalized, footerFor). Display and arming
 * therefore agree by construction: the white day the app shows is the white
 * day it arms. A failed conversion reads as no Hijri designation, so weekday
 * and cycle modes keep arming when the calendar read fails.
 */

import { PRAYER_TIMEZONE } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';

/** The Sahur row's scheduling modes, in picker order */
export type FastingMode = 'everyDay' | 'muhammad' | 'dawood' | 'whiteDays';

/** The closed mode union, in picker order */
export const FASTING_MODES = ['everyDay', 'muhammad', 'dawood', 'whiteDays'] as const satisfies readonly FastingMode[];

/** A fresh install arms Sahur every day, exactly as the app always has */
export const DEFAULT_FASTING_MODE: FastingMode = 'everyDay';

/** The white days: the 13th, 14th and 15th of each Hijri month */
export const WHITE_DAY_FROM = 13;
export const WHITE_DAY_TO = 15;

/** Ramadan, the ninth Hijri month, where every day arms regardless of mode */
const RAMADAN_MONTH = 9;

/** The Hijri day adjustment's legal range, the convention the market ships */
export const HIJRI_ADJUSTMENTS = [-2, -1, 0, 1, 2] as const;
export const DEFAULT_HIJRI_ADJUSTMENT = 0;

/** The designations a day can carry, in badge order */
export const FASTING_DESIGNATIONS = ['muhammad', 'dawood', 'whiteDay', 'ramadan'] as const;
export type FastingDesignation = (typeof FASTING_DESIGNATIONS)[number];

/** One settings snapshot, read from the four fasting preference atoms */
export interface FastingSettings {
  mode: FastingMode;
  /** Offered with muhammad and dawood only; ignored elsewhere */
  whiteDaysAddOn: boolean;
  hijriAdjustment: number;
  /** Epoch ms of the latest Dawood enablement; 0 = no cycle */
  dawoodAnchorMs: number;
}

/** One candidate day's verdict */
export interface FastingDay {
  arms: boolean;
  designations: FastingDesignation[];
}

/** The suhoor trigger instant for a list day, null when the day has no readable row */
export type SuhoorInstantFor = (date: string) => Date | null;

// =============================================================================
// HIJRI
// =============================================================================

/** Month and day per (adjustment, date), the dayOffsets memo precedent: the
 * arming path asks for a whole candidate window, so the memo carries the cost
 * and a formatter is built only on a cache miss */
const hijriMemo = new Map<string, { month: number; day: number } | null>();

/**
 * The Hijri month and day of a calendar date, shifted by the user's adjustment.
 *
 * The adjustment moves the Gregorian date fed to the engine, the convention
 * every major app ships for reconciling a calculated calendar with a local
 * sighting. Null when the conversion yields nothing readable: the caller
 * treats that as no Hijri designation, never as a crash.
 *
 * @param date Calendar date in YYYY-MM-DD format
 * @param adjustment Whole days, -2 to 2
 */
export const hijriPartsFor = (date: string, adjustment: number): { month: number; day: number } | null => {
  const memoKey = `${adjustment}:${date}`;
  if (hijriMemo.has(memoKey)) return hijriMemo.get(memoKey) ?? null;

  let parts: { month: number; day: number } | null = null;
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    const converted = adjustment === 0 ? date : TimeUtils.addDaysToDateString(date, adjustment);
    const raw = formatter.formatToParts(TimeUtils.getDayAnchor(converted));
    const month = Number(raw.find((part) => part.type === 'month')?.value);
    const day = Number(raw.find((part) => part.type === 'day')?.value);
    parts = Number.isFinite(month) && Number.isFinite(day) ? { month, day } : null;
  } catch {
    parts = null;
  }

  hijriMemo.set(memoKey, parts);
  return parts;
};

/** Whether the date is one of the month's white days */
export const isWhiteDay = (date: string, adjustment: number): boolean => {
  const parts = hijriPartsFor(date, adjustment);
  return parts !== null && parts.day >= WHITE_DAY_FROM && parts.day <= WHITE_DAY_TO;
};

/** Whether the date falls in Ramadan, per the same conversion the display uses */
export const isRamadanDay = (date: string, adjustment: number): boolean =>
  hijriPartsFor(date, adjustment)?.month === RAMADAN_MONTH;

// =============================================================================
// WEEKDAY
// =============================================================================

/** The weekday of a calendar date on the JS numbering (0 Sunday to 6 Saturday) */
const weekday = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Whether the date is a Monday or a Thursday */
export const isMuhammadDay = (date: string): boolean => [1, 4].includes(weekday(date));

// =============================================================================
// THE DAWOOD CYCLE
// =============================================================================

/** How far a cycle may search for its first on day before giving up */
export const DAWOOD_SEARCH_LIMIT_DAYS = 40;

/** Whole days between two calendar dates */
const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/** A resolved Dawood cycle: the day the alternation counts from */
export interface DawoodCycle {
  firstOnDay: string | null;
}

/**
 * The cycle an anchor instant starts.
 *
 * The first on day is the first day whose suhoor trigger is strictly ahead of
 * the anchor, whether that trigger sits an hour or a day away. A day with no
 * readable row has no trigger and is passed over. No anchor means no cycle.
 *
 * @param anchorMs Epoch ms of the latest Dawood enablement
 * @param suhoorFor The row's own trigger instant per list day
 */
export const dawoodCycleFor = (anchorMs: number, suhoorFor: SuhoorInstantFor): DawoodCycle => {
  if (anchorMs <= 0) return { firstOnDay: null };

  let date = TimeUtils.formatDateShort(new Date(anchorMs));
  for (let step = 0; step < DAWOOD_SEARCH_LIMIT_DAYS; step += 1) {
    const trigger = suhoorFor(date);
    if (trigger !== null && trigger.getTime() > anchorMs) return { firstOnDay: date };
    date = TimeUtils.addDaysToDateString(date, 1);
  }
  return { firstOnDay: null };
};

/** Whether a date is an on day of the cycle: even day-distance from the start */
export const isDawoodDay = (date: string, cycle: DawoodCycle): boolean => {
  if (cycle.firstOnDay === null) return false;
  const distance = daysBetween(cycle.firstOnDay, date);
  return distance >= 0 && distance % 2 === 0;
};

// =============================================================================
// THE VERDICT
// =============================================================================

/** Whether the settings ask for the white days at all */
const whiteDaysActive = (snapshot: FastingSettings): boolean =>
  snapshot.mode === 'whiteDays' ||
  (snapshot.whiteDaysAddOn && (snapshot.mode === 'muhammad' || snapshot.mode === 'dawood'));

/**
 * One day's verdict under a settings snapshot.
 *
 * Ramadan comes first and alone: the obligatory fast subsumes every regimen,
 * so each of its days arms with the single badge.
 */
const dayVerdict = (date: string, snapshot: FastingSettings, cycle: DawoodCycle | null): FastingDay => {
  if (isRamadanDay(date, snapshot.hijriAdjustment)) return { arms: true, designations: ['ramadan'] };

  const designations: FastingDesignation[] = [];
  if (snapshot.mode === 'muhammad' && isMuhammadDay(date)) designations.push('muhammad');
  if (cycle !== null && isDawoodDay(date, cycle)) designations.push('dawood');
  if (whiteDaysActive(snapshot) && isWhiteDay(date, snapshot.hijriAdjustment)) designations.push('whiteDay');

  return { arms: snapshot.mode === 'everyDay' || designations.length > 0, designations };
};

/**
 * A per-day verdict function for one settings snapshot, resolving the Dawood
 * cycle once so a whole candidate window costs one cycle search.
 *
 * @param snapshot The settings the pass runs under
 * @param suhoorFor The row's own trigger instant per list day
 */
export const fastingEvaluator = (snapshot: FastingSettings, suhoorFor: SuhoorInstantFor) => {
  const cycle = snapshot.mode === 'dawood' ? dawoodCycleFor(snapshot.dawoodAnchorMs, suhoorFor) : null;
  return (date: string): FastingDay => dayVerdict(date, snapshot, cycle);
};

// =============================================================================
// THE ANCHOR TRANSITIONS
// =============================================================================

/** What the commit path needs to know about one state of the Sahur row */
export interface FastingActivation {
  bellOn: boolean;
  mode: FastingMode;
}

/**
 * Whether a change newly activates Dawood, the one moment an anchor is written:
 * the bell coming on onto dawood, or the mode moving to dawood while the bell
 * is on. Staying active activates nothing; the bell or the mode alone is not a
 * cycle starting.
 */
export const dawoodActivates = (previous: FastingActivation, next: FastingActivation): boolean =>
  next.bellOn && next.mode === 'dawood' && !(previous.bellOn && previous.mode === 'dawood');

// =============================================================================
// STORAGE VALIDATORS
// =============================================================================

/** A stored mode string, or the default when it names no mode */
export const validFastingMode = (value: string): FastingMode =>
  (FASTING_MODES as readonly string[]).includes(value) ? (value as FastingMode) : DEFAULT_FASTING_MODE;

/** A stored adjustment, or zero when it sits outside the legal range */
export const validHijriAdjustment = (value: number): number =>
  (HIJRI_ADJUSTMENTS as readonly number[]).includes(value) ? value : DEFAULT_HIJRI_ADJUSTMENT;

// =============================================================================
// THE PREVIEW
// =============================================================================

/** How far the preview may walk before giving up on finding armed days */
export const UPCOMING_SEARCH_LIMIT_DAYS = 400;

/** One armed day of the preview */
export interface UpcomingFastingDay {
  date: string;
  verdict: FastingDay;
}

/**
 * The next armed days from a date (inclusive), in calendar order.
 *
 * The sheet preview's data: under everyDay and inside Ramadan every day arms,
 * so the walk returns consecutive days; the sparse modes return their own.
 *
 * @param fromDate The first calendar date that may appear, YYYY-MM-DD
 * @param count How many armed days to gather
 */
export const upcomingFastingDays = (
  fromDate: string,
  count: number,
  snapshot: FastingSettings,
  suhoorFor: SuhoorInstantFor
): UpcomingFastingDay[] => {
  const verdictFor = fastingEvaluator(snapshot, suhoorFor);
  const days: UpcomingFastingDay[] = [];

  let date = fromDate;
  for (let step = 0; step < UPCOMING_SEARCH_LIMIT_DAYS && days.length < count; step += 1) {
    const verdict = verdictFor(date);
    if (verdict.arms) days.push({ date, verdict });
    date = TimeUtils.addDaysToDateString(date, 1);
  }

  return days;
};
