/**
 * The round-6 fasting presentation model (T-623): the decided structure and
 * copy carried over from round 5 unchanged - the period-free subheading and
 * description lines, the round-2 selection rules, the two capture states.
 * Dev-only: nothing shipped imports here.
 */

import { nextR2Selection, R2_DEFAULT, type R2Key, type R2Selection } from '../r2/model';

export const R6_CARD_TITLE = 'Fasting';
export const R6_CARD_SUBHEADING = 'Choose the days you want to enable sahur for';

export interface R6Row {
  readonly key: R2Key;
  readonly title: string;
}

const ROW_TITLES: Record<R2Key, string> = {
  every: 'Every day',
  muhammad: 'Muhammad',
  dawood: 'Dawood',
  white: 'Three white days',
};

/** The four rows top-down, the owner's order */
export const R6_ROWS: readonly R6Row[] = (['every', 'muhammad', 'dawood', 'white'] as const).map((key) => ({
  key,
  title: ROW_TITLES[key],
}));

// The owner's exact copy per state, period-free per the round-5 copy fix,
// hoisted per the string-guard law
const EVERY_COPY = 'Sahur scheduled for every day';
const MUHAMMAD_COPY = 'Sahur scheduled for Mondays and Thursdays only';
const DAWOOD_COPY = 'Sahur scheduled for one day on, one day off';
const WHITE_COPY = 'Sahur scheduled for 13th, 14th and 15th of each Hijri month only';
const MUHAMMAD_WHITE_COPY = 'Sahur scheduled for Mondays and Thursdays and the three white days';
const DAWOOD_WHITE_COPY = 'Sahur scheduled for one day on, one day off and the three white days';

/** The whole current selection in the owner's one exact line */
export const r6Description = (selection: R2Selection): string => {
  if (selection.mode === 'muhammad') return selection.white ? MUHAMMAD_WHITE_COPY : MUHAMMAD_COPY;
  if (selection.mode === 'dawood') return selection.white ? DAWOOD_WHITE_COPY : DAWOOD_COPY;
  if (selection.mode === 'every') return EVERY_COPY;
  return WHITE_COPY;
};

/** The tap rule is the round-2 model's, unchanged */
export const r6Tap = (current: R2Selection, key: R2Key): R2Selection => nextR2Selection(current, key);

/** The two capture states the frames show, seeded by the deep link's state param */
export const r6Seed = (state: string | string[] | undefined): R2Selection =>
  firstParam(state) === 'combined' ? { mode: 'muhammad', white: true } : R2_DEFAULT;

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
