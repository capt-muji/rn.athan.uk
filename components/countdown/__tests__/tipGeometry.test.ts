/**
 * The countdown bar's tip must stay inside its track.
 *
 * The oval is centred on the container's `left`, so its edges are at
 * `left ± TIP_OVAL_WIDTH / 2`. Before the clamp it overhung the track at both
 * ends; the visible symptom was the bar looking ~2 physical pixels too long when
 * full (0.6dp at ~3x density).
 */

import { COUNTDOWN_BAR, COUNTDOWN_TIP } from '@/shared/constants';

import { TIP_OVAL_WIDTH, tipLeftForProgress } from '../tipGeometry';

const HALF = TIP_OVAL_WIDTH / 2;
const leftEdge = (left: number) => left - HALF;
const rightEdge = (left: number) => left + HALF;
const unclamped = (progress: number) => (progress / 100) * COUNTDOWN_BAR.WIDTH - COUNTDOWN_TIP.OFFSET;

describe('tipLeftForProgress', () => {
  it('keeps the oval inside the track at both ends', () => {
    expect(leftEdge(tipLeftForProgress(0))).toBeGreaterThanOrEqual(0);
    expect(rightEdge(tipLeftForProgress(100))).toBeLessThanOrEqual(COUNTDOWN_BAR.WIDTH);
  });

  it('keeps it inside across the whole range', () => {
    const outside: number[] = [];

    for (let progress = 0; progress <= 100; progress += 0.5) {
      const left = tipLeftForProgress(progress);
      if (leftEdge(left) < 0 || rightEdge(left) > COUNTDOWN_BAR.WIDTH) outside.push(progress);
    }

    expect(outside).toEqual([]);
  });

  it('is the overhang that was reported: unclamped, a full bar spills past the track', () => {
    expect(rightEdge(unclamped(100))).toBeGreaterThan(COUNTDOWN_BAR.WIDTH);
    expect(leftEdge(unclamped(0))).toBeLessThan(0);
  });

  it('leaves ordinary positions exactly where they were', () => {
    // 65 is the colour picker's preview; the clamp must not move it
    for (const progress of [10, 25, 50, 65, 75, 90]) {
      expect(tipLeftForProgress(progress)).toBeCloseTo(unclamped(progress), 10);
    }
  });

  it('never moves backwards as progress grows', () => {
    let previous = tipLeftForProgress(0);

    for (let progress = 0.5; progress <= 100; progress += 0.5) {
      const left = tipLeftForProgress(progress);
      expect(left).toBeGreaterThanOrEqual(previous);
      previous = left;
    }
  });
});
