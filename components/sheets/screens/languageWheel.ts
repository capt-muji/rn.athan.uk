/**
 * The language wheel's geometry (T-476): one derivation of where a row sits in the list, shared by the
 * snap offsets, the faint band that rides the centreline and the purple seat on the locale in force.
 *
 * The scroll handler calls centreFloat, bandSeat and the two translate functions on the UI thread for
 * the bands' styles, so each of those carries its own worklet directive: a worklet that calls a plain
 * function throws on the device, and the Jest mock's one thread cannot show it. The handler itself is
 * plain JS: the pinned sheet re-dispatches the caller's onScroll on the JS thread.
 */

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

/** A scroll event as the list hands it over: the library re-dispatches the native event under nativeEvent */
export interface WheelScrollEvent {
  nativeEvent: { contentOffset: { y: number } };
}

/** The list's own offset: a shared value, because both bands' styles read it on the UI thread */
export interface ScrollPosition {
  value: number;
}

/** The wheel's scroll state: the offset both bands ride, and the two seats the detent reads */
export interface WheelScrollState {
  offset: ScrollPosition;
  /** The row the detent last ticked on, so one tick fires per row that newly holds the centreline */
  seat: { current: number };
  /**
   * The row a programmatic scroll is travelling to, while the detent holds: the seats a finger is not
   * crossing do not tick. Null while the finger owns the wheel
   */
  target: { current: number | null };
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
 * Whether a close carries a change. A staged row is required, and it must be foreign: the settle and
 * the tap both stage, and a staged row equal to the locale in force changes nothing
 */
export const stagesLanguageChange = (staged: LocaleId | null, active: LocaleId): staged is LocaleId =>
  staged !== null && staged !== active;

/**
 * The list's scroll handler: the one write both bands ride, and the detent's edge. The pinned 5.2.14
 * scrollable consumes the caller's onScroll and re-dispatches it on the JS thread, so this is a plain
 * function and every delivery lands on one state: a seat already ticked stays quiet, and a programmatic
 * scroll holds the detent until it arrives at the row it was sent to
 */
export const wheelScrollHandler =
  (metrics: WheelMetrics, state: WheelScrollState, onDetent: (seat: number) => void) =>
  (event: WheelScrollEvent): void => {
    const offset = event.nativeEvent.contentOffset.y;
    const seat = bandSeat(metrics, offset);
    state.offset.value = offset;

    const travelling = state.target.current;
    if (travelling !== null) {
      // A programmatic scroll's arrival stages nothing: the tap that sent it already staged its row
      if (seat !== travelling) return;
      state.target.current = null;
      state.seat.current = seat;
      return;
    }

    if (seat === state.seat.current) return;
    state.seat.current = seat;
    onDetent(seat);
  };

/**
 * Sends the wheel to row `index` with the detent held, and hands back the offset to command. A row the
 * wheel already rests on holds nothing, so the next drag ticks from wherever the finger takes it
 */
export const wheelScrollTarget = (metrics: WheelMetrics, state: WheelScrollState, index: number): number => {
  const offset = offsetForIndex(metrics, index);
  const seat = bandSeat(metrics, offset);
  state.target.current = seat === state.seat.current ? null : seat;
  return offset;
};

/** A finger takes the wheel back: the row a programmatic scroll was heading to no longer holds the detent */
export const wheelScrollBegin = (state: WheelScrollState): void => {
  state.target.current = null;
};

/** Seeds the wheel on a row with no scroll of its own: the seat it comes to rest on is the one it ticked on */
export const wheelReseed = (metrics: WheelMetrics, state: WheelScrollState, index: number): number => {
  const offset = offsetForIndex(metrics, index);
  state.offset.value = offset;
  state.seat.current = bandSeat(metrics, offset);
  state.target.current = null;
  return offset;
};
