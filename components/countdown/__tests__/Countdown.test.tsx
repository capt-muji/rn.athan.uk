/**
 * The countdown above a list: the prayer it names, the per-digit time it shows, and the bar under it
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { Easing } from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { ANIMATION, COLORS } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { startCountdowns } from '@/stores/countdown';
import { openOverlay } from '@/stores/overlay';
import { countdownBarShownAtom, showSecondsAtom } from '@/stores/ui';

import Countdown from '../Countdown';

// The dim transition's colours and timings are this suite's subject, so the hook
// answers deterministically at its two anchors and records every call's options
const mockDerivedColorCalls: Array<{ target: number; duration?: number; easing?: unknown }> = [];
jest.mock('@/hooks/useAnimation', () => {
  const actual = jest.requireActual('@/hooks/useAnimation');
  return {
    ...actual,
    useDerivedColor: (
      target: number,
      input: { fromColor: string; toColor: string; duration?: number; easing?: unknown }
    ) => {
      mockDerivedColorCalls.push({ target, duration: input.duration, easing: input.easing });
      return { color: target === 0 ? input.fromColor : input.toColor };
    },
  };
});

const MAGRIB = 4;
// The owner's figures, 2026-10-14: the dim digits and the colon dots sit on the prayer-name colour
const DIM_DIGIT = 'rgba(160, 200, 255, 0.08)';
const COLON_DOT = 'rgba(160, 200, 255, 0.12)';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

/** Every digit node in document order, as its glyph and flattened colour */
const digits = () =>
  screen
    .queryAllByText(/^[0-9]$/)
    .map((node) => ({ char: node.props.children as string, color: flattenStyle(node.props.style).color as string }));

const digitsRead = () =>
  digits()
    .map((digit) => digit.char)
    .join('');

/** The colon dot views: every descendant painted the ruled colon colour */
const colonDots = () =>
  screen.root?.queryAll(
    (node) => (node.props.style === undefined ? {} : flattenStyle(node.props.style)).backgroundColor === COLON_DOT,
    { includeSelf: true }
  ) ?? [];

/**
 * Turns the bar preference on or off. The settings sheet writes it through the atom's own setter, and stores/ui.ts
 * has no setter function for it, so this is the app's own write path
 */
const setCountdownBarShown = (shown: boolean) => getDefaultStore().set(countdownBarShownAtom, shown);

/** The colon-dot containers: the stacked-dot views, whose margins carry the ink compensation */
const colonContainers = () =>
  screen.root?.queryAll(
    (node) => {
      const style = node.props.style === undefined ? {} : flattenStyle(node.props.style);
      return style.flexDirection === 'column' && style.marginLeft !== undefined;
    },
    { includeSelf: true }
  ) ?? [];

beforeEach(() => {
  mockDerivedColorCalls.length = 0;
});

describe('the Standard countdown on Friday 11 September 2026, Asr at 16:29 and Magrib at 19:28', () => {
  it('names Asr for a screen reader and counts down to it in per-digit nodes, at 14:00', async () => {
    showLondonDay('2026-09-11', '14:00');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByRole('text', { name: 'Asr' })).toBeOnTheScreen();
    expect(digitsRead()).toBe('0229');
    expect(colonDots()).toHaveLength(2);
    expect(screen.queryByText('02:29')).toBeNull();
  });

  it('renders the same digits and dots under ar, left to right whatever the layout direction', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    getDefaultStore().set(showSecondsAtom, false);
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(digitsRead()).toBe('0229');
      expect(colonDots()).toHaveLength(2);
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders three digit groups by default, the seconds preference fresh-installed on', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(digitsRead()).toBe('022900');
    expect(colonDots()).toHaveLength(4);
  });

  it('renders the held display as one node, with no digits and no dots', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(digits()).toHaveLength(0);
    expect(colonDots()).toHaveLength(0);
  });

  it('draws each colon as two skinny dots on the ruled colour', async () => {
    showLondonDay('2026-09-11', '14:00');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    const dots = colonDots();
    expect(dots).toHaveLength(2);
    for (const dot of dots) {
      const style = flattenStyle(dot.props.style);
      // The owner-approved dot: 2.5 points square, fully round, half the digits' height
      expect(style.width).toBe(2.5);
      expect(style.height).toBe(2.5);
      expect(style.borderRadius).toBe(1.25);
    }
  });

  it('carries tabular figures on every digit, so no digit change can shift the layout', async () => {
    showLondonDay('2026-09-11', '14:00');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    for (const node of screen.getAllByText(/^[0-9]$/)) {
      expect(flattenStyle(node.props.style).fontVariant).toEqual(['tabular-nums']);
    }
  });

  it('dims a spent hours group and keeps a live zero-minutes group bright, at 00:00 left', async () => {
    showLondonDay('2026-09-11', '14:29');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // 02:00: the hours count on, so the minutes' 00 is a live value and stays bright;
    // the hours' own padding 0 dims, the rule's one always-on case
    const shown = digits();
    expect(shown.map((digit) => digit.char).join('')).toBe('0200');
    expect(shown[0].color).toBe(DIM_DIGIT);
    expect(shown.slice(1).every((digit) => digit.color === COLORS.text.primary)).toBe(true);
  });

  it('dims a spent hours group and a padding zero beside it, at 09 minutes left', async () => {
    showLondonDay('2026-09-11', '16:20');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // 00:09: the hours spent, the minutes' padding 0 dims alone, the 9 and the seconds stay bright
    const shown = digits();
    expect(shown.map((digit) => digit.char).join('')).toBe('000900');
    expect(shown[0].color).toBe(DIM_DIGIT);
    expect(shown[1].color).toBe(DIM_DIGIT);
    expect(shown[2].color).toBe(DIM_DIGIT);
    expect(shown[3].color).toBe(COLORS.text.primary);
    expect(shown[4].color).toBe(COLORS.text.primary);
    expect(shown[5].color).toBe(COLORS.text.primary);
  });

  it('dims hours and minutes at a minute left, keeping the seconds bright', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(400));
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // 00:01:00 exactly (the round-up): the minutes' padding 0 dims with the spent hour, the 1 and the seconds stay bright
    const shown = digits();
    expect(shown.map((digit) => digit.char).join('')).toBe('000100');
    expect(shown.slice(0, 3).every((digit) => digit.color === DIM_DIGIT)).toBe(true);
    expect(shown.slice(3).every((digit) => digit.color === COLORS.text.primary)).toBe(true);
  });

  it('rounds the time left up, so a countdown started 600 ms into 16:28, with 59.4 s left, reads 00:01:00 and not 00:00:59', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(600));

    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getAllByText('0')).toHaveLength(5);
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('holds 00:00:01, never 00:00:00, when the countdown starts half a second after Asr, before the list has moved on', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(60_500));

    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('Asr')).toBeOnTheScreen();
    expect(screen.getAllByText('0')).toHaveLength(5);
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('swaps to Magrib the instant Asr comes, for a countdown started 400 ms into 16:28', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(400));
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => jest.advanceTimersByTime(59_600));

    expect(screen.getByText('Magrib')).toBeOnTheScreen();
    expect(digitsRead()).toBe('0259');
  });

  it('counts down to the prayer the overlay opens on', async () => {
    showLondonDay('2026-09-11', '14:00');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, MAGRIB));

    expect(screen.getByText('Magrib')).toBeOnTheScreen();
    expect(digitsRead()).toBe('0528');
  });

  it('fades a tick fast and linear, and an overlay swap on the overlay own timing', async () => {
    showLondonDay('2026-09-11', '14:00');
    getDefaultStore().set(showSecondsAtom, false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // The countdown's own flips: the fast token, linear
    expect(mockDerivedColorCalls.some((call) => call.duration === ANIMATION.durationFast)).toBe(true);
    expect(mockDerivedColorCalls.every((call) => call.easing === Easing.linear || call.easing === undefined)).toBe(
      true
    );

    mockDerivedColorCalls.length = 0;
    await act(() => openOverlay(ScheduleType.Standard, MAGRIB));

    // The overlay swap: the overlay layer's own duration and its default ease
    expect(
      mockDerivedColorCalls.some((call) => call.duration === ANIMATION.duration && call.easing === undefined)
    ).toBe(true);
  });

  it('compensates the colon beside a 1 and holds the row left to right', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(400));
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // 00:01:00: the second colon sits beside the minutes' 1, so its left margin tightens
    const containers = colonContainers();
    expect(containers).toHaveLength(2);
    const first = flattenStyle(containers[0].props.style);
    const second = flattenStyle(containers[1].props.style);
    expect(first.marginLeft).toBe(4.5);
    expect(first.marginRight).toBe(4.5);
    expect(second.marginLeft).toBe(2.5);
    expect(second.marginRight).toBe(4.5);

    // The row itself never mirrors: the digits read hours first under ar too
    const row = screen.getAllByText('1')[0].parent;
    expect(row === null ? undefined : flattenStyle(row.props.style).direction).toBe('ltr');
  });

  it('shows the bar under the countdown on a fresh install', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('removes the bar the moment the preference is turned off', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => setCountdownBarShown(false));

    expect(screen.queryByRole('progressbar', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('names no prayer after Isha while the next day is not stored, and tells a screen reader why', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    startCountdowns();

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByLabelText('No prayer time to count down to')).toHaveTextContent('...');
    expect(screen.getByText('--:--')).toBeOnTheScreen();
  });
});

describe('the Standard countdown before any list is on screen', () => {
  it('renders nothing, so the page does not show a countdown with nothing behind it', async () => {
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });
});
