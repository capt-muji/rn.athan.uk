/**
 * Unit tests for components/day/Day.tsx
 *
 * No renderer is installed, so Day is called as a plain function with React's useMemo, useAtomValue, Reanimated and
 * react-native stood in for. usePrayer, the overlay atoms and the rows are real: rows come from real London 2026 days
 * through the app's own builder (hooks/__tests__/londonDays.ts). So the date on the header is decided by the
 * component's own code, and shownDate.test.ts's functions are checked here only through what Day hands them.
 */

import { type Atom, createStore } from 'jotai';
import { isValidElement, type ReactElement, type ReactNode } from 'react';

import { london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { resolveDisplayDate } from '@/shared/sequence';
import { type OverlayStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

import Day from '../Day';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockClock = { now: new Date(0) };
const mockAtomValues = new Map<string, unknown>();
const mockStore = { current: createStore() };
const mockReadAtom = (atom: string | Atom<unknown>): unknown =>
  typeof atom === 'string' ? mockAtomValues.get(atom) : mockStore.current.get(atom);

jest.mock('jotai', () => ({
  ...jest.requireActual<typeof import('jotai')>('jotai'),
  useAtomValue: (...args: Parameters<typeof mockReadAtom>) => mockReadAtom(...args),
}));

jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useMemo: <T>(create: () => T) => create(),
}));

jest.mock('react-native', () => ({ StyleSheet: { create: <T>(styles: T) => styles }, Text: 'Text', View: 'View' }));
jest.mock('react-native-reanimated', () => ({ __esModule: true, default: { View: 'Animated.View' } }));
jest.mock('@/components/ui', () => ({ Masjid: () => null }));
jest.mock('@/hooks/useAnimation', () => ({ useDerivedOpacity: () => ({}) }));
jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

jest.mock('@/shared/time', () => ({
  ...jest.requireActual<typeof import('@/shared/time')>('@/shared/time'),
  createInstant: (date?: Date | number | string) => (date ? new Date(date) : mockClock.now),
}));

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: 'standardSequenceAtom',
  extraSequenceAtom: 'extraSequenceAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

jest.mock('@/stores/ui', () => ({
  englishWidthStandardAtom: 'englishWidthStandardAtom',
  englishWidthExtraAtom: 'englishWidthExtraAtom',
  hijriDateEnabledAtom: 'hijriDateEnabledAtom',
}));

type Element = ReactElement<{ children?: ReactNode }>;

/** Every element of a type in a rendered tree, in order */
const findAll = (node: ReactNode, type: string): Element[] => {
  if (Array.isArray(node)) return node.flatMap((child) => findAll(child, type));
  if (!isValidElement<Element['props']>(node)) return [];
  const own = node.type === type ? [node] : [];
  return [...own, ...findAll(node.props.children, type)];
};

const FAJR = 0;
const DUHA = 3;
const ISTIJABA = 4;

describe('the Day header on Friday 11 September at 14:00 (real London 2026 days)', () => {
  // [scenario, page, overlay, Hijri, the date line]
  it.each<[string, ScheduleType, OverlayStore, boolean, string]>([
    [
      'Standard page, overlay open on its passed Fajr: the next day that Fajr falls on',
      ScheduleType.Standard,
      { isOn: true, selectedPrayerIndex: FAJR, scheduleType: ScheduleType.Standard },
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Standard page, overlay closed, Hijri chosen',
      ScheduleType.Standard,
      { isOn: false, selectedPrayerIndex: FAJR, scheduleType: ScheduleType.Standard },
      true,
      'Rabiʻ I 29, 1448',
    ],
    [
      'Standard page, overlay open on its passed Fajr, Hijri chosen',
      ScheduleType.Standard,
      { isOn: true, selectedPrayerIndex: FAJR, scheduleType: ScheduleType.Standard },
      true,
      'Rabiʻ II 1, 1448',
    ],
    [
      'Extras page, overlay open on its passed Duha: the next day that Duha falls on',
      ScheduleType.Extra,
      { isOn: true, selectedPrayerIndex: DUHA, scheduleType: ScheduleType.Extra },
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Extras page, overlay open on its Istijaba still to come: its own day, not the day of the passed row 0',
      ScheduleType.Extra,
      { isOn: true, selectedPrayerIndex: ISTIJABA, scheduleType: ScheduleType.Extra },
      false,
      'Fri, 11 Sep 2026',
    ],
    [
      'Standard page, overlay open on the Extras page: the list day on screen',
      ScheduleType.Standard,
      { isOn: true, selectedPrayerIndex: DUHA, scheduleType: ScheduleType.Extra },
      false,
      'Fri, 11 Sep 2026',
    ],
  ])('%s', (_scenario, type, overlay, hijriEnabled, date) => {
    storeLondonDays();
    mockClock.now = london('2026-09-11', '14:00');
    for (const schedule of [ScheduleType.Standard, ScheduleType.Extra]) {
      const prayers = sequenceFrom(schedule, '2026-09-10');
      const prefix = schedule === ScheduleType.Standard ? 'standard' : 'extra';
      mockAtomValues.set(`${prefix}SequenceAtom`, { type: schedule, prayers });
      mockAtomValues.set(`${prefix}DisplayDateAtom`, resolveDisplayDate(prayers, mockClock.now));
    }
    mockAtomValues.set('hijriDateEnabledAtom', hijriEnabled);
    mockStore.current = createStore();
    mockStore.current.set(overlayAtom, overlay);

    const lines = findAll(Day({ type }), 'Text').map((text) => text.props.children);

    expect(lines).toEqual(['London, UK', date]);
  });
});
