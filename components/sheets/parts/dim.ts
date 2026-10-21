import { COLORS } from '@/shared/constants';

/**
 * The reminder controls' dim, carried by colour: one solid per element per state,
 * flattened from the old nested group opacities (the options block 0.125 over the
 * card, the card 0.125 over the sheet, each control's own 0.2, the boundary button's
 * 0.15 inside that). Solid ink is the point: translucent text compounds where glyph
 * strokes overlap. Pure, so the solids are testable without a renderer (the same
 * split as components/prayer/colonInk.ts).
 */

/** Which wrappers dim a control: the reminder off, the card locked, both, or neither */
export type DimState = 'rest' | 'off' | 'lockedOn' | 'lockedOff';

export const dimState = (locked: boolean, on: boolean): DimState =>
  locked ? (on ? 'lockedOn' : 'lockedOff') : on ? 'rest' : 'off';

/** A control is interactive exactly when its reminder is on, as before the colour carry */
export const dimDisables = (dim: DimState): boolean => dim === 'off' || dim === 'lockedOff';

/** ReminderCard's own text and surfaces, per state */
export const REMINDER_CARD = {
  background: { rest: 'rgba(99, 102, 241, 0.06)', locked: '#0c193b' },
  border: { rest: 'rgba(99, 102, 241, 0.15)', locked: '#0d193d' },
  title: { rest: '#d8eaf8', locked: '#253252' },
  hint: { rest: COLORS.text.sheetSubtitle, locked: '#122246' },
  optionLabel: { rest: '#92b8e4', off: '#203059', lockedOn: '#1c2c4f', lockedOff: '#0e1b3e' },
  rule: { rest: '#162251', off: '#111d46', lockedOn: '#0c193d', lockedOff: '#0c193c' },
};

/** The segment labels' ink and the sliding pill, per state */
export const SEGMENT_LABEL: Record<DimState, { selected: string; unselected: string }> = {
  rest: { selected: '#ffffff', unselected: '#5f85b1' },
  off: { selected: '#16224a', unselected: '#121f48' },
  lockedOn: { selected: '#2a3553', unselected: '#162649' },
  lockedOff: { selected: '#0c193c', unselected: '#0c193c' },
};

export const SEGMENT_PILL: Record<DimState, { background: string; border: string }> = {
  rest: { background: '#5015b5', border: '#672bcf' },
  off: { background: '#121c48', border: '#121d48' },
  lockedOn: { background: '#141849', border: '#171a4d' },
  lockedOff: { background: '#0c193c', border: '#0c193c' },
};

/** The stepper's inks, per state; glyphBoundary is the boundary button's ink at its limit */
export const STEPPER_INK: Record<DimState, { value: string; unit: string; glyph: string; glyphBoundary: string }> = {
  rest: { value: '#ffffff', unit: '#5f85b1', glyph: '#eaf2fa', glyphBoundary: '#1c2d60' },
  off: { value: '#16224a', unit: '#121f48', glyph: '#16224a', glyphBoundary: '#111d46' },
  lockedOn: { value: '#2a3553', unit: '#162649', glyph: '#273352', glyphBoundary: '#0d1b3f' },
  lockedOff: { value: '#0c193c', unit: '#0c193c', glyph: '#0c193c', glyphBoundary: '#0c193b' },
};

/** The wash behind the segment and the stepper (the old rgba(99,102,241,.1)), per state */
export const CONTROL_WASH: Record<DimState, string> = {
  rest: '#192456',
  off: '#121e48',
  lockedOn: '#0d1a3e',
  lockedOff: '#0c193c',
};
