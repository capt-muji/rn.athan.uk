/**
 * Whether the user actually waved: that a still phone never satisfies the gesture, that a waved one does, and
 * that progress is credited for motion rather than for waiting
 */

import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { useQiblaShake } from '@/hooks/useQiblaShake';
import { SHAKE } from '@/shared/qiblaShake';

/** The shared value the hook reads, captured so a test can write readings into the very object it watches */
let sensor: { value: { x: number; y: number; z: number; interfaceOrientation: number } } | null = null;

/** Counts its own renders, because the gate publishing per reading is what made it take seconds on a device */
let renders = 0;

const Probe = ({ active }: { active: boolean }) => {
  const { hasWaved } = useQiblaShake(active);
  renders += 1;

  return <Text>{`${hasWaved}`}</Text>;
};

/** Whether the probe reports the gesture done */
const reported = () => screen.getByText(/true|false/).props.children === 'true';

/**
 * Delivers `count` readings at `magnitude` metres per second squared away from gravity, advancing the clock the
 * way the sensor would. The hook reads the sensor through `useAnimatedReaction`, which the components setup runs
 * on every render, so each reading is one write plus one re-render.
 */
const deliver = async (rerender: (ui: React.ReactElement) => void, magnitude: number, count: number, stepMs = 20) => {
  for (let index = 0; index < count; index++) {
    await act(async () => {
      jest.advanceTimersByTime(stepMs);
      // Each reading differs from the one before it, because the reaction skips a repeated value exactly as a
      // real sensor's stream never repeats a float. The jitter is what a hand actually delivers
      if (sensor) {
        // SWINGS either side of rest, because the gate reads how much the reading MOVES rather than how large
        // it is: a constant feed, however big, is a phone nobody is touching
        const swing = magnitude * Math.sin((index / 4) * Math.PI);
        sensor.value = { x: 0, y: 0, z: swing + index * 1e-6, interfaceOrientation: 0 };
      }
      rerender(<Probe active />);
    });
  }
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-10-02T12:00:00Z') });
  sensor = null;
  const real = Reanimated.useAnimatedSensor;
  jest.spyOn(Reanimated, 'useAnimatedSensor').mockImplementation((...args) => {
    const armed = real(...args);
    sensor = armed.sensor as typeof sensor;

    return armed;
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the wave the hint asks for', () => {
  it('reports nothing done before any reading arrives', async () => {
    await render(<Probe active />);

    expect(reported()).toBe(false);
  });

  // The owner's own phone sits tilted on a magnetic desk: it must never satisfy the gesture by sitting there
  it('never credits a phone lying still', async () => {
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 0.02, 60);

    expect(reported()).toBe(false);
  });

  it('opens the gate once the whole wave has been performed', async () => {
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 5, Math.ceil(SHAKE.requiredMs / 20) + 10);

    expect(reported()).toBe(true);
  });

  // THE DEFECT THIS PINS, measured by the owner on both phones: the gate took about three seconds for a
  // gesture asking half a second, because publishing progress per reading meant 50 React renders a second,
  // and a saturated JS thread then delivered readings too slowly for the window to hold its own minimum
  it('renders once for the whole gesture rather than once per reading', async () => {
    const { rerender } = await render(<Probe active />);
    const readings = Math.ceil(SHAKE.requiredMs / 20) + 10;
    renders = 0;

    await deliver(rerender, 5, readings);

    // Each `deliver` re-renders the probe itself, so the hook's own contribution is what is over that floor
    expect(renders - readings).toBeLessThanOrEqual(2);
  });

  it('stops sampling once the gate is open, because nothing can change its answer', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, Math.ceil(SHAKE.requiredMs / 20) + 10);
    renders = 0;

    await deliver(rerender, 5, 60);

    expect(renders - 60).toBeLessThanOrEqual(1);
  });

  // Time spent in motion, not wall time: a user who waves, stops and waves again keeps what they have done
  it('carries on from where it stopped when the user waves again', async () => {
    const half = Math.ceil(SHAKE.requiredMs / 20 / 2);
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 5, half);
    expect(reported()).toBe(false);
    await deliver(rerender, 0.02, 40);
    await deliver(rerender, 5, half + 6);

    expect(reported()).toBe(true);
  });

  // The gesture is a one-time entry condition: re-testing it would take the compass away the moment the user
  // held the phone still to READ it, which is exactly when they need it
  it('keeps the gate open once it is open, however still the phone goes', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, Math.ceil(SHAKE.requiredMs / 20) + 10);

    await deliver(rerender, 0.02, 200);

    expect(reported()).toBe(true);
  });

  // The sensor is armed only while the hint is up, so what it collected must not survive into the next open
  it('closes the gate again when the hint goes away, so the next open earns its own wave', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, Math.ceil(SHAKE.requiredMs / 20) + 10);

    await act(async () => {
      rerender(<Probe active={false} />);
    });

    expect(reported()).toBe(false);
  });

  it('counts nothing while it is inactive, however hard the phone is moved', async () => {
    const { rerender } = await render(<Probe active={false} />);

    for (let index = 0; index < 40; index++) {
      await act(async () => {
        jest.advanceTimersByTime(20);
        if (sensor) sensor.value = { x: 0, y: 0, z: 5 * Math.sin((index / 4) * Math.PI), interfaceOrientation: 0 };
        rerender(<Probe active={false} />);
      });
    }

    expect(reported()).toBe(false);
  });
});
