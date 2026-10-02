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

const Probe = ({ active }: { active: boolean }) => {
  const { progress, isWaving } = useQiblaShake(active);

  return <Text>{`${progress.toFixed(3)}|${isWaving}`}</Text>;
};

/** What the probe currently reports, as the hook's two values */
const reported = () => {
  const [progress, waving] = screen.getByText(/\|/).props.children.split('|');

  return { progress: Number(progress), isWaving: waving === 'true' };
};

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
        const jitter = magnitude === 0 ? 0 : magnitude * (1 + (index % 5) * 0.03);
        sensor.value = { x: 0, y: 0, z: 9.81 + jitter + index * 1e-6, interfaceOrientation: 0 };
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

    expect(reported()).toEqual({ progress: 0, isWaving: false });
  });

  // The owner's own phone sits tilted on a magnetic desk: it must never satisfy the gesture by sitting there
  it('never credits a phone lying still', async () => {
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 0.02, 60);

    expect(reported()).toEqual({ progress: 0, isWaving: false });
  });

  it('credits a phone being waved', async () => {
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 5, 40);

    expect(reported().isWaving).toBe(true);
    expect(reported().progress).toBeGreaterThan(0);
  });

  it('reaches the whole way after the time the owner asked for', async () => {
    const { rerender } = await render(<Probe active />);

    await deliver(rerender, 5, Math.ceil(SHAKE.requiredMs / 20) + 10);

    expect(reported().progress).toBe(1);
  });

  // Time spent in motion, not wall time: a user who stops stops EARNING, rather than losing what they did. The
  // window takes its own length to empty of motion, so progress settles shortly after they stop rather than at
  // the instant they do
  it('stops earning when the user stops, and keeps what they already did', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, 40);

    await deliver(rerender, 0.02, 120);
    const settled = reported().progress;
    await deliver(rerender, 0.02, 60);

    expect(reported().isWaving).toBe(false);
    expect(reported().progress).toBe(settled);
    expect(settled).toBeGreaterThan(0);
  });

  it('carries on from where it stopped when the user waves again', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, 30);
    const earned = reported().progress;
    await deliver(rerender, 0.02, 40);

    await deliver(rerender, 5, 30);

    expect(reported().progress).toBeGreaterThan(earned);
  });

  // The sensor is armed only while the hint is up, so what it collected must not survive into the next open
  it('forgets everything when the hint goes away', async () => {
    const { rerender } = await render(<Probe active />);
    await deliver(rerender, 5, 40);

    await act(async () => {
      rerender(<Probe active={false} />);
    });

    expect(reported()).toEqual({ progress: 0, isWaving: false });
  });

  it('counts nothing while it is inactive, however hard the phone is moved', async () => {
    const { rerender } = await render(<Probe active={false} />);

    for (let index = 0; index < 40; index++) {
      await act(async () => {
        jest.advanceTimersByTime(20);
        if (sensor) sensor.value = { x: 0, y: 0, z: 9.81 + 5 + index * 1e-6, interfaceOrientation: 0 };
        rerender(<Probe active={false} />);
      });
    }

    expect(reported()).toEqual({ progress: 0, isWaving: false });
  });
});
