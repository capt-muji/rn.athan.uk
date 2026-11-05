/**
 * The round-7 fasting presentation model (T-623): the decided structure's
 * copy, rows, selection rules and capture states ride in from round 6
 * unchanged - the owner settled them - so every visible string stays hoisted
 * in the one model module. The round-7 additions are the note's info glyph
 * literal and nothing else. Dev-only: nothing shipped imports here.
 */

import type { R2Key, R2Selection } from '../r2/model';
import { R6_CARD_SUBHEADING, R6_CARD_TITLE, R6_ROWS, type R6Row, r6Description, r6Seed, r6Tap } from '../r6/model';

export const R7_CARD_TITLE = R6_CARD_TITLE;
export const R7_CARD_SUBHEADING = R6_CARD_SUBHEADING;
export const R7_ROWS: readonly R6Row[] = R6_ROWS;
export const r7Description = r6Description;
export const r7Seed = r6Seed;
export const r7Tap = r6Tap;

export type R7Row = R6Row;
export type R7Selection = R2Selection;
export type R7Key = R2Key;

/** The note's info icon glyph, hoisted for the string guard */
export const R7_INFO_GLYPH = 'i';
