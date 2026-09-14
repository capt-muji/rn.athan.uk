/**
 * Unit tests for hooks/useCountdownBar.ts
 *
 * The hook only reads atoms, so it is called directly with useAtomValue mocked. This file used to assert a
 * local copy of the progress arithmetic, which lives in stores/countdown.ts and passed with the hook
 * deleted. The bar's opacity decision is exported as getBarOpacity, since the test tree has no renderer.
 */

import { ScheduleType } from '@/shared/types';

import { getBarOpacity, useCountdownBar } from '../useCountdownBar';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockAtomValues = new Map<string, unknown>();

// An atom no test set throws, so a hook reading the other schedule's atom fails instead of reading undefined
jest.mock('jotai', () => ({
  useAtomValue: (atom: string) => {
    if (!mockAtomValues.has(atom)) throw new Error(`Unexpected atom read: ${atom}`);
    return mockAtomValues.get(atom);
  },
}));

jest.mock('@/stores/schedule', () => ({
  standardNextPrayerAtom: 'standardNextPrayerAtom',
  extraNextPrayerAtom: 'extraNextPrayerAtom',
}));

jest.mock('@/stores/countdown', () => ({
  getBarProgressAtom: (type: string) => `${type}BarProgressAtom`,
  getBarWarningAtom: (type: string) => `${type}BarWarningAtom`,
  getBarAvailableAtom: (type: string) => `${type}BarAvailableAtom`,
}));

interface BarAtoms {
  next: object | null;
  progress: number;
  isWarning: boolean;
  isAvailable: boolean;
}

const setBar = (type: ScheduleType, { next, progress, isWarning, isAvailable }: BarAtoms) => {
  mockAtomValues.set(`${type}NextPrayerAtom`, next);
  mockAtomValues.set(`${type}BarProgressAtom`, progress);
  mockAtomValues.set(`${type}BarWarningAtom`, isWarning);
  mockAtomValues.set(`${type}BarAvailableAtom`, isAvailable);
};

beforeEach(() => mockAtomValues.clear());

// =============================================================================
// THE HOOK
// =============================================================================

describe('useCountdownBar', () => {
  it.each([
    [ScheduleType.Standard, ScheduleType.Extra],
    [ScheduleType.Extra, ScheduleType.Standard],
  ])("%s: exposes isAvailable, progress and the warning from its own schedule's atoms", (type, other) => {
    setBar(other, { next: {}, progress: 70, isWarning: true, isAvailable: true });

    setBar(type, { next: {}, progress: 40, isWarning: false, isAvailable: false });
    expect(useCountdownBar(type)).toEqual({ progress: 40, isReady: true, isWarning: false, isAvailable: false });

    setBar(type, { next: {}, progress: 95, isWarning: true, isAvailable: true });
    expect(useCountdownBar(type)).toEqual({ progress: 95, isReady: true, isWarning: true, isAvailable: true });
  });

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    '%s is not ready before there is a next prayer, and says so apart from availability',
    (type) => {
      setBar(type, { next: null, progress: 0, isWarning: false, isAvailable: false });

      expect(useCountdownBar(type)).toEqual({
        progress: 0,
        isReady: false,
        isWarning: false,
        isAvailable: false,
      });
    }
  );
});

// =============================================================================
// OPACITY
// =============================================================================

describe('getBarOpacity', () => {
  // [preview, overlay open, available, opacity]
  it.each([
    [true, false, true, 1],
    [true, true, true, 1],
    [true, false, false, 1],
    [true, true, false, 1],
    [false, false, true, 1],
    [false, true, true, 0],
    [false, false, false, 0],
    [false, true, false, 0],
  ])('preview %s, overlay open %s, available %s: %i', (isPreviewMode, overlayIsOn, isAvailable, opacity) => {
    expect(getBarOpacity(isPreviewMode, overlayIsOn, isAvailable)).toBe(opacity);
  });

  it('is the rule from before availability whenever the bar is available', () => {
    for (const isPreviewMode of [true, false]) {
      for (const overlayIsOn of [true, false]) {
        expect(getBarOpacity(isPreviewMode, overlayIsOn, true)).toBe(isPreviewMode || !overlayIsOn ? 1 : 0);
      }
    }
  });
});
