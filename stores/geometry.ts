/**
 * Cached geometry - the measured-once dimensions sheets and rows re-derive on
 * their first open, held in MMKV so a later session's first open renders from
 * the cache instead of measuring inside its own entrance.
 *
 * The precedent is the prayer-name width cache (setNameWidth in stores/ui.ts):
 * reads come from memory or MMKV at render, writes happen once per measured
 * thing, and only a measurement that WIDENS the cache ever lands.
 */

import { atom, type PrimitiveAtom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { atomWithStorageNumber } from '@/stores/storage';

const store = getDefaultStore();

/** One geometry atom per key, created on first access and cached */
const geometryAtoms = new Map<string, PrimitiveAtom<number>>();

/**
 * The geometry atom for a measured dimension. Keys name everything the
 * measurement depends on: the locale for text-derived widths and heights, the
 * window width for row widths.
 */
export const measuredGeometryAtomFor = (key: string): PrimitiveAtom<number> => {
  const cached = geometryAtoms.get(key);
  if (cached) return cached;

  const geometryAtom = atomWithStorageNumber(`geometry_${key}`, 0);
  geometryAtoms.set(key, geometryAtom);
  return geometryAtom;
};

/**
 * Grow-toward-truth cache write, the name-width precedent: a measurement taken
 * before the custom font registers can read narrower than the truth, so only a
 * wider value ever replaces what is cached, correct values never churn, and a
 * wrong one self-heals on the next measurement.
 */
export const growMeasuredGeometry = (key: string, value: number) => {
  if (value <= 0) return;

  const geometryAtom = measuredGeometryAtomFor(key);
  if (value <= store.get(geometryAtom)) return;

  store.set(geometryAtom, value);
};

/**
 * Bumped when any sheet settles open: the one sanctioned moment for a
 * cached-geometry write, after the entrance that measured it has ended.
 */
export const sheetSettleTickAtom = atom(0);

export const bumpSheetSettleTick = () => store.set(sheetSettleTickAtom, (tick) => tick + 1);
