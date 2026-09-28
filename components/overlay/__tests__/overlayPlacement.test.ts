/**
 * Unit tests for components/overlay/OverlayInfoBox.tsx
 *
 * No renderer is installed, so OverlayInfoBox is called as a plain function with React's hooks,
 * useAtomValue, Reanimated and react-native stood in for. usePrayer, usePrayerSequence, the overlay
 * atom and the rows are real: rows come from real London 2026 days through the app's own builder
 * (hooks/__tests__/londonDays.ts). The card is anchored by row index in the list's own space, so
 * these tests pin that arithmetic and the flip rule, not any window measurement.
 *
 * The builder lists each day in the owner's order, where the selected index and the drawn row agree,
 * so Friday's list is gathered in reverse, where they part.
 */

import { type Atom, createStore } from 'jotai';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { STYLES } from '@/shared/constants';
import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

import OverlayInfoBox from '../OverlayInfoBox';

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

// Effects do not run: they hold only the hide timer after a close, and neither places the card
jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useState: <T>(initial: T) => [initial, () => undefined],
  useEffect: () => undefined,
}));

jest.mock('react-native', () => ({ StyleSheet: { create: <T>(styles: T) => styles } }));
jest.mock('react-native-reanimated', () => ({ __esModule: true, default: { View: 'Animated.View' } }));
jest.mock('@/hooks/useAnimation', () => ({ useDerivedOpacity: () => ({}) }));
jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

jest.mock('@/shared/time', () => ({
  ...jest.requireActual<typeof import('@/shared/time')>('@/shared/time'),
  createInstant: (date?: Date | number | string) => (date ? new Date(date) : mockClock.now),
}));

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: 'overlayAtom',
}));

// The store write needs the real primitive atom, while the component read goes through the string
const realOverlayAtom =
  jest.requireActual<typeof import('@/stores/atoms/overlay')>('@/stores/atoms/overlay').overlayAtom;

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: 'standardSequenceAtom',
  extraSequenceAtom: 'extraSequenceAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

jest.mock('@/stores/ui', () => ({
  englishWidthStandardAtom: 'englishWidthStandardAtom',
  englishWidthExtraAtom: 'englishWidthExtraAtom',
}));

// The real card needs react-native-svg, which the unit mock tree cannot stand in for
jest.mock('@/components/prayer/Explanation', () => ({ __esModule: true, default: () => null }));
jest.mock('react-native-svg', () => ({ __esModule: true, default: () => null, Path: () => null }));

type Element = ReactElement<{ children?: ReactNode; [prop: string]: unknown }>;

/** Every PrayerExplanation the tree holds, in order (the mock is the only function component in it) */
const findAll = (node: ReactNode): Element[] => {
  if (Array.isArray(node)) return node.flatMap((child) => findAll(child));
  if (!isValidElement<Element['props']>(node)) return [];
  const isCard = typeof node.type === 'function' && node.type.name === 'default';
  const own = isCard ? [node] : [];
  return [...own, ...findAll(node.props.children)];
};

/** Where a drawn row's top edge sits, in the list's own row space */
const rowTop = (row: number) => row * STYLES.prayer.height;

/** How far the arrow tip overlaps into the row band */
const TIP_OVERLAP = 9;

/** Friday 11 September's Extras list gathered in reverse, on screen at noon, with the overlay open on it */
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
  mockStore.current = createStore();
  mockStore.current.set(realOverlayAtom, { isOn: true, selectedPrayerIndex, scheduleType: ScheduleType.Extra });
  mockAtomValues.set('overlayAtom', { isOn: true, selectedPrayerIndex, scheduleType: ScheduleType.Extra });

  return reversed.map((prayer) => prayer.english);
};

describe('the Extras card on a list whose selected index is not its drawn row (real London 2026 days)', () => {
  // The card hangs from a row EDGE and is never given a height, so it is as tall as its own content.
  // Friday lists 5 Extras rows, so only the last one flips above: that is what keeps the card off the
  // rows it would otherwise cover.
  // [selected index, its prayer, the row drawn for it, arrow, the top it anchors from, explanation, Arabic]
  it.each<[number, string, number, string, ViewStyle, string, string]>([
    [
      0,
      'Istijaba',
      4,
      'bottom',
      { top: rowTop(4) + TIP_OVERLAP, transform: [{ translateY: '-100%' }] },
      '1 hour before Magrib (Fridays only)',
      'ساعة قبل المغرب (الجمعة فقط)',
    ],
    [
      4,
      'Midnight',
      0,
      'top',
      { top: rowTop(0) + STYLES.prayer.height - TIP_OVERLAP },
      'Halfway between Magrib and Fajr',
      'نصف الليل بين المغرب والفجر',
    ],
  ])(
    'index %i is %s, drawn on row %i: the card explains it against that row',
    (index, english, _row, arrowPosition, anchor, explanation, explanationArabic) => {
      const names = openOnReversedFriday(index);

      const tree = OverlayInfoBox({ type: ScheduleType.Extra });
      const cards = findAll(tree);

      expect(cards).toHaveLength(1);
      expect(cards[0].props).toMatchObject({
        prayerName: english,
        explanation,
        explanationArabic,
        arrowPosition,
        style: { ...anchor, left: 0, width: '100%' },
      });
      // Never a fixed height: the card sizes itself, or an empty 300pt box pushes its content off the row
      expect((cards[0].props.style as ViewStyle).height).toBeUndefined();
      expect(names[index]).toBe(english);
    }
  );
});

/** Saturday 12 September's Extras list, in the owner's order: 4 rows, no Istijaba */
const openOnSaturday = (selectedPrayerIndex: number) => {
  storeLondonDays();
  const prayers = sequenceFrom(ScheduleType.Extra, '2026-09-10');

  mockClock.now = london('2026-09-12', '12:00');
  mockAtomValues.set('extraSequenceAtom', { type: ScheduleType.Extra, prayers });
  mockAtomValues.set('extraDisplayDateAtom', '2026-09-12');
  mockStore.current = createStore();
  mockStore.current.set(realOverlayAtom, { isOn: true, selectedPrayerIndex, scheduleType: ScheduleType.Extra });
  mockAtomValues.set('overlayAtom', { isOn: true, selectedPrayerIndex, scheduleType: ScheduleType.Extra });
};

// The Extras list is shorter than the Standard one, which is what the old fixed `index >= 3` ignored:
// it flipped Duha, the LAST row of four, and drew its card back over the three rows above it
describe('the Extras card on a four-row list, where only the last row may flip above', () => {
  // [selected index, the prayer, whether its card hangs above the row]
  it.each<[number, string, boolean]>([
    [0, 'Midnight', false],
    [1, 'Last Third', false],
    [2, 'Suhoor', false],
    [3, 'Duha', true],
  ])('index %i (%s) hangs above the row: %s', (index, english, above) => {
    openOnSaturday(index);

    const tree = OverlayInfoBox({ type: ScheduleType.Extra });
    const card = findAll(tree)[0];
    const style = card.props.style as ViewStyle;

    expect(card.props).toMatchObject({ prayerName: english, arrowPosition: above ? 'bottom' : 'top' });
    expect(style.top).toBe(above ? rowTop(index) + TIP_OVERLAP : rowTop(index) + STYLES.prayer.height - TIP_OVERLAP);
    expect(style.transform).toEqual(above ? [{ translateY: '-100%' }] : undefined);
  });

  // The card is placed by row index inside the list, in the same space the rows render in
  it("anchors to the list's own row space, never to a window measurement", () => {
    openOnSaturday(0);

    const card = findAll(OverlayInfoBox({ type: ScheduleType.Extra }))[0];
    const style = card.props.style as ViewStyle;

    expect(style.top).toBe(STYLES.prayer.height - TIP_OVERLAP);
    expect(style.left).toBe(0);
    expect(style.height).toBeUndefined();
  });
});

// Friday adds Istijaba, so the list is FIVE rows and the row that may flip moves with it. The owner
// saw the old rule flip the last TWO here, Duha and Istijaba, which is what `index >= 3` does to a
// five-row list: Duha must hang below on a Friday and above on no other day.
describe('the Extras card on a five-row Friday list, where the flip follows the extra row', () => {
  // [drawn row, the prayer, whether its card hangs above the row]
  it.each<[number, string, boolean]>([
    [2, 'Suhoor', false],
    [3, 'Duha', false],
    [4, 'Istijaba', true],
  ])('row %i (%s) hangs above: %s', (row, english, above) => {
    // openOnReversedFriday takes a SEQUENCE index against the reversed list, so the drawn row inverts
    openOnReversedFriday(4 - row);

    const card = findAll(OverlayInfoBox({ type: ScheduleType.Extra }))[0];
    const style = card.props.style as ViewStyle;

    expect(card.props).toMatchObject({ prayerName: english, arrowPosition: above ? 'bottom' : 'top' });
    expect(style.top).toBe(above ? rowTop(row) + TIP_OVERLAP : rowTop(row) + STYLES.prayer.height - TIP_OVERLAP);
  });
});
