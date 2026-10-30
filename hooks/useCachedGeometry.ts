/**
 * One measured geometry value: seeded from the MMKV cache at mount so the
 * session's first open renders the settled layout, widened by live
 * measurement, and written back only after a sheet settles open - never inside
 * the entrance that measured it.
 *
 * The cache is the owner's second-run ruling made mechanical: nothing
 * re-derives what a cache can hold, and nothing writes during an animation.
 */

import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
import { useCallback, useEffect, useRef, useState } from 'react';

import { growMeasuredGeometry, measuredGeometryAtomFor, sheetSettleTickAtom } from '@/stores/geometry';

const store = getDefaultStore();

/**
 * @param key Names everything the measurement depends on (locale, window width)
 * @param accept Whether a re-measurement must widen the cache (the default, the
 *   name-width precedent) or replaces it outright, for values a shrink must be
 *   able to correct
 */
export const useCachedGeometry = (key: string, accept: 'widen' | 'replace' = 'widen') => {
  const [value, setValue] = useState(() => store.get(measuredGeometryAtomFor(key)));
  const settleTick = useAtomValue(sheetSettleTickAtom);

  // The value the settle flush reads: state at the moment the sheet settled
  const valueRef = useRef(value);
  valueRef.current = value;

  // The write rides the settle tick alone: the entrance that measured the value
  // is over when the tick moves, and the cache write is idempotent until then
  // biome-ignore lint/correctness/useExhaustiveDependencies: the settle tick is the deliberate trigger, and the value flows through valueRef so a mid-measurement tick does not re-run the effect
  useEffect(() => {
    const measured = valueRef.current;
    if (measured > 0) growMeasuredGeometry(key, measured);
  }, [settleTick, key]);

  const measure = useCallback(
    (measured: number) => {
      setValue((current) => (accept === 'widen' ? Math.max(current, measured) : measured));
    },
    [accept]
  );

  return [value, measure] as const;
};
