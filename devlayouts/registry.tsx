/**
 * The fasting layout registry (T-623): the catalog's plain rows bound to
 * their components, in catalog order. devlayouts/ is dev-only - the route
 * gates on __DEV__ - and sits outside the coverage measure (see
 * scripts/check-changed-coverage.js); this binding is the one logic the
 * suites prove.
 */

import type { ReactElement } from 'react';

import catalog from './catalog.json';
import { VARIANTS_01_10 } from './variants/variants-01-10';
import { VARIANTS_11_25 } from './variants/variants-11-25';
import { VARIANTS_26_40 } from './variants/variants-26-40';
import { VARIANTS_41_50 } from './variants/variants-41-50';
import { VARIANTS_51_75 } from './variants/variants-51-75';
import { VARIANTS_76_100 } from './variants/variants-76-100';
import { VARIANTS_101_125 } from './variants/variants-101-125';
import { VARIANTS_126_150 } from './variants/variants-126-150';
import { VARIANTS_151_190 } from './variants/variants-151-190';
import { VARIANTS_191_230 } from './variants/variants-191-230';
import { VARIANTS_231_270 } from './variants/variants-231-270';
import { VARIANTS_271_320 } from './variants/variants-271-320';

export type FastingVariantComponent = () => ReactElement;

export interface FastingVariant {
  readonly index: number;
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly hidesExplanations: boolean;
  /** The round-2 rows' opening set; the round-1 rows carry none */
  readonly open?: string;
  readonly Component: FastingVariantComponent;
}

/** One map per variant file, appended as the steps land their batches */
const COMPONENT_MAPS: readonly Record<string, FastingVariantComponent>[] = [
  VARIANTS_01_10,
  VARIANTS_11_25,
  VARIANTS_26_40,
  VARIANTS_41_50,
  VARIANTS_51_75,
  VARIANTS_76_100,
  VARIANTS_101_125,
  VARIANTS_126_150,
  VARIANTS_151_190,
  VARIANTS_191_230,
  VARIANTS_231_270,
  VARIANTS_271_320,
];

const componentFor = (id: string): FastingVariantComponent => {
  for (const map of COMPONENT_MAPS) {
    const found = map[id];
    if (found) return found;
  }
  throw new Error(`devlayouts: catalog row ${id} has no component`);
};

export const VARIANTS: readonly FastingVariant[] = catalog.map((row) => ({
  ...row,
  Component: componentFor(row.id),
}));

/** How many distinct structures the set spans; the acceptance floor is 8 */
export const archetypeCount = (): number => new Set(VARIANTS.map((variant) => variant.archetype)).size;

/** How many rows hide the mode explanations by default; the acceptance floor is half of 50 */
export const hiddenCount = (): number => VARIANTS.filter((variant) => variant.hidesExplanations).length;
