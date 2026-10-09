/**
 * Unit tests for components/prayer/Prayer.tsx
 *
 * No renderer is installed, so Prayer is called as a plain function with React's hooks, useAtomValue, Reanimated and
 * react-native stood in for, and its row's press is called directly. useSchedule, usePrayer, the overlay atoms and
 * the rows are real: rows come from real London 2026 days through the app's own builder
 * (hooks/__tests__/londonDays.ts). So what a tap does is decided by the component's own code, and rowPress.test.ts's
 * function is checked here only through what Prayer hands it.
 */

import { type Atom, createStore } from 'jotai';
import { isValidElement, type ReactElement, type ReactNode } from 'react';

import { type Breakage, london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { resolveDisplayDate } from '@/shared/sequence';
import { type OverlayStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import { closeOverlay, openOverlay } from '@/stores/overlay';

import Prayer from '../Prayer';

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

// Effects do not run: they only remember the previous render for the colour animations
jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useMemo: <T>(create: () => T) => create(),
  useRef: <T>(initial: T) => ({ current: initial }),
  useEffect: () => undefined,
}));

jest.mock('react-native', () => ({ Pressable: 'Pressable', StyleSheet: { create: <T>(styles: T) => styles } }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { Text: 'Animated.Text', createAnimatedComponent: () => 'AnimatedPressable' },
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Medium: 'medium' } }));
jest.mock('@/components/prayer/Alert', () => ({ __esModule: true, default: 'Alert' }));
jest.mock('@/components/prayer/Time', () => ({ __esModule: true, default: 'Time' }));
jest.mock('@/hooks/useAnimation', () => ({ useDerivedColor: () => ({}), useDerivedOpacity: () => ({}) }));
jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));
jest.mock('@/stores/overlay', () => ({ closeOverlay: jest.fn(), openOverlay: jest.fn() }));

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
  showArabicNamesAtom: 'showArabicNamesAtom',
}));

type Element = ReactElement<{ children?: ReactNode }>;

/** Every element of a type in a rendered tree, in order */
const findAll = (node: ReactNode, type: string): Element[] => {
  if (Array.isArray(node)) return node.flatMap((child) => findAll(child, type));
  if (!isValidElement<Element['props']>(node)) return [];
  const own = node.type === type ? [node] : [];
  return [...own, ...findAll(node.props.children, type)];
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAtomValues.clear();
});

const CLOSED: OverlayStore = { isOn: false, selectedPrayerIndex: 0, scheduleType: ScheduleType.Standard };
const FAJR = 0;
const DUHA = 3;
const ISTIJABA = 4;

describe('a tap on the row Prayer draws (real London 2026 days)', () => {
  // [scenario, type, breakage, now (London date, time), overlay, tapped index, its name, what the tap does]
  it.each<[string, ScheduleType, Breakage, [string, string], OverlayStore, number, string, object]>([
    [
      'Standard on a Friday afternoon, overlay closed: a tap on the passed Fajr opens the overlay on it',
      ScheduleType.Standard,
      {},
      ['2026-09-11', '14:00'],
      CLOSED,
      FAJR,
      'Fajr',
      { opened: [[ScheduleType.Standard, FAJR]], closed: 0 },
    ],
    [
      'Extras on a Friday at noon, overlay closed: a tap on the passed Duha opens the overlay on it, on the Extras page',
      ScheduleType.Extra,
      {},
      ['2026-09-11', '12:00'],
      CLOSED,
      DUHA,
      'Duha',
      { opened: [[ScheduleType.Extra, DUHA]], closed: 0 },
    ],
    [
      'Extras on a Friday before its Istijaba, overlay open on it: a tap closes the overlay',
      ScheduleType.Extra,
      {},
      ['2026-09-11', '12:00'],
      { isOn: true, selectedPrayerIndex: ISTIJABA, scheduleType: ScheduleType.Extra },
      ISTIJABA,
      'Istijaba',
      { opened: [], closed: 1 },
    ],
    [
      'Extras on a Friday after its Istijaba, held on screen because Saturday is missing from the store: a tap does nothing',
      ScheduleType.Extra,
      { '2026-09-12': 'not stored' },
      ['2026-09-11', '20:00'],
      CLOSED,
      ISTIJABA,
      'Istijaba',
      { opened: [], closed: 0 },
    ],
  ])('%s', (_scenario, type, breakage, [date, time], overlay, index, english, outcome) => {
    storeLondonDays(breakage);
    const prayers = sequenceFrom(type, '2026-09-10');
    const prefix = type === ScheduleType.Standard ? 'standard' : 'extra';
    mockClock.now = london(date, time);
    mockAtomValues.set(`${prefix}SequenceAtom`, { type, prayers });
    mockAtomValues.set(`${prefix}DisplayDateAtom`, resolveDisplayDate(prayers, mockClock.now));
    mockStore.current = createStore();
    mockStore.current.set(overlayAtom, overlay);

    const row = Prayer({ type, index });
    const [name] = findAll(row, 'Animated.Text');
    expect(name.props.children).toBe(english);

    row.props.onPress();

    expect({
      opened: jest.mocked(openOverlay).mock.calls,
      closed: jest.mocked(closeOverlay).mock.calls.length,
    }).toEqual(outcome);
  });
});
