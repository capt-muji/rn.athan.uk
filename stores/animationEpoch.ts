/**
 * The animation epoch: while any settle-gated animation runs, per-second writes
 * skip, and the next tick heals what was deferred - the same self-heal the
 * countdown bar documents (a write dropped while the host was suspended is
 * replaced by the next tick's).
 *
 * The owner's architecture ruling: nothing writes during an animation. A wall
 * second shared with an entrance or a fade would land a store commit inside
 * the animation's window, so the tick itself stands down for the epoch's
 * duration. The writers that own an animation each open their own slot when
 * it starts and close that slot at its settle, so one owner's settle releases
 * only its own window and never a neighbour's. A settle that never comes (a
 * superseded animation whose owner is gone) is unstuck by the staleness valve
 * rather than freezing the display forever.
 */

import logger from '@/shared/logger';

/**
 * No animation this app gates runs longer than this, and it sits under one
 * tick interval. A slot still open past it is a settle that never fired, and
 * the display's correctness outranks the gate: ticks resume.
 */
const EPOCH_STALE_MS = 600;

/** One animation's hold on the epoch: handed out by open, released by its own settle alone */
export interface AnimationEpochSlot {
  readonly openedAtMs: number;
}

const openSlots = new Set<AnimationEpochSlot>();

/** Opens the epoch: called by a writer as its animation starts */
export const openAnimationEpoch = (): AnimationEpochSlot => {
  const slot: AnimationEpochSlot = { openedAtMs: Date.now() };
  openSlots.add(slot);
  return slot;
};

/**
 * Closes one animation's slot: called from that animation's own settle, never
 * a wall timer. A null close is the rest of an owner that never started, and
 * releases nothing.
 */
export const closeAnimationEpoch = (slot: AnimationEpochSlot | null) => {
  if (slot === null) return;
  openSlots.delete(slot);
};

/**
 * Whether any owner's slot is open, with the staleness valve applied per
 * slot: a slot held past the valve is a lost settle, reported once and
 * dropped, so a stuck slot can never freeze the ticking display while a
 * fresh animation's gate still holds. A stamp from the future (a clock that
 * moved back) is the same nonsense and drops the same way.
 */
export const animationEpochOpen = (): boolean => {
  let open = false;

  for (const slot of openSlots) {
    const heldFor = Date.now() - slot.openedAtMs;
    if (heldFor < 0 || heldFor > EPOCH_STALE_MS) {
      openSlots.delete(slot);
      if (heldFor > 0) logger.warn('ANIMATION EPOCH: a settle never came; ticks resume', { heldForMs: heldFor });
      continue;
    }
    open = true;
  }

  return open;
};
