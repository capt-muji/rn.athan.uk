/**
 * The round-10 seeds and params (T-623): the deep link's state param read to
 * its selection across all six sets, and the strips' label prefix. The
 * selection grammar is round 2's; the combined state (Muhammad + the white
 * days) is the frames' state. Dev-only: nothing shipped imports here.
 */

import { R2_DEFAULT, type R2Selection } from '../r2/model';
import { R10_TAKES } from './model';

/** The harness strips' label prefix, hoisted for the string guard */
export const STRIP_LABEL_PREFIX = 'R10';

/** How many takes the round holds */
export const R10_TAKES_LENGTH = R10_TAKES.length;

/** The whole deep link's state param, every set reachable, default on junk */
export const r10SeedParam = (state: string | string[] | undefined): R2Selection => {
  const value = firstParam(state);
  if (value === 'muhammad') return { mode: 'muhammad', white: false };
  if (value === 'dawood') return { mode: 'dawood', white: false };
  if (value === 'white') return { mode: null, white: true };
  if (value === 'muhammad+white') return { mode: 'muhammad', white: true };
  if (value === 'dawood+white') return { mode: 'dawood', white: true };
  if (value === 'combined') return { mode: 'muhammad', white: true };
  return R2_DEFAULT;
};

/** The deep link's r10 design number; null when absent or unreadable, clamped into the round */
export const r10DesignFromParam = (value: string | string[] | undefined): number | null => {
  const first = firstParam(value);
  if (first === '') return null;
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested) || requested < 1) return null;
  return Math.min(requested, R10_TAKES_LENGTH);
};

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
