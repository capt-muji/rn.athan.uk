/**
 * The fasting selection model (T-623): the four options, the six valid sets,
 * the tap rule, the stored-seed reading, and the description's six states.
 * The suite pins the whole transition table, so a silent change to any tap's
 * landing set reddens.
 */

import { fastingDescriptionKey, nextFastingSelection, sanitizeFastingSelection } from '@/shared/fastingSelection';
import type { FastingMode, FastingSelection } from '@/shared/types';

const sel = (mode: FastingMode, whiteDaysAddOn = false): FastingSelection => ({ mode, whiteDaysAddOn });

const EVERY = sel('everyDay');
const MUHAMMAD = sel('muhammad');
const DAWOOD = sel('dawood');
const WHITE = sel('whiteDays');
const MUHAMMAD_WHITE = sel('muhammad', true);
const DAWOOD_WHITE = sel('dawood', true);

/** The six sets the selection grammar allows */
const SETS = [EVERY, MUHAMMAD, DAWOOD, WHITE, MUHAMMAD_WHITE, DAWOOD_WHITE];

describe('the six valid sets', () => {
  it('holds six distinct sets', () => {
    expect(new Set(SETS).size).toBe(6);
  });
});

describe('the stored seed', () => {
  it('reads any stored pair onto the six sets', () => {
    // The add-on only rides the two regimens; a pair storage may hold from an
    // older writing loses it everywhere else
    expect(sanitizeFastingSelection(sel('whiteDays', true))).toEqual(WHITE);
    expect(sanitizeFastingSelection(sel('everyDay', true))).toEqual(EVERY);
    expect(sanitizeFastingSelection(MUHAMMAD_WHITE)).toEqual(MUHAMMAD_WHITE);
  });
});

describe('the tap rule', () => {
  type Row = readonly [FastingSelection, FastingMode, FastingSelection];

  it('lands the whole transition table', () => {
    const table: readonly Row[] = [
      // Tapping the only selected option does nothing
      [EVERY, 'everyDay', EVERY],
      [MUHAMMAD, 'muhammad', MUHAMMAD],
      [DAWOOD, 'dawood', DAWOOD],
      [WHITE, 'whiteDays', WHITE],
      // Every day silently unselects everything it conflicts with
      [MUHAMMAD, 'everyDay', EVERY],
      [DAWOOD, 'everyDay', EVERY],
      [WHITE, 'everyDay', EVERY],
      [MUHAMMAD_WHITE, 'everyDay', EVERY],
      [DAWOOD_WHITE, 'everyDay', EVERY],
      // The white days leave every day as the white days alone
      [EVERY, 'whiteDays', WHITE],
      // ...and toggle as the add-on beside a regimen
      [MUHAMMAD, 'whiteDays', MUHAMMAD_WHITE],
      [DAWOOD, 'whiteDays', DAWOOD_WHITE],
      [MUHAMMAD_WHITE, 'whiteDays', MUHAMMAD],
      [DAWOOD_WHITE, 'whiteDays', DAWOOD],
      // A regimen replaces every day without touching the white days
      [EVERY, 'muhammad', MUHAMMAD],
      [EVERY, 'dawood', DAWOOD],
      // ...carries the white days along from the white-only set
      [WHITE, 'muhammad', MUHAMMAD_WHITE],
      [WHITE, 'dawood', DAWOOD_WHITE],
      // ...and replaces its counterpart, keeping the white days
      [DAWOOD, 'muhammad', MUHAMMAD],
      [MUHAMMAD, 'dawood', DAWOOD],
      [DAWOOD_WHITE, 'muhammad', MUHAMMAD_WHITE],
      [MUHAMMAD_WHITE, 'dawood', DAWOOD_WHITE],
      // Tapping a regimen under its own add-on falls back to the white days alone
      [MUHAMMAD_WHITE, 'muhammad', WHITE],
      [DAWOOD_WHITE, 'dawood', WHITE],
    ];

    for (const [current, option, expected] of table) {
      expect(nextFastingSelection(current, option)).toEqual(expected);
    }
  });

  it('hands back the same selection untouched when the tapped option is the only one selected', () => {
    // "Does nothing" means no new draft: the four self-taps return the same
    // reference, so the sheet's draft and its close-time comparison see no change
    expect(nextFastingSelection(EVERY, 'everyDay')).toBe(EVERY);
    expect(nextFastingSelection(MUHAMMAD, 'muhammad')).toBe(MUHAMMAD);
    expect(nextFastingSelection(DAWOOD, 'dawood')).toBe(DAWOOD);
    expect(nextFastingSelection(WHITE, 'whiteDays')).toBe(WHITE);
  });

  it('only ever lands on one of the six sets', () => {
    for (const current of SETS) {
      for (const option of ['everyDay', 'muhammad', 'dawood', 'whiteDays'] as const) {
        expect(SETS).toContainEqual(nextFastingSelection(current, option));
      }
    }
  });
});

describe('the description', () => {
  it('speaks the whole selection in its six states', () => {
    expect(fastingDescriptionKey(EVERY)).toBe('fasting.description.everyDay');
    expect(fastingDescriptionKey(MUHAMMAD)).toBe('fasting.description.muhammad');
    expect(fastingDescriptionKey(DAWOOD)).toBe('fasting.description.dawood');
    expect(fastingDescriptionKey(WHITE)).toBe('fasting.description.whiteDays');
    expect(fastingDescriptionKey(MUHAMMAD_WHITE)).toBe('fasting.description.muhammadWhiteDays');
    expect(fastingDescriptionKey(DAWOOD_WHITE)).toBe('fasting.description.dawoodWhiteDays');
  });

  it('reads a stored pair off the six sets through the same states', () => {
    expect(fastingDescriptionKey(sel('whiteDays', true))).toBe('fasting.description.whiteDays');
    expect(fastingDescriptionKey(sel('everyDay', true))).toBe('fasting.description.everyDay');
  });
});
