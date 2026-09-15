/**
 * Unit tests for components/prayer/ActiveBackground.tsx
 *
 * No renderer is installed, so ActiveBackground is called as a plain function with useAtomValue, Reanimated and
 * react-native stood in for. useRef and useEffect keep each page's refs across calls and run its effects after each
 * call, as React does after a commit, so the row a faded pill keeps is the row the component itself wrote on the
 * render before. usePrayerSequence, the overlay atom and the rows are real: rows come from real London 2026 days
 * through the app's own builder (hooks/__tests__/londonDays.ts). activePill.test.ts tests the functions it calls;
 * this tests what ActiveBackground hands them and that their answers reach the pill.
 */

import { type Atom, createStore } from 'jotai';

import { london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { STYLES } from '@/shared/constants';
import { resolveDisplayDate } from '@/shared/sequence';
import { type Prayer, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

import ActiveBackground from '../ActiveBackground';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockClock = { now: new Date(0) };
const mockAtomValues = new Map<string, unknown>();
const mockStore = { current: createStore() };
const mockReadAtom = (atom: string | Atom<unknown>): unknown =>
  typeof atom === 'string' ? mockAtomValues.get(atom) : mockStore.current.get(atom);

/** Each mounted page's refs, and the effects of the call in progress */
const mockHooks = {
  refs: new Map<ScheduleType, { current: unknown }[]>(),
  page: ScheduleType.Standard,
  nextRef: 0,
  effects: [] as (() => void)[],
};

jest.mock('jotai', () => ({
  ...jest.requireActual<typeof import('jotai')>('jotai'),
  useAtomValue: (...args: Parameters<typeof mockReadAtom>) => mockReadAtom(...args),
}));

jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useRef: (initial: unknown) => {
    const refs = mockHooks.refs.get(mockHooks.page) ?? [];
    mockHooks.refs.set(mockHooks.page, refs);
    const slot = mockHooks.nextRef;
    mockHooks.nextRef += 1;
    refs[slot] ??= { current: initial };
    return refs[slot];
  },
  useEffect: (effect: () => void) => {
    mockHooks.effects.push(effect);
  },
}));

// The slide and the fade echo their targets, so the pill's row and opacity can be read off the view it renders
jest.mock('@/hooks/useAnimation', () => ({
  useDerivedTranslateY: (slideTarget: number) => ({ slideTarget }),
  useDerivedOpacity: (fadeTarget: number) => ({ fadeTarget }),
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' }, StyleSheet: { create: <T>(styles: T) => styles } }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
  Easing: { elastic: () => () => 0 },
}));
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

beforeEach(() => {
  mockAtomValues.clear();
  mockHooks.refs.clear();
  mockStore.current = createStore();
});

const reversed = (rows: Prayer[]) => [...rows].reverse();

/** Puts a sequence from 10 September on screen at a London moment, each day's rows in an order; returns the list day */
const show = (type: ScheduleType, [date, time]: [string, string], order = (rows: Prayer[]) => rows): string | null => {
  const built = sequenceFrom(type, '2026-09-10');
  const days = [...new Set(built.map((prayer) => prayer.belongsToDate))];
  const prayers = days.flatMap((day) => order(built.filter((prayer) => prayer.belongsToDate === day)));
  const prefix = type === ScheduleType.Standard ? 'standard' : 'extra';

  mockClock.now = london(date, time);
  const displayDate = resolveDisplayDate(prayers, mockClock.now);
  mockAtomValues.set(`${prefix}SequenceAtom`, { type, prayers });
  mockAtomValues.set(`${prefix}DisplayDateAtom`, displayDate);
  return displayDate;
};

/** One render of a page's pill, then its effects: the row it slides to and the opacity it fades to */
const drawnPill = (type: ScheduleType) => {
  mockHooks.page = type;
  mockHooks.nextRef = 0;
  mockHooks.effects = [];

  const view = ActiveBackground({ type });
  for (const effect of mockHooks.effects) effect();

  const styles: object[] = view.props.style;
  const slide = styles.find((style) => 'slideTarget' in style) as { slideTarget: number };
  const fade = styles.find((style) => 'fadeTarget' in style) as { fadeTarget: number };
  return { row: slide.slideTarget / STYLES.prayer.height, opacity: fade.fadeTarget };
};

describe('the pill ActiveBackground draws (real London 2026 days)', () => {
  it("keeps the row it drew last once no row is next: Saturday's Isha, then the end of the sequence", () => {
    storeLondonDays();

    expect(show(ScheduleType.Standard, ['2026-09-12', '20:00'])).toBe('2026-09-12');
    expect(drawnPill(ScheduleType.Standard)).toEqual({ row: 5, opacity: 1 });

    expect(show(ScheduleType.Standard, ['2026-09-12', '22:00'])).toBeNull();
    expect(drawnPill(ScheduleType.Standard)).toEqual({ row: 5, opacity: 0 });
  });

  it("slides under the row drawn for the next prayer: Friday's Istijaba, index 0 of a reversed list, drawn last", () => {
    storeLondonDays();

    expect(show(ScheduleType.Extra, ['2026-09-11', '12:00'], reversed)).toBe('2026-09-11');
    expect(drawnPill(ScheduleType.Extra)).toEqual({ row: 4, opacity: 1 });
  });

  it('fades for an overlay open on another row of its own page, and stays for one open on the other page', () => {
    storeLondonDays();
    show(ScheduleType.Extra, ['2026-09-11', '12:00'], reversed);
    show(ScheduleType.Standard, ['2026-09-11', '12:00']);
    mockStore.current.set(overlayAtom, { isOn: true, selectedPrayerIndex: 2, scheduleType: ScheduleType.Extra });

    expect(drawnPill(ScheduleType.Extra)).toEqual({ row: 4, opacity: 0 });
    expect(drawnPill(ScheduleType.Standard)).toEqual({ row: 2, opacity: 1 });
  });
});
