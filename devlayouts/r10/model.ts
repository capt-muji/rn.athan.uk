/**
 * The round-10 model (T-623): five owner-ordered takes over the round-9
 * machinery, each covering all three parts - the mode identity dots (Muhammad
 * green, Dawood cyan, the white days white), the notes' next-Suhoor entries
 * (the next two triggers, each with its identity dots), and the two-week
 * calendar (today first, two rows of seven, mode-colored cells). The takes
 * vary the bell-corner spot, the combo-cell treatment, entries-vs-calendar
 * emphasis and spacing; everything else stays mirror-even. The trigger walk
 * and the calendar walk ride the real fasting evaluator over the real
 * timetable (r9's), injected with the render-time instant - never the clock.
 * Dev-only: nothing shipped imports here.
 */

import { type FastingDay, type FastingDesignation, fastingEvaluator } from '@/shared/fasting';
import * as TimeUtils from '@/shared/time';

import type { R2Selection } from '../r2/model';
import { type R9Armed, r9ArmedFor, r9SettingsFor, r9SuhoorAt } from '../r9/model';

// ---------------------------------------------------------------------------
// The five takes
// ---------------------------------------------------------------------------

/** Where the armed modes' dot cluster rides the Suhoor row's alerts bell */
export type R10Spot = 'bell-top-right' | 'bell-bottom-right' | 'bell-below';

/** How a combo cell carries both identities */
export type R10Combo = 'split' | 'mini-dots' | 'two-tone' | 'bite';

/** Whether the notes show entries and the calendar, or the calendar alone */
export type R10Section = 'both' | 'calendar';

export interface R10Take {
  /** The design inside the round, 1-5 (the deep link's r10 param) */
  readonly design: number;
  /** The design's number across the whole exploration, 421-425 */
  readonly number: number;
  /** Slug-shaped unique id, the frame names' slug */
  readonly id: string;
  readonly name: string;
  readonly spot: R10Spot;
  readonly combo: R10Combo;
  readonly section: R10Section;
  /** Tight spacing when true, roomy when false */
  readonly compact: boolean;
}

export const R10_TAKES: readonly R10Take[] = [
  {
    design: 1,
    number: 421,
    id: 'split-bell-top-both',
    name: 'Split cells, bell top-right, entries + calendar',
    spot: 'bell-top-right',
    combo: 'split',
    section: 'both',
    compact: false,
  },
  {
    design: 2,
    number: 422,
    id: 'minidots-bell-top-calendar',
    name: 'Mini-dot cells, bell top-right, calendar alone',
    spot: 'bell-top-right',
    combo: 'mini-dots',
    section: 'calendar',
    compact: true,
  },
  {
    design: 3,
    number: 423,
    id: 'twotone-bell-bottom-both',
    name: 'Two-tone cells, bell bottom-right, entries + calendar',
    spot: 'bell-bottom-right',
    combo: 'two-tone',
    section: 'both',
    compact: false,
  },
  {
    design: 4,
    number: 424,
    id: 'minidots-bell-bottom-calendar',
    name: 'Mini-dot cells, bell bottom-right, calendar alone',
    spot: 'bell-bottom-right',
    combo: 'mini-dots',
    section: 'calendar',
    compact: true,
  },
  {
    design: 5,
    number: 425,
    id: 'bite-bell-below-both',
    name: 'Bite cells, bell below, entries + calendar',
    spot: 'bell-below',
    combo: 'bite',
    section: 'both',
    compact: false,
  },
];

/** The take for a deep-link design number, clamped into the round */
export const r10TakeFor = (design: number): R10Take =>
  R10_TAKES[Math.min(Math.max(design, 1), R10_TAKES.length) - 1] ?? R10_TAKES[0]!;

// ---------------------------------------------------------------------------
// Mode identities: the one color fact every surface renders
// ---------------------------------------------------------------------------

export type R10Identity = 'green' | 'cyan' | 'white';

export const R10_IDENTITY_RGB: Record<R10Identity, readonly [number, number, number]> = {
  green: [74, 222, 128],
  cyan: [34, 211, 238],
  white: [255, 255, 255],
};

export const r10IdentityColor = (identity: R10Identity): string => {
  const [r, g, b] = R10_IDENTITY_RGB[identity];
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

/** The dark ink that stays readable on any identity fill */
export const R10_ON_FILL = 'rgba(12, 18, 34, 0.88)';

const DESIGNATION_IDENTITY: Partial<Record<FastingDesignation, R10Identity>> = {
  muhammad: 'green',
  dawood: 'cyan',
  whiteDay: 'white',
};

/** The identities one day's designations carry, in the designations' order */
export const r10IdentitiesFor = (designations: readonly FastingDesignation[]): R10Identity[] => {
  const identities: R10Identity[] = [];
  for (const designation of designations) {
    const identity = DESIGNATION_IDENTITY[designation];
    if (identity !== undefined && !identities.includes(identity)) identities.push(identity);
  }
  return identities;
};

/** The identities the selection arms, in regimen order (Muhammad, Dawood, white) */
export const r10ArmedIdentities = (selection: R2Selection): R10Identity[] => {
  const armed: R9Armed = r9ArmedFor(selection);
  const identities: R10Identity[] = [];
  if (armed.muhammad) identities.push('green');
  if (armed.dawood) identities.push('cyan');
  if (armed.white) identities.push('white');
  return identities;
};

// ---------------------------------------------------------------------------
// The next-Suhoor entries and the two-week calendar over the real evaluator
// ---------------------------------------------------------------------------

export interface R10CalendarDay {
  readonly date: string;
  readonly arms: boolean;
  readonly designations: readonly FastingDesignation[];
}

/** The next `count` days from the injected instant's day, today first */
export const r10CalendarDays = (
  now: Date,
  selection: R2Selection,
  count: number = R10_CALENDAR_DAYS,
  suhoorAt: (date: string) => { at: Date; time: string } | null = r9SuhoorAt
): R10CalendarDay[] => {
  const settings = r9SettingsFor(selection, now.getTime());
  const verdictFor = fastingEvaluator(settings, (date) => suhoorAt(date)?.at ?? null);
  const today = TimeUtils.formatDateShort(now);

  const days: R10CalendarDay[] = [];
  let date = today;
  for (let step = 0; step < count; step += 1) {
    const verdict: FastingDay = verdictFor(date);
    days.push({ date, arms: verdict.arms, designations: verdict.designations });
    date = TimeUtils.addDaysToDateString(date, 1);
  }
  return days;
};

export const R10_CALENDAR_DAYS = 14;
export const R10_CALENDAR_COLUMNS = 7;
/** How many upcoming triggers the entries show */
export const R10_ENTRY_COUNT = 2;

// ---------------------------------------------------------------------------
// Copy: every visible literal, hoisted. Suhoor spelled the app's way
// ---------------------------------------------------------------------------

/** The entries' relative distance: under a day "in N hours", over it "in N days" plus the weekday */
export const r10Relative = (at: Date, date: string, now: Date): string => {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 1440) {
    const hours = Math.max(1, Math.round(minutes / 60));
    return `${REL_IN} ${hours} ${hours === 1 ? REL_HOUR : REL_HOURS}`;
  }
  const days = Math.max(1, Math.round(minutes / 1440));
  return `${REL_IN} ${days} ${days === 1 ? REL_DAY : REL_DAYS} ${r10Weekday(date)}`;
};

/** The weekday short name of a list day, London time like the app's own labels */
export const r10Weekday = (date: string): string =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/London' }).format(
    new Date(`${date}T12:00:00`)
  );

const REL_IN = 'in';
const REL_HOUR = 'hour';
const REL_HOURS = 'hours';
const REL_DAY = 'day';
const REL_DAYS = 'days';
