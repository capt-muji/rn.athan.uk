/**
 * The round-9 catalog (T-623): one hundred designs numbered 321-420, one
 * coherent proposal each covering BOTH new surfaces, appended twenty-five per
 * batch. Every row names its indicator archetype (what rides around the
 * Extra Schedule's Suhoor bell when the selection is not Every day), its
 * next-trigger archetype (the schedule section under the locked card's
 * note), the one motif hue both surfaces and the fasting-list echoes share,
 * and whether the indicator speaks per armed regimen (distinct marks for
 * Muhammad / Dawood / the white days) or one shared mark for the whole
 * selection. The walk is deterministic: unique indicator-trigger pairs,
 * consecutive rows differing in BOTH coordinates, ten hue blocks of ten,
 * every fourth row per-mode. Dev-only: nothing shipped imports here.
 */

export type R9IndicatorKind =
  | 'badge-top'
  | 'pill-below'
  | 'dot-side'
  | 'ring-around'
  | 'corner-tri'
  | 'counter-chip'
  | 'underline-glow'
  | 'mini-icon'
  | 'monogram'
  | 'stripe-end'
  | 'tab-top'
  | 'bracket'
  | 'halo'
  | 'tick-pair'
  | 'orbit-dots'
  | 'crown-dot'
  | 'side-ribbon'
  | 'twin-dots'
  | 'arc-progress'
  | 'tag-notch';

export type R9TriggerKind =
  | 'relative-line'
  | 'date-list'
  | 'timeline'
  | 'dot-strip'
  | 'countdown-chip'
  | 'ring'
  | 'table'
  | 'calendar-row'
  | 'pulse-text'
  | 'stacked-cards'
  | 'week-bar'
  | 'split-digits';

export type R9HueKey = 'indigo' | 'sky' | 'green' | 'amber' | 'rose' | 'violet' | 'teal' | 'gold' | 'cyan' | 'orange';

export interface R9CatalogRow {
  /** The design inside the round, 1-100 (the deep link's r9 param) */
  readonly design: number;
  /** The design's number across the whole exploration, 321-420 */
  readonly number: number;
  /** Slug-shaped unique id */
  readonly id: string;
  /** Human name: the two archetypes joined */
  readonly name: string;
  readonly indicator: R9IndicatorKind;
  readonly trigger: R9TriggerKind;
  readonly hue: R9HueKey;
  /** True when the indicator renders one distinct mark per armed regimen */
  readonly perMode: boolean;
}

export const R9_CATALOG: readonly R9CatalogRow[] = [
  {
    design: 1,
    number: 321,
    id: 'badge-top-relative-line',
    name: 'Badge + Relative Line',
    indicator: 'badge-top',
    trigger: 'relative-line',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 2,
    number: 322,
    id: 'pill-below-ring',
    name: 'Pill + Progress Ring',
    indicator: 'pill-below',
    trigger: 'ring',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 3,
    number: 323,
    id: 'dot-side-week-bar',
    name: 'Dot + Week Bar',
    indicator: 'dot-side',
    trigger: 'week-bar',
    hue: 'indigo',
    perMode: true,
  },
  {
    design: 4,
    number: 324,
    id: 'ring-around-dot-strip',
    name: 'Ring + Dot Strip',
    indicator: 'ring-around',
    trigger: 'dot-strip',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 5,
    number: 325,
    id: 'corner-tri-pulse-text',
    name: 'Corner Mark + Pulse Dot + Text',
    indicator: 'corner-tri',
    trigger: 'pulse-text',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 6,
    number: 326,
    id: 'counter-chip-date-list',
    name: 'Counter Chip + Date List',
    indicator: 'counter-chip',
    trigger: 'date-list',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 7,
    number: 327,
    id: 'underline-glow-table',
    name: 'Underline Glow + Day-Time Table',
    indicator: 'underline-glow',
    trigger: 'table',
    hue: 'indigo',
    perMode: true,
  },
  {
    design: 8,
    number: 328,
    id: 'mini-icon-split-digits',
    name: 'Mini Icon + Split Digits',
    indicator: 'mini-icon',
    trigger: 'split-digits',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 9,
    number: 329,
    id: 'monogram-countdown-chip',
    name: 'Monogram + Countdown Chip',
    indicator: 'monogram',
    trigger: 'countdown-chip',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 10,
    number: 330,
    id: 'stripe-end-stacked-cards',
    name: 'Status Stripe + Stacked Cards',
    indicator: 'stripe-end',
    trigger: 'stacked-cards',
    hue: 'indigo',
    perMode: false,
  },
  {
    design: 11,
    number: 331,
    id: 'tab-top-ring',
    name: 'Top Tab + Progress Ring',
    indicator: 'tab-top',
    trigger: 'ring',
    hue: 'sky',
    perMode: true,
  },
  {
    design: 12,
    number: 332,
    id: 'bracket-week-bar',
    name: 'Brackets + Week Bar',
    indicator: 'bracket',
    trigger: 'week-bar',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 13,
    number: 333,
    id: 'halo-dot-strip',
    name: 'Halo + Dot Strip',
    indicator: 'halo',
    trigger: 'dot-strip',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 14,
    number: 334,
    id: 'tick-pair-pulse-text',
    name: 'Tick Pair + Pulse Dot + Text',
    indicator: 'tick-pair',
    trigger: 'pulse-text',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 15,
    number: 335,
    id: 'orbit-dots-date-list',
    name: 'Orbit Dots + Date List',
    indicator: 'orbit-dots',
    trigger: 'date-list',
    hue: 'sky',
    perMode: true,
  },
  {
    design: 16,
    number: 336,
    id: 'crown-dot-table',
    name: 'Crown Dot + Day-Time Table',
    indicator: 'crown-dot',
    trigger: 'table',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 17,
    number: 337,
    id: 'side-ribbon-split-digits',
    name: 'Side Ribbon + Split Digits',
    indicator: 'side-ribbon',
    trigger: 'split-digits',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 18,
    number: 338,
    id: 'twin-dots-countdown-chip',
    name: 'Twin Dots + Countdown Chip',
    indicator: 'twin-dots',
    trigger: 'countdown-chip',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 19,
    number: 339,
    id: 'arc-progress-stacked-cards',
    name: 'Progress Arc + Stacked Cards',
    indicator: 'arc-progress',
    trigger: 'stacked-cards',
    hue: 'sky',
    perMode: true,
  },
  {
    design: 20,
    number: 340,
    id: 'tag-notch-timeline',
    name: 'Notch Tag + Mini Timeline',
    indicator: 'tag-notch',
    trigger: 'timeline',
    hue: 'sky',
    perMode: false,
  },
  {
    design: 21,
    number: 341,
    id: 'badge-top-week-bar',
    name: 'Badge + Week Bar',
    indicator: 'badge-top',
    trigger: 'week-bar',
    hue: 'green',
    perMode: false,
  },
  {
    design: 22,
    number: 342,
    id: 'pill-below-dot-strip',
    name: 'Pill + Dot Strip',
    indicator: 'pill-below',
    trigger: 'dot-strip',
    hue: 'green',
    perMode: false,
  },
  {
    design: 23,
    number: 343,
    id: 'dot-side-pulse-text',
    name: 'Dot + Pulse Dot + Text',
    indicator: 'dot-side',
    trigger: 'pulse-text',
    hue: 'green',
    perMode: true,
  },
  {
    design: 24,
    number: 344,
    id: 'ring-around-date-list',
    name: 'Ring + Date List',
    indicator: 'ring-around',
    trigger: 'date-list',
    hue: 'green',
    perMode: false,
  },
  {
    design: 25,
    number: 345,
    id: 'corner-tri-table',
    name: 'Corner Mark + Day-Time Table',
    indicator: 'corner-tri',
    trigger: 'table',
    hue: 'green',
    perMode: false,
  },
];

export const r9RowFor = (design: number): R9CatalogRow => {
  const row = R9_CATALOG[design - 1];
  if (row === undefined || row.design !== design) throw new Error(`r9: no catalog row for design ${design}`);
  return row;
};
