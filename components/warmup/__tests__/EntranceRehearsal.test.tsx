/**
 * Unit tests for components/warmup/EntranceRehearsal.tsx
 *
 * The rehearsal's contracts: it never asks any entrance hook family for a target outside the zero-amplitude pair
 * (0 and one rounding-step epsilon), its legs run out and back through the same timed path the entrance rides, it
 * reports completion exactly once, and it never touches the overlay's own state. Settles arrive deferred through the
 * runOnJS spy and completions are fired by hand, so nothing about frame timing is shown here.
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai/vanilla';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import EntranceRehearsal from '@/components/warmup/EntranceRehearsal';
import { currentFadeGeneration, overlayAtom, overlayFadeSettledAtom } from '@/stores/atoms/overlay';

jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));

const mockRehearsalSettled = jest.fn();
jest.mock('@/stores/warmup', () => {
  const actual = jest.requireActual<typeof import('@/stores/warmup')>('@/stores/warmup');
  return { ...actual, markRehearsalSettled: (...args: unknown[]) => mockRehearsalSettled(...args) };
});

/** One rounding step below any 8-bit channel change the mappers can interpolate */
const EPSILON = 0.0001;

type TimingCall = { toValue: number; callback?: (finished: boolean) => void };
const timingCalls: TimingCall[] = [];
/** Everything the rig posts to the JS thread, deferred as the real runOnJS defers */
const postedToJs: (() => void)[] = [];

beforeEach(() => {
  mockRehearsalSettled.mockClear();
  timingCalls.length = 0;
  postedToJs.length = 0;
  jest.spyOn(Reanimated, 'withTiming').mockImplementation(((
    toValue: number,
    _config: unknown,
    callback?: (finished: boolean) => void
  ) => {
    timingCalls.push({ toValue, callback });
    return toValue;
  }) as typeof Reanimated.withTiming);
  jest.spyOn(Reanimated, 'runOnJS').mockImplementation(((fn: (...args: never[]) => unknown) => {
    return (...args: never[]) => {
      postedToJs.push(() => fn(...args));
    };
  }) as typeof Reanimated.runOnJS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const onlyZeroAmplitude = () => timingCalls.every((call) => call.toValue === 0 || call.toValue === EPSILON);

/** Delivers the posted settles, as the JS thread would once its queue drains */
const flushPostedSettles = async () => {
  const due = [...postedToJs];
  postedToJs.length = 0;
  await act(async () => {
    for (const posted of due) posted();
  });
};

/** Completes the newest timed leg and delivers the settle it posted */
const settleNewestLeg = async () => {
  const newest = [...timingCalls].reverse().find((call) => call.callback !== undefined);
  await act(async () => {
    newest?.callback?.(true);
  });
  await flushPostedSettles();
};

describe('the overlay entrance rehearsal', () => {
  it('sits off-screen, untouchable and unreadable, so no frame of it can reach the display', async () => {
    await render(<EntranceRehearsal />);

    const host = screen.root;
    expect(host).not.toBeNull();
    const style = StyleSheet.flatten(host!.props.style) as { top?: number };
    expect(style.top).toBe(-10000);
    expect(host!.props.pointerEvents).toBe('none');
    expect(host!.props.accessibilityElementsHidden).toBe(true);
    expect(host!.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('walks its legs out and back through the timed path, never leaving the zero-amplitude pair', async () => {
    await render(<EntranceRehearsal />);

    // Before the mount snap's settle is delivered, no leg has been asked for
    expect(timingCalls).toEqual([]);
    expect(mockRehearsalSettled).not.toHaveBeenCalled();

    // The snap settle starts the out leg
    await flushPostedSettles();
    expect(timingCalls.map((call) => call.toValue)).toContain(EPSILON);
    expect(onlyZeroAmplitude()).toBe(true);

    // The out leg's settle starts the back leg
    await settleNewestLeg();
    expect(timingCalls.map((call) => call.toValue)).toContain(0);
    expect(onlyZeroAmplitude()).toBe(true);
  });

  it('reports completion exactly once, only after the back leg settled', async () => {
    await render(<EntranceRehearsal />);
    await flushPostedSettles();

    await settleNewestLeg();
    expect(mockRehearsalSettled).not.toHaveBeenCalled();

    await settleNewestLeg();
    expect(mockRehearsalSettled).toHaveBeenCalledTimes(1);

    // A late extra settle (a resume, a resync) reports nothing further
    await settleNewestLeg();
    expect(mockRehearsalSettled).toHaveBeenCalledTimes(1);
  });

  it('never writes the overlay family state it rehearses for', async () => {
    const store = getDefaultStore();
    const generationBefore = currentFadeGeneration();

    await render(<EntranceRehearsal />);
    await flushPostedSettles();
    await settleNewestLeg();
    await settleNewestLeg();

    expect(store.get(overlayAtom).isOn).toBe(false);
    expect(store.get(overlayFadeSettledAtom)).toBe(true);
    expect(currentFadeGeneration()).toBe(generationBefore);
  });
});
