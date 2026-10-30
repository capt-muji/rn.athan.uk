/**
 * The language wheel's pure geometry (T-476): the pad that centres the first and last rows, the snap
 * offsets, the centre float the faint band reads, both bands' seats, and the scroll handler's one write
 */

// The wheel's scroll handler is plain JS: the pinned sheet re-dispatches the caller's onScroll on the
// JS thread, so the unit project needs no animation runtime for it
import { SPACING } from '@/shared/constants';

import {
  bandSeat,
  bandTranslateY,
  centreFloat,
  centrePad,
  offsetForIndex,
  rowPitch,
  seatTranslateY,
  snapOffsets,
  stagesLanguageChange,
  type WheelMetrics,
  type WheelScrollState,
  wheelReseed,
  wheelScrollBegin,
  wheelScrollHandler,
  wheelScrollTarget,
} from '../languageWheel';

/** Seven 44-point rows in a 400-point viewport, the picker's own measures */
const wheel = (overrides: Partial<WheelMetrics> = {}): WheelMetrics => ({
  count: 7,
  listHeight: 400,
  rowHeight: 44,
  gap: SPACING.xs,
  ...overrides,
});

describe('the language wheel’s geometry', () => {
  it('pitches a row and its gap together', () => {
    expect(rowPitch(wheel())).toBe(44 + SPACING.xs);
  });

  it('pads each end by half the leftover viewport, so the first and last rows reach the centreline', () => {
    expect(centrePad(wheel())).toBe((400 - 44) / 2);
  });

  it('pads by nothing when the viewport is shorter than a row', () => {
    expect(centrePad(wheel({ listHeight: 20 }))).toBe(0);
  });

  it('settles row i at i pitches, so the first row is the top of the scroll', () => {
    expect(offsetForIndex(wheel(), 0)).toBe(0);
    expect(offsetForIndex(wheel(), 3)).toBe(3 * (44 + SPACING.xs));
  });

  it('settles the last row at the scroll’s maximum offset, so the end of the list centres alike', () => {
    const metrics = wheel();
    const content = 2 * centrePad(metrics) + metrics.count * metrics.rowHeight + (metrics.count - 1) * metrics.gap;

    expect(offsetForIndex(metrics, metrics.count - 1)).toBe(content - metrics.listHeight);
  });

  it('clamps a row index to the list it has', () => {
    expect(offsetForIndex(wheel(), -2)).toBe(0);
    expect(offsetForIndex(wheel(), 99)).toBe(6 * (44 + SPACING.xs));
    expect(offsetForIndex(wheel({ count: 0 }), 3)).toBe(0);
  });

  it('lists one snap offset per row', () => {
    expect(snapOffsets(wheel())).toEqual([0, 48, 96, 144, 192, 240, 288]);
    expect(snapOffsets(wheel({ count: 0 }))).toEqual([]);
  });

  it('reads the settled row as its own centre float, every row of the list', () => {
    const metrics = wheel();

    for (let index = 0; index < metrics.count; index += 1) {
      expect(centreFloat(metrics, offsetForIndex(metrics, index))).toBe(index);
    }
  });

  it('reads a scroll between two rows as a fractional centre, and never past either end', () => {
    const metrics = wheel();

    expect(centreFloat(metrics, 24)).toBe(0.5);
    expect(centreFloat(metrics, -500)).toBe(0);
    expect(centreFloat(metrics, 5000)).toBe(metrics.count - 1);
    expect(centreFloat(wheel({ count: 0 }), 0)).toBe(0);
  });

  it('rides the band on the centreline: centred at rest, one pitch per row travelled', () => {
    const metrics = wheel();

    expect(bandTranslateY(metrics, offsetForIndex(metrics, 3))).toBe(centrePad(metrics));
    expect(bandTranslateY(metrics, 24)).toBe(centrePad(metrics) + 0.5 * 48 - 24);
  });

  it('seats the purple band on the locale in force, one pitch per row above the centre', () => {
    const metrics = wheel();

    expect(seatTranslateY(metrics, 2, 96)).toBe(centrePad(metrics));
    expect(seatTranslateY(metrics, 2, 0)).toBe(centrePad(metrics) + 2 * 48);
  });
});

describe('the wheel’s scroll handler', () => {
  const handlerFor = () => {
    const state: WheelScrollState = { offset: { value: 0 }, seat: { current: 0 }, target: { current: null } };
    const onDetent = jest.fn();
    return { state, onDetent, handle: wheelScrollHandler(wheel(), state, onDetent) };
  };

  const scroll = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

  it('writes the list’s own scroll position, which is the one value both bands ride', () => {
    const { state, handle } = handlerFor();

    handle(scroll(96));

    expect(state.offset.value).toBe(96);
  });

  it('ticks once for the row that newly holds the centreline, and not again while it holds it', () => {
    const { state, onDetent, handle } = handlerFor();

    handle(scroll(24));

    expect(onDetent).toHaveBeenCalledTimes(1);
    expect(onDetent).toHaveBeenCalledWith(1);
    expect(state.seat.current).toBe(1);

    handle(scroll(30));
    expect(onDetent).toHaveBeenCalledTimes(1);

    handle(scroll(96));
    expect(onDetent).toHaveBeenCalledTimes(2);
    expect(onDetent).toHaveBeenCalledWith(2);
    expect(state.seat.current).toBe(2);
  });

  it('holds the detent while a programmatic scroll crosses the rows to its target', () => {
    const { state, onDetent, handle } = handlerFor();

    // The wheel is sent to row 3: every row it passes on the way is the animation's, not the finger's
    expect(wheelScrollTarget(wheel(), state, 3)).toBe(144);
    expect(state.target.current).toBe(3);

    handle(scroll(96));
    handle(scroll(120));
    expect(onDetent).not.toHaveBeenCalled();

    handle(scroll(144));
    expect(onDetent).not.toHaveBeenCalled();
    // The arrival leaves the wheel where the finger will pick it up, under the target row
    expect(state.seat.current).toBe(3);
    expect(state.target.current).toBe(null);
  });

  it('ticks again once the programmatic scroll has arrived', () => {
    const { state, onDetent, handle } = handlerFor();

    wheelScrollTarget(wheel(), state, 3);
    handle(scroll(144));
    // The arrival itself holds the detent quiet: the tap that sent the scroll already staged its row
    expect(onDetent).not.toHaveBeenCalled();
    handle(scroll(192));

    expect(onDetent).toHaveBeenCalledTimes(1);
    expect(onDetent).toHaveBeenCalledWith(4);
    expect(state.seat.current).toBe(4);
  });

  it('holds nothing when the wheel already rests on the row it is sent to', () => {
    const { state } = handlerFor();

    wheelScrollTarget(wheel(), state, 0);

    expect(state.target.current).toBe(null);
  });

  it('releases the detent when a finger takes the wheel back mid-scroll', () => {
    const { state, onDetent, handle } = handlerFor();

    wheelScrollTarget(wheel(), state, 3);
    handle(scroll(24));
    expect(onDetent).not.toHaveBeenCalled();

    wheelScrollBegin(state);
    handle(scroll(72));

    expect(onDetent).toHaveBeenCalledTimes(1);
    expect(onDetent).toHaveBeenCalledWith(2);
    expect(state.seat.current).toBe(2);
  });

  it('seeds the wheel on a row without a scroll: the seat it rests on is the one it ticked on', () => {
    const { state, onDetent, handle } = handlerFor();

    expect(wheelReseed(wheel(), state, 2)).toBe(96);
    expect(state.offset.value).toBe(96);
    expect(state.seat.current).toBe(2);

    // The reseed's own delivery is the seat the wheel already holds, so it ticks nothing
    handle(scroll(96));
    expect(onDetent).not.toHaveBeenCalled();
  });
});

describe('the staged-commit guard', () => {
  it('commits only a staged row that is not the locale already in force', () => {
    expect(stagesLanguageChange('ar', 'en')).toBe(true);
    expect(stagesLanguageChange('en', 'en')).toBe(false);
    expect(stagesLanguageChange(null, 'en')).toBe(false);
  });
});

describe('the band’s seat', () => {
  it('rounds to the row nearest the centreline, and never past either end', () => {
    const metrics = wheel();

    expect(bandSeat(metrics, offsetForIndex(metrics, 2))).toBe(2);
    expect(bandSeat(metrics, 24)).toBe(1);
    expect(bandSeat(metrics, -500)).toBe(0);
  });
});
