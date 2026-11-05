/**
 * The round-9 motif hues (T-623): ten bright dark-screen hues, one per block
 * of ten designs, shared by the Suhoor-row indicator, the fasting-list echo
 * marks and the card's trigger section so the three read as one system. Each
 * hue carries the ink that stays readable on its fill. Dev-only: nothing
 * shipped imports here.
 */

import type { R9HueKey } from './catalog';

export type Rgb = readonly [number, number, number];

export const rgba = (rgb: Rgb, alpha: number): string => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

interface R9Hue {
  readonly rgb: Rgb;
  /** The ink drawn on top of the hue's own fill */
  readonly ink: string;
}

export const R9_HUES: Record<R9HueKey, R9Hue> = {
  indigo: { rgb: [99, 102, 241], ink: 'rgba(255, 255, 255, 0.92)' },
  sky: { rgb: [56, 189, 248], ink: 'rgba(8, 14, 28, 0.85)' },
  green: { rgb: [52, 211, 153], ink: 'rgba(6, 22, 16, 0.85)' },
  amber: { rgb: [251, 191, 36], ink: 'rgba(28, 18, 2, 0.85)' },
  rose: { rgb: [251, 113, 133], ink: 'rgba(30, 6, 12, 0.85)' },
  violet: { rgb: [167, 139, 250], ink: 'rgba(16, 8, 34, 0.85)' },
  teal: { rgb: [45, 212, 191], ink: 'rgba(4, 24, 20, 0.85)' },
  gold: { rgb: [250, 204, 21], ink: 'rgba(28, 20, 2, 0.85)' },
  cyan: { rgb: [34, 211, 238], ink: 'rgba(4, 22, 26, 0.85)' },
  orange: { rgb: [251, 146, 60], ink: 'rgba(30, 10, 2, 0.85)' },
};

export interface R9Ink {
  /** The hue at full strength */
  readonly solid: string;
  /** The hue as a faint fill */
  readonly fill: string;
  /** The hue as a mid fill */
  readonly mid: string;
  /** The hue as a soft border */
  readonly border: string;
  /** The ink for text on the hue's fill */
  readonly onFill: string;
}

export const r9Ink = (hue: R9HueKey): R9Ink => {
  const rgb = R9_HUES[hue].rgb;
  return {
    solid: rgba(rgb, 1),
    fill: rgba(rgb, 0.16),
    mid: rgba(rgb, 0.4),
    border: rgba(rgb, 0.55),
    onFill: R9_HUES[hue].ink,
  };
};
