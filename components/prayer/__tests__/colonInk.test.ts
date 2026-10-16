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
  it('rests an upcoming row on the dim ink, whatever the schedule', () => {
    const pair = colonInkPair({ isNext: false, isPassed: false, isSelected: false, isStandard: true });

    expect(pair).toEqual({ from: DIM, to: DIM });
  });

  it('takes an upcoming row to the row\u2019s bright ink only while selected (the row-109 ruling)', () => {
    const pair = colonInkPair({ isNext: false, isPassed: false, isSelected: true, isStandard: true });

    expect(pair).toEqual({ from: DIM, to: PRIMARY });
  });

  it('takes the next row to the Standard next ink, selected or not', () => {
    expect(colonInkPair({ isNext: true, isPassed: false, isSelected: false, isStandard: true }).to).toBe(NEXT);
    expect(colonInkPair({ isNext: true, isPassed: false, isSelected: true, isStandard: true }).to).toBe(NEXT);
  });

  it('takes the next row to the Extras next ink on the Extra schedule', () => {
    expect(colonInkPair({ isNext: true, isPassed: false, isSelected: false, isStandard: false }).to).toBe(NEXT_EXTRAS);
  });

  it('takes a passed row to the ruled opaque white, selected or not', () => {
    expect(colonInkPair({ isNext: false, isPassed: true, isSelected: false, isStandard: true }).to).toBe(PAST);
    expect(colonInkPair({ isNext: false, isPassed: true, isSelected: true, isStandard: false }).to).toBe(PAST);
  });

  it('always travels from the dim ink, so every state fades from the same rest', () => {
    const states = [
      { isNext: false, isPassed: false, isSelected: false, isStandard: true },
      { isNext: false, isPassed: false, isSelected: true, isStandard: true },
      { isNext: true, isPassed: false, isSelected: false, isStandard: true },
      { isNext: false, isPassed: true, isSelected: false, isStandard: false },
    ];
    for (const row of states) {
      expect(colonInkPair(row).from).toBe(DIM);
    }
  });
});
