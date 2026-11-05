/**
 * The round-8 fasting presentation model (T-623): the decided structure's
 * copy, rows, selection rules and capture states ride in from round 6
 * unchanged - the owner settled them - so every visible string stays hoisted
 * in the one model module. Round 8 finalizes round 7 take 5's styling, so
 * its model adds only the info glyph literal. Dev-only: nothing shipped
 * imports here.
 */

import type { R2Key, R2Selection } from '../r2/model';
import { R6_CARD_SUBHEADING, R6_CARD_TITLE, R6_ROWS, type R6Row, r6Description, r6Seed, r6Tap } from '../r6/model';

export const R8_CARD_TITLE = R6_CARD_TITLE;
export const R8_CARD_SUBHEADING = R6_CARD_SUBHEADING;
export const R8_ROWS: readonly R6Row[] = R6_ROWS;
export const r8Description = r6Description;
export const r8Seed = r6Seed;
export const r8Tap = r6Tap;

export type R8Row = R6Row;
export type R8Selection = R2Selection;
export type R8Key = R2Key;

/** The note's info icon glyph, hoisted for the string guard */
export const R8_INFO_GLYPH = 'i';
