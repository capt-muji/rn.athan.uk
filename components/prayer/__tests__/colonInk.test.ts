/**
 * The colon's endpoint pair per row state: every ruled ink, with selection the only path to
 * an upcoming row's bright one
 */

import { colonInkPair } from '../colonInk';

const DIM = 'rgba(174, 208, 255, 0.375)';
const NEXT = 'rgba(210, 226, 255, 0.75)';
const NEXT_EXTRAS = 'rgba(238, 243, 255, 0.88)';
const PAST = 'rgb(170, 182, 212)';
const PRIMARY = '#ffffff';

describe('colonInkPair', () => {
  it('rides the dim-to-bright endpoints on an upcoming row, at rest and selected alike', () => {
    // Selection only moves the position; the endpoints hold, so the day-roll cascade fades
    // through them with the digits instead of snapping when the state flips
    expect(colonInkPair({ isNext: false, isPassed: false, isStandard: true })).toEqual({
      from: DIM,
      to: PRIMARY,
    });
  });

  it('takes the next row to the Standard next ink, selected or not', () => {
    expect(colonInkPair({ isNext: true, isPassed: false, isStandard: true }).to).toBe(NEXT);
    expect(colonInkPair({ isNext: true, isPassed: false, isStandard: true }).to).toBe(NEXT);
  });

  it('takes the next row to the Extras next ink on the Extra schedule', () => {
    expect(colonInkPair({ isNext: true, isPassed: false, isStandard: false }).to).toBe(NEXT_EXTRAS);
  });

  it('takes a passed row to the ruled opaque white, selected or not', () => {
    expect(colonInkPair({ isNext: false, isPassed: true, isStandard: true }).to).toBe(PAST);
    expect(colonInkPair({ isNext: false, isPassed: true, isStandard: false }).to).toBe(PAST);
  });

  it('always travels from the dim ink, so every state fades from the same rest', () => {
    const states = [
      { isNext: false, isPassed: false, isStandard: true },
      { isNext: false, isPassed: false, isStandard: true },
      { isNext: true, isPassed: false, isStandard: true },
      { isNext: false, isPassed: true, isStandard: false },
    ];
    for (const row of states) {
      expect(colonInkPair(row).from).toBe(DIM);
    }
  });
});
