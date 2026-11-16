import { useEffect, useState } from 'react';

/**
 * Flips true on the first frame that COMPLETED with headroom, not one rAF
 * past mount — RN's idle events ride the Choreographer and fire only inside
 * a frame whose work finished with budget left, which on a launch-busy phone
 * (the whole first commit is one native mount burst) means frames are
 * already drawing on time. A rAF-gated defer flipped while the first frame
 * had still not drawn on slow devices, so the sheets' mount landed inside
 * the pre-first-draw window (digest 5102 lever 2).
 *
 * The timeout is the degenerate backstop: a main thread that never once
 * idles still mounts its chrome, at worst as late as the old behavior, and
 * 2s exceeds the slowest phone's whole cold path past mount (the 3T's is
 * ~1.2s), so the backstop itself cannot re-enter the pre-first-draw window.
 *
 * Every deferred surface is still mounted long before any interaction can
 * reveal it (rule 4 — pre-mounted before the animation: a sheet needs a tap
 * to open), and the consumers' idle callbacks all fire in the same idle
 * event, so their mounts still batch into one commit.
 * @returns boolean indicating whether deferred chrome may mount
 */
const FIRST_DRAWN_FRAME_TIMEOUT_MS = 2000;

export const useChromeDeferred = (): boolean => {
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    const idle = requestIdleCallback(() => setDeferred(true), { timeout: FIRST_DRAWN_FRAME_TIMEOUT_MS });
    return () => cancelIdleCallback(idle);
  }, []);

  return deferred;
};
