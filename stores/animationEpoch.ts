/**
 * The animation epoch: while any settle-gated animation runs, per-second writes
 * skip, and the next tick heals what was deferred - the same self-heal the
 * countdown bar documents (a write dropped while the host was suspended is
 * replaced by the next tick's).
 *
 * The owner's architecture ruling: nothing writes during an animation. A wall
 * second shared with an entrance or a fade would land a store commit inside
 * the animation's window, so the tick itself stands down for the epoch's
 * duration. The writers that own an animation open the epoch when they start
 * it and close it at its settle; a settle that never comes (a superseded
 * animation whose owner is gone) is unstuck by the staleness valve rather than
 * freezing the display forever.
 */

import logger from '@/shared/logger';

/**
 * No animation this app gates runs longer than this, and it sits under one
 * tick interval. An epoch still open past it is a settle that never fired, and
 * the display's correctness outranks the gate: ticks resume.
 */
const EPOCH_STALE_MS = 600;

let openSinceMs: number | null = null;

/** Opens the epoch: called by a writer as its animation starts */
export const openAnimationEpoch = () => {
  // A still-warm epoch keeps its earliest opening (the union window covers an
  // animation that started beside another); a stale one is re-anchored here
  if (openSinceMs === null || Date.now() - openSinceMs > EPOCH_STALE_MS) openSinceMs = Date.now();
};

/** Closes the epoch: called from the animation's own settle, never a wall timer */
export const closeAnimationEpoch = () => {
  openSinceMs = null;
};

/**
 * Whether an epoch is open, with the staleness valve applied: an epoch held
 * past the valve is a lost settle, reported once and dropped, so a stuck epoch
 * can never freeze the ticking display. A stamp from the future (a clock that
 * moved back) is the same nonsense and drops the same way.
 */
export const animationEpochOpen = (): boolean => {
  if (openSinceMs === null) return false;

  const heldFor = Date.now() - openSinceMs;
  if (heldFor < 0 || heldFor > EPOCH_STALE_MS) {
    openSinceMs = null;
    if (heldFor > 0) logger.warn('ANIMATION EPOCH: a settle never came; ticks resume', { heldForMs: heldFor });
    return false;
  }

  return true;
};
