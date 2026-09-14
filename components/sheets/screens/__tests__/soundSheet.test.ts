/**
 * The athan sound sheet saves the row tapped when it closes. Athan 1 is index 0, the value a truthiness check
 * mistakes for no choice, so every case runs across every row rather than a convenient one.
 */

import { displayedSoundSelection, hasSoundDraft } from '../soundSheet';

// assets/audio/index.ts lists 32 athans; the module cannot be imported here because jest has no mp3 transform
const ROWS = Array.from({ length: 32 }, (_, index) => index);

describe('displayedSoundSelection', () => {
  it('highlights the row tapped, Athan 1 included, whatever was saved', () => {
    const wrong: string[] = [];

    for (const draft of ROWS) {
      for (const saved of ROWS) {
        const shown = displayedSoundSelection(draft, saved);
        if (shown !== draft) wrong.push(`tapped ${draft}, saved ${saved}, shown ${shown}`);
      }
    }

    expect(wrong).toEqual([]);
  });

  it('highlights the saved athan until a row is tapped', () => {
    for (const saved of ROWS) expect(displayedSoundSelection(null, saved)).toBe(saved);
  });
});

describe('hasSoundDraft', () => {
  it('has a choice to save for every row tapped, Athan 1 included', () => {
    const dropped = ROWS.filter((draft) => !hasSoundDraft(draft));

    expect(dropped).toEqual([]);
  });

  it('has nothing to save when no row was tapped', () => {
    expect(hasSoundDraft(null)).toBe(false);
  });
});
