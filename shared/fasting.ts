/**
 * The fasting-day predicate: which calendar days carry a Sahur alert, and why.
 *
 * Ramadan subsumes every regimen: each of its days arms. Everything else is
 * injected (no clock, no store, never isRamadan, which reads the real clock),
 * so the suite runs on fixed dates. Hijri comes from the same Intl umalqura
 * engine the app displays through, so the white day shown is the white day
 * armed; a failed conversion reads as no Hijri designation, never a crash.
 */

import { PRAYER_TIMEZONE } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import type { FastingMode } from '@/shared/types';

export const FASTING_MODES = ['everyDay', 'muhammad', 'dawood', 'whiteDays'] as const satisfies readonly FastingMode[];

/** A fresh install arms Sahur every day, exactly as the app always has */
export const DEFAULT_FASTING_MODE: FastingMode = 'everyDay';

/** The white days: the 13th, 14th and 15th of each Hijri month */
export const WHITE_DAY_FROM = 13;
export const WHITE_DAY_TO = 15;

/** Ramadan, the ninth Hijri month, where every day arms regardless of mode */
const RAMADAN_MONTH = 9;

/** The designations a day can carry, in badge order */
export const FASTING_DESIGNATIONS = ['muhammad', 'dawood', 'whiteDay', 'ramadan'] as const;
export type FastingDesignation = (typeof FASTING_DESIGNATIONS)[number];

/** One settings snapshot, read from the three fasting preference atoms */
export interface FastingSettings {
  mode: FastingMode;
  /** Offered with muhammad and dawood only; ignored elsewhere */
  whiteDaysAddOn: boolean;
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

/** Hijri parts per date, the dayOffsets precedent: the arming path asks for a whole window at once */
const hijriMemo = new Map<string, { month: number; day: number } | null>();

/** The Hijri month and day of a calendar date; null when the conversion yields nothing readable */
export const hijriPartsFor = (date: string): { month: number; day: number } | null => {
  if (hijriMemo.has(date)) return hijriMemo.get(date) ?? null;

  let parts: { month: number; day: number } | null = null;
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    const raw = formatter.formatToParts(TimeUtils.getDayAnchor(date));
    const month = Number(raw.find((part) => part.type === 'month')?.value);
    const day = Number(raw.find((part) => part.type === 'day')?.value);
    parts = Number.isFinite(month) && Number.isFinite(day) ? { month, day } : null;
  } catch {
    parts = null;
  }

  hijriMemo.set(date, parts);
  return parts;
};

/** Test seam: the suites replay the same dates with a mocked engine, which the memo would outlive */
export const __resetHijriMemoForTests = (): void => {
  hijriMemo.clear();
};

/** Whether the date is one of the month's white days */
export const isWhiteDay = (date: string): boolean => {
  const parts = hijriPartsFor(date);
  return parts !== null && parts.day >= WHITE_DAY_FROM && parts.day <= WHITE_DAY_TO;
};

/** Whether the date falls in Ramadan, per the same conversion the display uses */
export const isRamadanDay = (date: string): boolean => hijriPartsFor(date)?.month === RAMADAN_MONTH;

/** The weekday of a calendar date on the JS numbering (0 Sunday to 6 Saturday) */
const weekday = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Whether the date is a Monday or a Thursday */
export const isMuhammadDay = (date: string): boolean => [1, 4].includes(weekday(date));

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
 * The cycle an anchor instant starts: the first day whose suhoor trigger is
 * strictly ahead of the anchor, whether that sits an hour or a day away. A
 * day with no readable row has no trigger and is passed over.
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

/** Whether the settings ask for the white days at all */
const whiteDaysActive = (snapshot: FastingSettings): boolean =>
  snapshot.mode === 'whiteDays' ||
  (snapshot.whiteDaysAddOn && (snapshot.mode === 'muhammad' || snapshot.mode === 'dawood'));

/** Ramadan comes first and alone: the fard fast subsumes every regimen */
const dayVerdict = (date: string, snapshot: FastingSettings, cycle: DawoodCycle | null): FastingDay => {
  if (isRamadanDay(date)) return { arms: true, designations: ['ramadan'] };

  const designations: FastingDesignation[] = [];
  if (snapshot.mode === 'muhammad' && isMuhammadDay(date)) designations.push('muhammad');
  if (cycle !== null && isDawoodDay(date, cycle)) designations.push('dawood');
  if (whiteDaysActive(snapshot) && isWhiteDay(date)) designations.push('whiteDay');

  return { arms: snapshot.mode === 'everyDay' || designations.length > 0, designations };
};

/**
 * A per-day verdict function for one settings snapshot, resolving the Dawood
 * cycle once so a whole candidate window costs one cycle search.
 */
export const fastingEvaluator = (snapshot: FastingSettings, suhoorFor: SuhoorInstantFor) => {
  const cycle = snapshot.mode === 'dawood' ? dawoodCycleFor(snapshot.dawoodAnchorMs, suhoorFor) : null;
  return (date: string): FastingDay => dayVerdict(date, snapshot, cycle);
};

/** What the commit path needs to know about one state of the Sahur row */
export interface FastingActivation {
  bellOn: boolean;
  mode: FastingMode;
}

/** The one moment an anchor is written: Dawood newly active, by bell or by mode */
export const dawoodActivates = (previous: FastingActivation, next: FastingActivation): boolean =>
  next.bellOn && next.mode === 'dawood' && !(previous.bellOn && previous.mode === 'dawood');

/** A stored mode string, or the default when it names no mode */
export const validFastingMode = (value: string): FastingMode =>
  (FASTING_MODES as readonly string[]).includes(value) ? (value as FastingMode) : DEFAULT_FASTING_MODE;

/** How far the preview may walk before giving up on finding armed days */
export const UPCOMING_SEARCH_LIMIT_DAYS = 400;

/** One armed day of the preview */
export interface UpcomingFastingDay {
  date: string;
  verdict: FastingDay;
}

/** The next armed days from a date (inclusive), in calendar order */
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
