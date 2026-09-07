import { useEffect, useState } from 'react';

/**
 * Flips true one frame + macrotask past mount — the app's post-paint defer
 * idiom (see stores/sync.ts). Launch chrome (overlay, sheets, veil,
 * decorations) mounts after the first content frame so the initial commit
 * stays minimal; every deferred surface is still mounted long before any
 * interaction can reveal it (rule 4 — pre-mounted before the animation).
 * @returns boolean indicating whether deferred chrome may mount
 */
export const useChromeDeferred = (): boolean => {
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setTimeout(() => setDeferred(true), 0);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  return deferred;
};
