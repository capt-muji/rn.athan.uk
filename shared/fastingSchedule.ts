/**
 * The fasting schedule walk (design 427): the ten-day calendar over the real
 * fasting evaluator and the baked timetable's rows. Every instant is
 * injected - `now` and the Dawood anchor arrive as arguments - so nothing
 * here reads the clock and the suites run on fixed dates.
 */

import { type FastingDay, type FastingDesignation, type FastingSettings, fastingEvaluator } from '@/shared/fasting';
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

/** One calendar day: whether it arms and why */
export interface FastingCalendarDay {
  readonly date: string;
  readonly arms: boolean;
  readonly designations: readonly FastingDesignation[];
}

/** How many days the card's strip carries */
export const FASTING_CALENDAR_DAYS = 10;

/** The next `count` days from the given instant's day, that day first, each with its verdict */
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
