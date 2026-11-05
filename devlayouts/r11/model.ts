/**
 * The round-11 model (T-623): ten owner-ordered takes over the round-10
 * machinery. The constants are settled: the bordered bell cluster (fills
 * green, cyan, white; every circle ringed in the deep background shade
 * #1B1967 like the settings reset switch's circle border but hugging the
 * fill with no inner gap, the ring doing the overlap separation instead of
 * round 10's punched bite; the circles five percent smaller than round 10's),
 * the position law (white days always right of their partner, a lone mode's
 * circle alone), the always-on row dots (a disabled row keeps its dot), the
 * dot-free NEXT SUHOOR label recolored to the card subheading's muted bluish
 * tone, and the ten-day calendar of small squares (round-9 design 350's size
 * and style) in the fasting card's subcard fill, each armed cell carrying the
 * same bordered cluster at cell scale. The takes vary the note extension
 * (calendar inside the extended note vs a strip below it), the cell size, the
 * cell spacing, the cell-circle size and the note's extension depth. The
 * trigger and calendar walks ride the real fasting evaluator over the real
 * timetable (r10's, which rides r9's), injected with the render-time instant
 * - never the clock. Dev-only: nothing shipped imports here.
 */

import type { R2Selection } from '../r2/model';
import { type R10CalendarDay, r10CalendarDays } from '../r10/model';

// ---------------------------------------------------------------------------
// The ten takes
// ---------------------------------------------------------------------------

/** Whether the calendar sits inside the extended note or in a strip below it */
export type R11Note = 'inside' | 'below';

export interface R11Take {
  /** The design inside the round, 1-10 (the deep link's r11 param) */
  readonly design: number;
  /** The design's number across the whole exploration, 426-435 */
  readonly number: number;
  /** Slug-shaped unique id, the frame names' slug */
  readonly id: string;
  readonly name: string;
  readonly note: R11Note;
  /** The calendar square's side */
  readonly cell: number;
  /** The gap between the calendar's cells */
  readonly gap: number;
  /** The bordered cluster's circle size on an armed cell */
  readonly dot: number;
  /** The extended note's depth: the calendar's gap under the note text */
  readonly depth: number;
}

export const R11_TAKES: readonly R11Take[] = [
  {
    design: 1,
    number: 426,
    id: 'wrap-mid-squares',
    name: 'Note-wrapped calendar, 20px squares, mid spacing',
    note: 'inside',
    cell: 20,
    gap: 4,
    dot: 6.5,
    depth: 10,
  },
  {
    design: 2,
    number: 427,
    id: 'strip-tight-squares',
    name: 'Calendar strip below, 20px squares, tight spacing',
    note: 'below',
    cell: 20,
    gap: 3,
    dot: 6.5,
    depth: 10,
  },
  {
    design: 3,
    number: 428,
    id: 'wrap-deep-large',
    name: 'Deep note wrap, 22px squares, large rings',
    note: 'inside',
    cell: 22,
    gap: 3,
    dot: 7,
    depth: 14,
  },
  {
    design: 4,
    number: 429,
    id: 'strip-airy-small',
    name: 'Airy strip below, 18px squares, small rings',
    note: 'below',
    cell: 18,
    gap: 5,
    dot: 6,
    depth: 10,
  },
  {
    design: 5,
    number: 430,
    id: 'wrap-roomy-mid',
    name: 'Roomy note wrap, 20px squares, wide spacing',
    note: 'inside',
    cell: 20,
    gap: 6,
    dot: 6,
    depth: 12,
  },
  {
    design: 6,
    number: 431,
    id: 'strip-mid-large',
    name: 'Calendar strip below, 22px squares, large rings',
    note: 'below',
    cell: 22,
    gap: 4,
    dot: 7,
    depth: 10,
  },
  {
    design: 7,
    number: 432,
    id: 'wrap-shallow-small',
    name: 'Shallow note wrap, 18px squares, small rings',
    note: 'inside',
    cell: 18,
    gap: 4,
    dot: 6,
    depth: 8,
  },
  {
    design: 8,
    number: 433,
    id: 'strip-tight-mid',
    name: 'Tight strip below, 20px squares, mid rings',
    note: 'below',
    cell: 20,
    gap: 3,
    dot: 6.5,
    depth: 10,
  },
  {
    design: 9,
    number: 434,
    id: 'wrap-deep-mid',
    name: 'Deep note wrap, 20px squares, large rings',
    note: 'inside',
    cell: 20,
    gap: 5,
    dot: 7,
    depth: 14,
  },
  {
    design: 10,
    number: 435,
    id: 'strip-airy-mid',
    name: 'Airy strip below, 20px squares, mid rings',
    note: 'below',
    cell: 20,
    gap: 5,
    dot: 6,
    depth: 10,
  },
];

/** The take for a deep-link design number, clamped into the round */
export const r11TakeFor = (design: number): R11Take =>
  R11_TAKES[Math.min(Math.max(design, 1), R11_TAKES.length) - 1] ?? R11_TAKES[0]!;

// ---------------------------------------------------------------------------
// The settled constants
// ---------------------------------------------------------------------------

/** The deep background shade sampled from behind the alerts icon: the rings' color */
export const R11_BORDER = '#1B1967';

/** The bell cluster's circle size: round 10's 9 about five percent smaller */
export const R11_BELL_DOT = 8.5;

/** The bell rings' width, the reset-switch border's weight */
export const R11_BELL_RING = 2;

/** The cell rings' width, one step under the bell's for the smaller circles */
export const R11_CELL_RING = 1.5;

/** The circles' overlap: forty percent into each other, the white circle front */
export const R11_OVERLAP_STEP = 0.6;

// ---------------------------------------------------------------------------
// The ten-day calendar over the real evaluator
// ---------------------------------------------------------------------------

export const R11_CALENDAR_DAYS = 10;

/** The next `R11_CALENDAR_DAYS` days from the injected instant's day, today first */
export const r11CalendarDays = (
  now: Date,
  selection: R2Selection,
  suhoorAt?: (date: string) => { at: Date; time: string } | null
): R10CalendarDay[] => r10CalendarDays(now, selection, R11_CALENDAR_DAYS, suhoorAt);
