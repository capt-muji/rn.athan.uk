/**
 * Unit tests for hooks/useCountdown.ts
 *
 * The hook only reads atoms, so it is called directly with useAtomValue answering from a map. The file used to
 * test a mocked getSecondsBetween instead, which proved nothing about the hook; Countdown.tsx renders nothing while
 * the hook is not ready, so whether it is ready decides whether the page keeps its layout.
 */

import { ScheduleType } from '@/shared/types';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockAtomValues = new Map<string, unknown>();

jest.mock('jotai', () => ({ useAtomValue: (atom: string) => mockAtomValues.get(atom) }));

jest.mock('@/stores/schedule', () => ({
  standardNextPrayerAtom: 'standardNextPrayerAtom',
  extraNextPrayerAtom: 'extraNextPrayerAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

jest.mock('@/stores/countdown', () => ({
  getCountdownNameAtom: (type: string) => `${type}CountdownNameAtom`,
  getCountdownDisplayAtom: (type: string) => `${type}CountdownDisplayAtom`,
}));

import { useCountdown } from '../useCountdown';

/** What the stores hold for one schedule */
const given = (
  type: ScheduleType,
  {
    next,
    displayDate,
    name,
    display,
  }: { next: object | null; displayDate: string | null; name: string; display: string }
) => {
  mockAtomValues.set(`${type}NextPrayerAtom`, next);
  mockAtomValues.set(`${type}DisplayDateAtom`, displayDate);
  mockAtomValues.set(`${type}CountdownNameAtom`, name);
  mockAtomValues.set(`${type}CountdownDisplayAtom`, display);
};

beforeEach(() => mockAtomValues.clear());

describe('useCountdown', () => {
  it.each([
    [ScheduleType.Standard, 'Asr', '2h 5m'],
    [ScheduleType.Extra, 'Suhoor', '6h 12m'],
  ])('reads the %s schedule’s own name and time', (type, name, display) => {
    given(type, { next: { english: name }, displayDate: '2026-10-17', name, display });

    expect(useCountdown(type)).toEqual({ displayTime: display, prayerName: name, isReady: true });
  });

  it('stays ready after the last readable prayer in storage, so --:-- keeps its place and the page does not move', () => {
    given(ScheduleType.Standard, { next: null, displayDate: '2026-12-31', name: 'Fajr', display: '--:--' });

    expect(useCountdown(ScheduleType.Standard)).toEqual({ displayTime: '--:--', prayerName: 'Fajr', isReady: true });
  });

  it('is not ready before any list is on screen', () => {
    given(ScheduleType.Extra, { next: null, displayDate: null, name: 'Fajr', display: '0s' });

    expect(useCountdown(ScheduleType.Extra).isReady).toBe(false);
  });
});
