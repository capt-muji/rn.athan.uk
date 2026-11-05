/**
 * The round-9 seeds and params (T-623): the deep link's state param read to
 * its selection across all six sets, the r9 design number clamped to the
 * catalog, and the strips' label prefix. Dev-only: nothing shipped imports
 * here.
 */

import { R2_DEFAULT, type R2Selection } from '../r2/model';
import { R9_CATALOG } from './catalog';

/** The harness strip's label prefix, hoisted for the string guard */
export const STRIP_LABEL_PREFIX = 'R9';

/** How many designs the round holds right now (the batches append) */
export const R9_CATALOG_LENGTH = R9_CATALOG.length;

/** The whole deep link's state param, every set reachable, default on junk */
export const r9Seed = (state: string | string[] | undefined): R2Selection => {
  const value = firstParam(state);
  if (value === 'muhammad') return { mode: 'muhammad', white: false };
  if (value === 'dawood') return { mode: 'dawood', white: false };
  if (value === 'white') return { mode: null, white: true };
  if (value === 'muhammad+white') return { mode: 'muhammad', white: true };
  if (value === 'dawood+white') return { mode: 'dawood', white: true };
  if (value === 'combined') return { mode: 'muhammad', white: true };
  return R2_DEFAULT;
};

/** The deep link's r9 design number; null when absent or unreadable, clamped into the catalog */
export const r9DesignFromParam = (value: string | string[] | undefined): number | null => {
  const first = firstParam(value);
  if (first === '') return null;
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested) || requested < 1) return null;
  return Math.min(requested, R9_CATALOG.length);
};

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
