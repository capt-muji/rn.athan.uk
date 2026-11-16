/**
 * The fasting card through the owner-locked design round: the four toggle rows
 * with their always-on identity dots (the Muhammad row carrying the honorific
 * ligature in the hint's own ink), the sky note, and the strip below it - the
 * calendar glyph first, today's digit second, one seamless bar the row itself
 * paints over nine days, the digits Hijri under the preference - locked to a
 * dim shadow of itself while the Suhoor athan is off. The sheet's own flows
 * (the draft-and-commit at close) live in Alert.test.tsx.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';
import type { TestInstance, TestNode } from 'test-renderer';

import { london } from '@/hooks/__tests__/londonDays';
import { COLORS, SPACING } from '@/shared/constants';
import { __resetHijriMemoForTests } from '@/shared/fasting';
import { t } from '@/shared/i18n';
import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { type FastingSelection, ScheduleType } from '@/shared/types';
import { fastingDawoodAnchorAtom } from '@/stores/notifications';
import { setSequence } from '@/stores/schedule';
import { __installTimetableDays, __resetTimetableForTest } from '@/stores/timetable';
import { hijriDateEnabledAtom } from '@/stores/ui';

import FastingCard from '../FastingCard';

// A locked Toggle refuses the press itself, so the row's own guard against a locked
// press never runs behind it today. The stand-in hands the row that press - the
// alert sheet's own pattern - so the guard stays pinned for the day a control
// stops refusing
let mockLockedPressesGetThrough = false;
jest.mock('@/components/sheets/parts/Toggle', () => {
  const parts = jest.requireActual('@/components/sheets/parts/Toggle');
  const { createElement, forwardRef, useImperativeHandle } = require('react');
  const { Pressable } = require('react-native');

  const StandIn = forwardRef(function Toggle(
    props: { value: boolean; disabled?: boolean; onToggle: (next: boolean) => void },
    ref: unknown
  ) {
    useImperativeHandle(ref as never, () => ({ press: () => props.onToggle(!props.value) }));
    return createElement(Pressable, {
      accessibilityRole: 'switch',
      accessibilityState: { checked: props.value, disabled: props.disabled === true },
      onPress: () => props.onToggle(!props.value),
    });
  });

  const Toggle = (props: Record<string, unknown>) =>
    mockLockedPressesGetThrough ? createElement(StandIn, props) : createElement(parts.default, props);

  return { __esModule: true, default: Toggle };
});

const store = getDefaultStore();

const TIMES = { fajr: '05:50', sunrise: '07:30', dhuhr: '13:00', asr: '16:00', magrib: '19:00', isha: '20:30' };

const GREEN = 'rgba(74, 222, 128, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';
const BAR_FILL = 'rgba(56, 189, 248, 0.05)';
const ARMED_FILL = 'rgba(56, 189, 248, 0.16)';
const SKY_INK = '#33a7e0';
const CELL_INK_FADED = '#487ca5';
const DIVIDER_INK = 'rgba(56, 189, 248, 0.02)';
// #1B1967, the rings' deep background shade, as RNSVG resolves it at render
const RING = 'rgba(27, 25, 103, 1)';

type FlatStyle = Record<string, unknown>;

const flat = (node: TestInstance): FlatStyle => (StyleSheet.flatten(node.props.style) ?? {}) as FlatStyle;

const isInstance = (node: TestNode): node is TestInstance => typeof node !== 'string';

/** 1-10 April 2026: the 1st-3rd are the white days of Shawwal 1447, the 2nd a Thursday */
const installAprilDays = (breakFajrOn = '') =>
  __installTimetableDays(
    Array.from({ length: 10 }, (_, i) => {
      const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      const times = date === breakFajrOn ? { ...TIMES, fajr: null } : TIMES;
      return minutesToRecord(date, toDayMinutes(times));
    })
  );

/** Wednesday 1 April 2026 at noon: today's 05:30 suhoor is already spent */
const showAprilWindow = (breakFajrOn = '') => {
  const now = london('2026-04-01', '12:00');
  jest.useFakeTimers({ now });
  installAprilDays(breakFajrOn);
  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);
};

const settle = () => act(() => jest.runAllTimersAsync());

const selection = (over: Partial<FastingSelection> = {}): FastingSelection => ({
  mode: 'everyDay',
  whiteDaysAddOn: false,
  ...over,
});

const rowSwitch = (mode: string) => screen.getByRole('switch', { name: t(`fasting.mode.${mode}` as never) });

/** A row's own title Text: the Muhammad row nests the honorific span, so the title is matched by prefix */
const rowTitle = (mode: string) =>
  screen.getAllByText(new RegExp(`^${t(`fasting.mode.${mode}` as never)}`))[0] as TestInstance;

/** A row's own accessible name: the Muhammad row speaks the honorific with its title */
const rowLabel = (mode: string) => {
  const title = t(`fasting.mode.${mode}` as never);
  return mode === 'muhammad' ? `${title} \uFDFA` : title;
};

const renderCard = async (sel: FastingSelection, onSelectionChange = jest.fn(), locked = false) => {
  const view = await render(<FastingCard selection={sel} onSelectionChange={onSelectionChange} locked={locked} />);
  await settle();
  return view;
};

/** The strip's own bar: the one row that paints the whole strip's fill */
const stripRow = () =>
  screen.container.queryAll((node) => {
    const style = flat(node);
    return style.flexDirection === 'row' && style.backgroundColor === BAR_FILL;
  })[0];

/** The strip's content cells in draw order: the calendar glyph's block, then today first */
const stripCells = () => stripRow().children.filter(isInstance).slice(1);

const digitOf = (cell: TestInstance) =>
  cell.children
    .filter(isInstance)
    .map((child) => child.props.children)
    .find((value) => typeof value === 'string');

const digits = () => stripCells().map((cell) => digitOf(cell));

const cellByDigit = (digit: string) => stripCells().find((cell) => digitOf(cell) === digit)!;

/** The cell's digit text: the one child holding a bare string */
const textOf = (cell: TestInstance) =>
  cell.children.filter(isInstance).find((child) => typeof child.props.children === 'string') as TestInstance;

/** The armed cell's cluster rider: the absolute child pinned to the square's top */
const clusterOf = (cell: TestInstance) =>
  cell.children.filter(isInstance).find((child) => flat(child).position === 'absolute')!;

interface RingDotProps {
  fill: string | { payload: number };
  r: number;
  stroke: string | { payload: number };
  strokeWidth: number;
}

/** A color prop as the app's own string: RNSVG resolves it into an ARGB payload at render */
const colorOf = (value: string | { payload: number }): string => {
  if (typeof value === 'string') return value;
  const argb = value.payload >>> 0;
  return `rgba(${(argb >>> 16) & 255}, ${(argb >>> 8) & 255}, ${argb & 255}, ${((argb >>> 24) & 255) / 255})`;
};

const circlesOf = (host: TestInstance) =>
  host
    .queryAll((node) => node.type === 'RNSVGCircle')
    .map((node) => {
      const props = node.props as RingDotProps;
      return { ...props, fill: colorOf(props.fill), stroke: colorOf(props.stroke) };
    });

afterEach(() => {
  jest.useRealTimers();
  __resetTimetableForTest();
});

describe('the rows', () => {
  it('draws the four options with their toggles, the selection marked', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'whiteDays' }));

    expect(rowSwitch('everyDay')).not.toBeChecked();
    expect(rowSwitch('whiteDays')).toBeChecked();
    expect(rowSwitch('muhammad')).not.toBeChecked();
    expect(rowSwitch('dawood')).not.toBeChecked();
  });

  it('marks the add-on on its regimen row beside the white-days row', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(rowSwitch('muhammad')).toBeChecked();
    expect(rowSwitch('whiteDays')).toBeChecked();
  });

  it('reads a stored pair off the six sets before drafting', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'whiteDays', whiteDaysAddOn: true }));

    expect(rowSwitch('whiteDays')).toBeChecked();
    expect(screen.getByText(t('fasting.description.whiteDays'))).toBeOnTheScreen();
  });

  it('hands the sheet the tap rule landing from a toggle press', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }), onSelectionChange);

    await fireEvent.press(rowSwitch('dawood'));
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith('dawood');
  });

  it('hands the sheet the same landing from a press on the row itself', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'everyDay' }), onSelectionChange);

    await fireEvent.press(screen.getAllByLabelText(rowLabel('muhammad'))[0]);
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith('muhammad');
  });

  it('hands the sheet nothing when the only selected option is tapped, switch or row', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'muhammad' }), onSelectionChange);

    await fireEvent.press(rowSwitch('muhammad'));
    await settle();
    await fireEvent.press(screen.getAllByLabelText(rowLabel('muhammad'))[0]);
    await settle();

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  describe('the answer to a tap that changes nothing', () => {
    it('gives the only selected option the same impact, switch or row', async () => {
      showAprilWindow();
      const onSelectionChange = jest.fn();
      await renderCard(selection({ mode: 'muhammad' }), onSelectionChange);

      await fireEvent.press(rowSwitch('muhammad'));
      await fireEvent.press(screen.getAllByLabelText(rowLabel('muhammad'))[0]);
      await settle();

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
      expect(Haptics.impactAsync).toHaveBeenNthCalledWith(1, Haptics.ImpactFeedbackStyle.Medium);
      expect(Haptics.impactAsync).toHaveBeenNthCalledWith(2, Haptics.ImpactFeedbackStyle.Medium);
    });

    it("gives a locked card's row and switch the same impact, landing nothing", async () => {
      showAprilWindow();
      const onSelectionChange = jest.fn();
      await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }), onSelectionChange, true);

      await fireEvent.press(screen.getAllByLabelText(rowLabel('dawood'))[0]);
      await fireEvent.press(rowSwitch('dawood'));
      await settle();

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
      expect(Haptics.impactAsync).toHaveBeenNthCalledWith(1, Haptics.ImpactFeedbackStyle.Medium);
      expect(Haptics.impactAsync).toHaveBeenNthCalledWith(2, Haptics.ImpactFeedbackStyle.Medium);
    });

    it('fires the impact exactly once for a changing tap', async () => {
      showAprilWindow();
      const onSelectionChange = jest.fn();
      await renderCard(selection({ mode: 'everyDay' }), onSelectionChange);

      await fireEvent.press(screen.getAllByLabelText(rowLabel('muhammad'))[0]);
      await settle();

      expect(onSelectionChange).toHaveBeenCalledWith('muhammad');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });
  });

  it('reports each of two rapid taps as its own mode, dropping neither', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'everyDay' }), onSelectionChange);

    await fireEvent.press(rowSwitch('muhammad'));
    await fireEvent.press(rowSwitch('whiteDays'));
    await settle();

    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenNthCalledWith(1, 'muhammad');
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, 'whiteDays');
  });

  it("fades the separators to the strip round's own two percent", async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad' }));

    const separators = screen.container.queryAll((node) => flat(node).backgroundColor === DIVIDER_INK);
    expect(separators).toHaveLength(3);
  });

  it('rides the honorific ligature after Muhammad alone, in the hint ink, locked and not', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'everyDay' }));

    // The owner-ordered code value: byte-identical in every language, never translated
    const spans = screen.getAllByText(' \uFDFA');
    expect(spans).toHaveLength(1);
    const span = spans[0];
    expect(span.parent).toBe(rowTitle('muhammad'));
    expect(flat(span)).toMatchObject({ color: COLORS.text.sheetSubtitle });

    for (const plain of ['everyDay', 'dawood', 'whiteDays'] as const) {
      const text = rowTitle(plain);
      expect(text.children.filter(isInstance)).toHaveLength(0);
    }
  });

  it('dims the honorific with the hint under the locked card', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'everyDay' }), jest.fn(), true);

    expect(flat(screen.getByText(' \uFDFA'))).toMatchObject({ color: '#122246' });
  });
});

describe('the sky note', () => {
  it('speaks the whole selection, following the draft', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(screen.getByText(t('fasting.description.muhammadWhiteDays'))).toBeOnTheScreen();
  });

  it("breaks its copy earlier, half the box's side padding again each side", async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(flat(screen.getByText(t('fasting.description.muhammadWhiteDays')))).toMatchObject({ paddingHorizontal: 7 });
  });
});

describe('the calendar strip', () => {
  beforeEach(() => {
    store.set(hijriDateEnabledAtom, false);
  });

  it('carries the glyph block and nine days, today first, with the Gregorian digits', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(digits()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('carries no heading anywhere', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(screen.queryByText('NEXT SAHUR')).toBeNull();
    expect(screen.queryByText('CALENDAR')).toBeNull();
    expect(screen.queryByText('HIJRI CALENDAR')).toBeNull();
  });

  it('hides entirely on every day', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'everyDay' }));

    expect(stripRow()).toBeUndefined();
    expect(screen.getByText(t('fasting.description.everyDay'))).toBeOnTheScreen();
  });

  describe('under the Hijri preference', () => {
    it('speaks the Hijri digits, the white days 13 to 15 of Shawwal', async () => {
      showAprilWindow();
      store.set(hijriDateEnabledAtom, true);
      await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

      // 1-3 April are the white days 13-15 of Shawwal; today leads the window
      expect(digits()).toEqual(['13', '14', '15', '16', '17', '18', '19', '20', '21']);
    });

    it('keeps the Gregorian digits once the preference is off', async () => {
      showAprilWindow();
      store.set(hijriDateEnabledAtom, true);
      store.set(hijriDateEnabledAtom, false);
      await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

      expect(digits()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });
  });

  it("speaks today's digit in pure white, the armed days in the note's sky, the rest faded", async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(flat(textOf(cellByDigit('1'))).color).toBe('#fff');
    for (const armed of ['2', '3', '6', '9']) {
      expect(flat(textOf(cellByDigit(armed))).color).toBe(SKY_INK);
    }
    for (const plain of ['4', '5', '7', '8']) {
      expect(flat(textOf(cellByDigit(plain))).color).toBe(CELL_INK_FADED);
    }
  });

  it('paints one seamless bar: the row carries the fill, only the armed days overlay theirs', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    const bar = stripRow();
    expect(flat(bar)).toMatchObject({ height: 30, borderRadius: 7, backgroundColor: BAR_FILL });
    expect(flat(bar.parent!)).toMatchObject({ marginTop: SPACING.smd * 1.25 });
    expect(bar.children).toHaveLength(10);

    // The first block is the calendar glyph itself: the Bootstrap geometry at
    // 12pt, tinted the information glyph's own ink
    const glyphHost = bar.children.filter(isInstance)[0];
    const glyphPath = glyphHost.queryAll((node) => node.type === 'RNSVGPath')[0];
    expect(glyphPath.props.d).toContain('M3.5 0a.5.5');
    expect(flat(glyphHost)).toMatchObject({ flex: 1 });

    // The note breathes its grown gap on BOTH sides: below it the strip, above it the rows
    const noteRow = screen.getByText(t('fasting.description.muhammadWhiteDays')).parent!;
    expect(flat(noteRow.parent!)).toMatchObject({ marginTop: SPACING.smd * 1.25 });

    for (const armed of ['1', '2', '3', '6', '9']) {
      expect(flat(cellByDigit(armed))).toMatchObject({ backgroundColor: ARMED_FILL });
    }
    for (const plain of ['4', '5', '7', '8']) {
      expect(flat(cellByDigit(plain)).backgroundColor).toBeUndefined();
    }
    for (const cell of stripCells()) {
      expect(flat(cell).borderRightWidth).toBeUndefined();
      expect(flat(cell).borderLeftWidth).toBeUndefined();
      expect(flat(cell).flex).toBe(1);
    }

    // The armed overlay respects the bar's rounded end: the last cell rounds right
    expect(flat(cellByDigit('9'))).toMatchObject({ borderTopRightRadius: 7, borderBottomRightRadius: 7 });
  });

  it("rides the bell's own cluster on an armed block, hairline-ringed, flush right at its top", async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    // The 2nd is both a Muhammad day and a white day: white beneath at the left, green on top at the right
    const rider = clusterOf(cellByDigit('2'));
    expect(flat(rider)).toMatchObject({ position: 'absolute', top: -2.25, end: 1.5 });
    expect(circlesOf(rider).map((circle) => circle.fill)).toEqual([WHITE, GREEN]);
    for (const circle of circlesOf(rider)) {
      expect(circle).toMatchObject({ r: 2, stroke: RING, strokeWidth: 0.5 });
    }
    const dots = rider.queryAll((node) => {
      const style = flat(node);
      return style.position === 'absolute' && style.top === undefined;
    });
    expect(dots.map((dot) => flat(dot).left)).toEqual([0, 4.5 * 0.6]);
    expect(flat(dots[0].parent!).width).toBeCloseTo(7.2);

    // The 3rd is a white day alone: one circle in the pair's right slot
    const lone = clusterOf(cellByDigit('3'));
    expect(circlesOf(lone).map((circle) => circle.fill)).toEqual([WHITE]);
    const loneWrapper = lone.queryAll((node) => flat(node).height === 4.5)[0];
    expect(flat(loneWrapper).width).toBeCloseTo(7.2);
  });

  it('alternates from now under dawood with no stored cycle', async () => {
    showAprilWindow();
    store.set(fastingDawoodAnchorAtom, 0);
    await renderCard(selection({ mode: 'dawood' }));

    // No anchor: the cycle starts on the first day whose suhoor is ahead - the
    // 2nd - and every second day from there; yesterday and today stay off
    const armed = stripCells().filter((cell) => flat(cell).backgroundColor === ARMED_FILL);
    expect(armed.map((cell) => digitOf(cell))).toEqual(['2', '4', '6', '8']);
  });

  it('survives a dead Hijri engine with no armed day at all', async () => {
    showAprilWindow();
    __resetHijriMemoForTests();
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementation(() => {
      throw new Error('no calendar support');
    });

    await expect(renderCard(selection({ mode: 'whiteDays' }))).resolves.toBeDefined();

    expect(digits()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    for (const cell of stripCells()) {
      expect(flat(cell).backgroundColor).toBeUndefined();
    }
    spy.mockRestore();
    // The walk memoised null Hijri parts for these dates under the dead engine;
    // clear them or the next suite member reads the poison as gospel
    __resetHijriMemoForTests();
  });

  it('passes over a day whose suhoor row is unreadable under dawood', async () => {
    showAprilWindow('2026-04-02');
    store.set(fastingDawoodAnchorAtom, 0);
    await renderCard(selection({ mode: 'dawood' }));

    // The broken 2nd cannot start the cycle, so the alternation runs from the 3rd
    const armed = stripCells().filter((cell) => flat(cell).backgroundColor === ARMED_FILL);
    expect(armed.map((cell) => digitOf(cell))).toEqual(['3', '5', '7', '9']);
  });

  it('arms nothing when the window holds no row ahead under dawood', async () => {
    // Noon on the 10th: the installed window ends there, so the cycle search finds no trigger
    const now = london('2026-04-10', '12:00');
    jest.useFakeTimers({ now });
    installAprilDays();
    setSequence(ScheduleType.Standard, now);
    setSequence(ScheduleType.Extra, now);
    store.set(fastingDawoodAnchorAtom, 0);
    await renderCard(selection({ mode: 'dawood' }));

    const armed = stripCells().filter((cell) => flat(cell).backgroundColor === ARMED_FILL);
    expect(armed).toEqual([]);
    expect(digits()).toEqual(['10', '11', '12', '13', '14', '15', '16', '17', '18']);
  });

  it('walks ten blocks past the end of the installed window without starving', async () => {
    // Noon on the 10th: the installed window ends there
    const now = london('2026-04-10', '12:00');
    jest.useFakeTimers({ now });
    installAprilDays();
    setSequence(ScheduleType.Standard, now);
    setSequence(ScheduleType.Extra, now);

    await renderCard(selection({ mode: 'muhammad' }));

    expect(digits()).toEqual(['10', '11', '12', '13', '14', '15', '16', '17', '18']);
    const armed = stripCells().filter((cell) => flat(cell).backgroundColor === ARMED_FILL);
    expect(armed.map((cell) => digitOf(cell))).toEqual(['13', '16']);
  });
});

describe('the locked card', () => {
  it('hides the note and the strip, reads every option off, and refuses every press', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    const passed = selection({ mode: 'muhammad', whiteDaysAddOn: true });
    await renderCard(passed, onSelectionChange, true);

    expect(screen.queryByText(t('fasting.description.muhammadWhiteDays'))).toBeNull();
    expect(screen.queryByText('NEXT SAHUR')).toBeNull();
    expect(stripRow()).toBeUndefined();

    for (const mode of ['everyDay', 'muhammad', 'dawood', 'whiteDays']) {
      expect(rowSwitch(mode)).not.toBeChecked();
      expect(rowSwitch(mode)).toBeDisabled();
      await fireEvent.press(rowSwitch(mode));
      await fireEvent.press(screen.getAllByLabelText(rowLabel(mode))[0]);
    }
    await settle();

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(passed).toEqual({ mode: 'muhammad', whiteDaysAddOn: true });
  });

  it('refuses a row press even through a control that stopped refusing', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    mockLockedPressesGetThrough = true;
    try {
      await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }), onSelectionChange, true);
      await fireEvent.press(screen.getAllByLabelText(rowLabel('dawood'))[0]);
      await settle();
    } finally {
      mockLockedPressesGetThrough = false;
    }

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("dims through the locked solids, the row dots at the marks' own depth", async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }), jest.fn(), true);

    expect(flat(screen.getByText(t('fasting.card.title')).parent!)).toMatchObject({
      backgroundColor: '#0c193b',
      borderColor: '#0d193d',
    });
    expect(flat(screen.getByText(t('fasting.card.title'))).color).toBe('#122246');
    expect(flat(screen.getByText(t('fasting.card.hint'))).color).toBe('#122246');
    for (const mode of ['everyDay', 'muhammad', 'dawood', 'whiteDays']) {
      expect(flat(rowTitle(mode)).color).toBe('#122246');
    }

    // The group under its rows: switch, veil, row, mode wrapper, group - the same
    // solid the reminder switches' own locked track carries, so colour alone cannot name it
    expect(flat(rowSwitch('muhammad').parent!.parent!.parent!.parent!)).toMatchObject({ backgroundColor: '#0c193c' });

    const dotSlots = screen.container.queryAll((node) => {
      const style = flat(node);
      return style.width === 14 && style.height === 7;
    });
    expect(dotSlots).toHaveLength(4);
    for (const slot of dotSlots) expect(flat(slot).opacity).toBe(0.05);

    for (const host of screen.getAllByRole('switch')) {
      expect(flat(host.parent!)).toMatchObject({ opacity: 0.4 });
    }
  });

  it('restores the card whole once unlocked', async () => {
    showAprilWindow();
    // No locked prop at all: the sheet's own unarmed render takes the default
    await render(
      <FastingCard selection={selection({ mode: 'muhammad', whiteDaysAddOn: true })} onSelectionChange={jest.fn()} />
    );
    await settle();

    expect(screen.getByText(t('fasting.description.muhammadWhiteDays'))).toBeOnTheScreen();
    expect(digits()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(rowSwitch('muhammad')).toBeChecked();
    expect(rowSwitch('whiteDays')).toBeChecked();
    expect(rowSwitch('muhammad')).toBeEnabled();

    expect(flat(screen.getByText(t('fasting.card.title')).parent!)).toMatchObject({
      backgroundColor: 'rgba(99, 102, 241, 0.06)',
    });
    expect(flat(screen.getByText(t('fasting.card.title'))).color).toBe('#d8eaf8');
    expect(flat(screen.getByText(t('fasting.card.hint'))).color).toBe(COLORS.text.sheetSubtitle);
    expect(flat(rowTitle('muhammad')).color).toBe(COLORS.text.primary);
    expect(screen.container.queryAll((node) => flat(node).backgroundColor === 'rgba(99, 102, 241, 0.03)')).toHaveLength(
      1
    );

    const dotSlots = screen.container.queryAll((node) => {
      const style = flat(node);
      return style.width === 14 && style.height === 7;
    });
    for (const slot of dotSlots) expect(flat(slot).opacity).toBe(0.8);

    for (const host of screen.getAllByRole('switch')) {
      expect(flat(host.parent!).opacity).toBeUndefined();
    }
  });
});
