/**
 * Unit tests for components/overlay/Overlay.tsx
 *
 * No renderer is installed, so Overlay is called as a plain function with React's hooks, useAtomValue, Reanimated and
 * react-native stood in for. usePrayer, usePrayerSequence, the overlay atom and the rows are real: rows come from real
 * London 2026 days through the app's own builder (hooks/__tests__/londonDays.ts). So the box and the row the
 * press-catchers leave open are decided by the component's own code, and overlayContent.test.ts's functions are
 * checked here only through what Overlay hands them.
 *
 * The builder lists each day in the owner's order, where the selected index and the drawn row agree, so Friday's list
 * is gathered in reverse, where they part.
 */

import { type Atom, createStore } from 'jotai';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { SPACING, STYLES } from '@/shared/constants';
import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';

import Overlay from '../Overlay';

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

// Effects do not run: they hold the perf mark and the hide timer after a close, and neither places the box
jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useState: <T>(initial: T) => [initial, () => undefined],
  useEffect: () => undefined,
  useLayoutEffect: () => undefined,
}));

jest.mock('react-native', () => ({ Pressable: 'Pressable', StyleSheet: { create: <T>(styles: T) => styles } }));
jest.mock('react-native-reanimated', () => ({ __esModule: true, default: { View: 'Animated.View' } }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Medium: 'medium' } }));
jest.mock('@/components/prayer', () => ({ PrayerExplanation: 'PrayerExplanation' }));
jest.mock('@/hooks/useAnimation', () => ({ useDerivedOpacity: () => ({}) }));
jest.mock('@/hooks/useWindowDimensions', () => ({ useWindowDimensions: () => ({ width: 411, height: 823 }) }));
jest.mock('@/shared/perf', () => ({ perfMeasure: jest.fn() }));
jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

jest.mock('@/shared/time', () => ({
  ...jest.requireActual<typeof import('@/shared/time')>('@/shared/time'),
  createInstant: (date?: Date | number | string) => (date ? new Date(date) : mockClock.now),
}));

jest.mock('@/stores/overlay', () => ({
  closeOverlay: jest.fn(),
  overlayAtom: jest.requireActual<typeof import('@/stores/atoms/overlay')>('@/stores/atoms/overlay').overlayAtom,
}));

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: 'standardSequenceAtom',
  extraSequenceAtom: 'extraSequenceAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

jest.mock('@/stores/ui', () => ({
  measurementsListAtom: 'measurementsListAtom',
  englishWidthStandardAtom: 'englishWidthStandardAtom',
  englishWidthExtraAtom: 'englishWidthExtraAtom',
}));

type Element = ReactElement<{ children?: ReactNode; [prop: string]: unknown }>;

/** Every element of a type in a rendered tree, in order */
const findAll = (node: ReactNode, type: string): Element[] => {
  if (Array.isArray(node)) return node.flatMap((child) => findAll(child, type));
  if (!isValidElement<Element['props']>(node)) return [];
  const own = node.type === type ? [node] : [];
  return [...own, ...findAll(node.props.children, type)];
};

/** Where the list sits on screen, as List measured it */
const LIST = { pageX: 16, pageY: 200, width: 379, height: 285 };

/**
 * Friday 11 September's Extras list gathered in reverse, on screen at noon, with the overlay open on it
 *
 * @returns The list day on screen and the names of Friday's rows in the order the sequence holds them
 */
const openOnReversedFriday = (selectedPrayerIndex: number) => {
  storeLondonDays();
  const built = sequenceFrom(ScheduleType.Extra, '2026-09-10');
  const friday = built.filter((prayer) => prayer.belongsToDate === '2026-09-11');
  const start = built.indexOf(friday[0]);
  const reversed = [...friday].reverse();
  const prayers = [...built.slice(0, start), ...reversed, ...built.slice(start + friday.length)];

  mockClock.now = london('2026-09-11', '12:00');
  const displayDate = resolveDisplayDate(prayers, mockClock.now);
  mockAtomValues.set('extraSequenceAtom', { type: ScheduleType.Extra, prayers });
  mockAtomValues.set('extraDisplayDateAtom', displayDate);
  mockAtomValues.set('measurementsListAtom', LIST);
  mockStore.current = createStore();
  mockStore.current.set(overlayAtom, { isOn: true, selectedPrayerIndex, scheduleType: ScheduleType.Extra });

  return { displayDate, names: reversed.map((prayer) => prayer.english) };
};

/** The span the press-catchers leave open, read from the regions above and below it */
const openSpan = (tree: ReactNode) => {
  const regions = findAll(tree, 'Pressable').map((catcher) => ({
    id: catcher.key,
    ...(catcher.props.style as ViewStyle[])[1],
  }));
  const above = regions.find((region) => region.id === 'top');
  const below = regions.find((region) => region.id === 'bottom');
  return { from: above?.height, to: below?.top };
};

describe('the Extras overlay on a list whose selected index is not its drawn row (real London 2026 days)', () => {
  // [selected index, its prayer, the row drawn for it, arrow, box top, explanation, Arabic explanation]
  it.each<[number, string, number, string, number, string, string]>([
    [
      0,
      'Istijaba',
      4,
      'bottom',
      LIST.pageY + 4 * STYLES.prayer.height - 300 - SPACING.sm,
      '1 hour before Magrib (Fridays only)',
      'ساعة قبل المغرب (الجمعة فقط)',
    ],
    [
      4,
      'Midnight',
      0,
      'top',
      LIST.pageY + STYLES.prayer.height + SPACING.sm,
      'Halfway between Magrib and Fajr',
      'نصف الليل بين المغرب والفجر',
    ],
  ])(
    'index %i is %s, drawn on row %i: the box explains it against that row and the catchers leave that row open',
    (index, english, row, arrowPosition, top, explanation, explanationArabic) => {
      const { displayDate, names } = openOnReversedFriday(index);
      expect([displayDate, names[index]]).toEqual(['2026-09-11', english]);

      const tree = Overlay();
      const boxes = findAll(tree, 'PrayerExplanation');

      expect(boxes).toHaveLength(1);
      expect(boxes[0].props).toMatchObject({
        prayerName: english,
        explanation,
        explanationArabic,
        arrowPosition,
        style: { top },
      });
      expect(openSpan(tree)).toEqual({
        from: LIST.pageY + row * STYLES.prayer.height,
        to: LIST.pageY + (row + 1) * STYLES.prayer.height,
      });
    }
  );
});
