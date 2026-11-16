/**
 * The settled write: a press flips its animated target immediately (the UI
 * thread is unaffected) and the write latches to the animation's settle,
 * generation-stamped so a superseded animation re-defers to the newest press
 * rather than writing - the write gate the fade-settled atom established,
 * generalised off useDerivedProgress's onSettled.
 *
 * The component that owns the animation wires `settle` into its completion
 * callback, passing the generation its render captured and the target that
 * render animated to. A completion from a superseded press (or from an
 * external value change, which carries generation 0) never writes.
 */

import { useCallback, useRef, useState } from 'react';

import { type AnimationEpochSlot, closeAnimationEpoch, openAnimationEpoch } from '@/stores/animationEpoch';

interface SettledWrite<T> {
  /** The optimistic target while a press's write is deferred, else null */
  pending: T | null;
  /** The press: flips the optimistic target and stamps a new generation */
  press: (target: T) => void;
  /** The settle, from the animation's own completion: commits when its generation is current */
  settle: (generation: number, target: T) => void;
  /** The current press's generation, 0 at rest: what the animation's closure captures */
  generation: number;
}

export const useSettledWrite = <T>(write: (target: T) => void): SettledWrite<T> => {
  const [pending, setPending] = useState<T | null>(null);
  const generationRef = useRef(0);
  const epochSlotRef = useRef<AnimationEpochSlot | null>(null);

  const press = useCallback((target: T) => {
    generationRef.current += 1;
    setPending(target);
    // The superseded press's window ended the moment this one replaced it
    closeAnimationEpoch(epochSlotRef.current);
    epochSlotRef.current = openAnimationEpoch();
  }, []);

  const settle = useCallback(
    (generation: number, target: T) => {
      // A press that was superseded (or nothing at all, generation 0) writes nothing
      if (generation === 0 || generation !== generationRef.current) return;
      generationRef.current = 0;
      setPending(null);
      closeAnimationEpoch(epochSlotRef.current);
      epochSlotRef.current = null;
      write(target);
    },
    [write]
  );

  return { pending, press, settle, generation: generationRef.current };
};
