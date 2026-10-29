/**
 * The language wheel's geometry (T-476): one derivation of where a row sits in the list, shared by the
 * snap offsets, the faint band that rides the centreline and the purple seat on the locale in force.
 *
 * The scroll handler calls centreFloat, bandSeat and the two translate functions on the UI thread, so
 * each of those, and every helper they call, carries its own worklet directive: a worklet that calls a
 * plain function throws on the device, and the Jest mock's one thread cannot show it.
 */

import { runOnJS } from 'react-native-reanimated';

import type { LocaleId } from '@/shared/i18n/locale';

export interface WheelMetrics {
  /** Rows in the filtered list */
  count: number;
  /** The list viewport's height, from its own layout */
  listHeight: number;
  /** One row's height, from the first row's layout */
  rowHeight: number;
  /** The gap between two rows */
  gap: number;
}

const clamp = (value: number, low: number, high: number): number => {
  'worklet';
  return Math.min(Math.max(value, low), high);
};

/** One row plus the gap under it */
export const rowPitch = (metrics: WheelMetrics): number => {
  'worklet';
  return metrics.rowHeight + metrics.gap;
};

/** The content padding at each end: half the viewport left over once a row is centred */
export const centrePad = (metrics: WheelMetrics): number => {
  'worklet';
  return Math.max(0, (metrics.listHeight - metrics.rowHeight) / 2);
};

/**
 * The scroll offset that settles row `index` on the centreline. The end padding already carries the
 * half-row, so the offset is the row's own pitch count: index 0 is the top of the scroll and the last
 * row lands on the maximum offset identically, which is why both ends centre
 */
export const offsetForIndex = (metrics: WheelMetrics, index: number): number => {
  'worklet';
  if (metrics.count === 0) return 0;
  return clamp(index, 0, metrics.count - 1) * rowPitch(metrics);
};

/** One snap offset per row, the list's whole settle line */
export const snapOffsets = (metrics: WheelMetrics): number[] => {
  if (metrics.count === 0) return [];
  return Array.from({ length: metrics.count }, (_, index) => offsetForIndex(metrics, index));
};

/** The row index the scroll sits on, fractional between rows and clamped to the list */
export const centreFloat = (metrics: WheelMetrics, offset: number): number => {
  'worklet';
  if (metrics.count === 0) return 0;
  const centred = (offset + metrics.listHeight / 2 - centrePad(metrics) - metrics.rowHeight / 2) / rowPitch(metrics);
  return clamp(centred, 0, metrics.count - 1);
};

/** The faint band's ride: centred at rest and one pitch per row travelled */
export const bandTranslateY = (metrics: WheelMetrics, offset: number): number => {
  'worklet';
  return centrePad(metrics) + centreFloat(metrics, offset) * rowPitch(metrics) - offset;
};

/** A scroll event as the list reports it, and the one value the bands ride */
export interface WheelScrollEvent {
  contentOffset: { y: number };
}

export interface ScrollPosition {
  value: number;
}

/** The row nearest the centreline: the faint band's seat, and the detent's integer */
export const bandSeat = (metrics: WheelMetrics, offset: number): number => {
  'worklet';
  return Math.round(centreFloat(metrics, offset));
};

/** The purple seat: the locale in force, one pitch per row above the centreline */
export const seatTranslateY = (metrics: WheelMetrics, seat: number, offset: number): number => {
  'worklet';
  return centrePad(metrics) + seat * rowPitch(metrics) - offset;
};

/**
 * Whether a close carries a change. A staged row is required, and it must be foreign: settling the
 * scroll stages nothing, and a staged row equal to the locale in force changes nothing
 */
export const stagesLanguageChange = (staged: LocaleId | null, active: LocaleId): staged is LocaleId =>
  staged !== null && staged !== active;

/**
 * The list's scroll handler: the one write both bands read, and the detent's edge. The seat is
 * compared against the last one the wheel settled on, so one tick fires per row that newly holds the
 * centreline; a bounce that recrosses it ticks again. A factory so the worklet sits beside the
 * geometry it calls and the component hands the library a ready handler
 */
export const wheelScrollHandler =
  (metrics: WheelMetrics, scrollY: ScrollPosition, lastSeat: ScrollPosition, onDetent: () => void) =>
  (event: WheelScrollEvent): void => {
    'worklet';
    const offset = event.contentOffset.y;
    const seat = bandSeat(metrics, offset);
    scrollY.value = offset;
    if (seat === lastSeat.value) return;
    lastSeat.value = seat;
    runOnJS(onDetent)();
  };
