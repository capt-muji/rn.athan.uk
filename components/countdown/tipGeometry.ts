/**
 * Countdown-bar tip geometry — pure, so it can be tested without a renderer
 * (same split as components/overlay/catcherGeometry.ts).
 *
 * The tip oval is an absolutely positioned child with no insets inside
 * `tipContainer`, which centres its children and has no width of its own. Yoga
 * therefore centres the oval on the container's origin: its edges sit at
 * `left ± TIP_OVAL_WIDTH / 2`, not at `left`.
 *
 * Unclamped, `left` runs from `-OFFSET` at 0% to `WIDTH - OFFSET` at 100%, which
 * pushes the oval past the track at both ends — about 0.6dp beyond the right
 * edge when the bar is full, which at ~3x density is the ~2 physical pixels of
 * overhang reported as "the bar looks too long when full".
 */

import { COUNTDOWN_BAR, COUNTDOWN_TIP } from '@/shared/constants';

/** Rendered width of the tip oval (a touch wider than the tip itself) */
export const TIP_OVAL_WIDTH = COUNTDOWN_TIP.WIDTH + 1;

/**
 * The tip container's `left` for a given progress, kept inside the track.
 *
 * Only the extremes are affected: the clamp binds below ~2% and above ~98%, so
 * every ordinary position — including the colour picker's 65% preview — keeps
 * the exact value it had before.
 *
 * @param progressPercent Remaining progress, 0-100
 * @returns `left` in dp for the tip container
 */
export const tipLeftForProgress = (progressPercent: number): number => {
  'worklet';
  const half = TIP_OVAL_WIDTH / 2;
  const raw = (progressPercent / 100) * COUNTDOWN_BAR.WIDTH - COUNTDOWN_TIP.OFFSET;

  return Math.min(Math.max(raw, half), COUNTDOWN_BAR.WIDTH - half);
};
