/**
 * The round-2 selection model's own invariants (T-623): the owner's spec
 * enforced in code - six valid sets, one always selected, conflicts resolved
 * by silently unselecting, tense following the saved state. Dev-only.
 */

import { nextR2Selection, R2_DEFAULT, type R2Selection, r2Description, r2Same, r2Seed } from '@/devlayouts/r2/model';

const EVERY: R2Selection = { mode: 'every', white: false };
const MUHAMMAD: R2Selection = { mode: 'muhammad', white: false };
const DAWOOD: R2Selection = { mode: 'dawood', white: false };
const WHITE: R2Selection = { mode: null, white: true };
const MUHAMMAD_WHITE: R2Selection = { mode: 'muhammad', white: true };
const DAWOOD_WHITE: R2Selection = { mode: 'dawood', white: true };

const ALL: R2Selection[] = [EVERY, MUHAMMAD, DAWOOD, WHITE, MUHAMMAD_WHITE, DAWOOD_WHITE];
const KEYS = ['every', 'muhammad', 'dawood', 'white'] as const;

const isValid = (selection: R2Selection): boolean => ALL.some((one) => r2Same(one, selection));

describe('the round-2 selection model', () => {
  it('opens at Every day', () => {
    expect(r2Same(R2_DEFAULT, EVERY)).toBe(true);
  });

  it('keeps at least one option selected from every state, under every tap', () => {
    for (const from of ALL) {
      for (const key of KEYS) {
        expect(isValid(nextR2Selection(from, key))).toBe(true);
      }
    }
  });

  it('holds the selection when the only selected option is tapped', () => {
    expect(r2Same(nextR2Selection(EVERY, 'every'), EVERY)).toBe(true);
    expect(r2Same(nextR2Selection(MUHAMMAD, 'muhammad'), MUHAMMAD)).toBe(true);
    expect(r2Same(nextR2Selection(WHITE, 'white'), WHITE)).toBe(true);
  });

  it('unselects the conflicts when Every day is tapped onto a combined set', () => {
    expect(r2Same(nextR2Selection(MUHAMMAD_WHITE, 'every'), EVERY)).toBe(true);
    expect(r2Same(nextR2Selection(DAWOOD_WHITE, 'every'), EVERY)).toBe(true);
    expect(r2Same(nextR2Selection(WHITE, 'every'), EVERY)).toBe(true);
  });

  it('switches between Muhammad and Dawood, keeping the white days', () => {
    expect(r2Same(nextR2Selection(DAWOOD_WHITE, 'muhammad'), MUHAMMAD_WHITE)).toBe(true);
    expect(r2Same(nextR2Selection(MUHAMMAD_WHITE, 'dawood'), DAWOOD_WHITE)).toBe(true);
    expect(r2Same(nextR2Selection(EVERY, 'muhammad'), MUHAMMAD)).toBe(true);
    expect(r2Same(nextR2Selection(EVERY, 'dawood'), DAWOOD)).toBe(true);
  });

  it('drops only the mode when a mode is tapped off a combined set', () => {
    expect(r2Same(nextR2Selection(MUHAMMAD_WHITE, 'muhammad'), WHITE)).toBe(true);
    expect(r2Same(nextR2Selection(DAWOOD_WHITE, 'dawood'), WHITE)).toBe(true);
  });

  it('unselects Every day when the white days are tapped onto it', () => {
    expect(r2Same(nextR2Selection(EVERY, 'white'), WHITE)).toBe(true);
  });

  it('toggles the white days beside a mode', () => {
    expect(r2Same(nextR2Selection(MUHAMMAD, 'white'), MUHAMMAD_WHITE)).toBe(true);
    expect(r2Same(nextR2Selection(MUHAMMAD_WHITE, 'white'), MUHAMMAD)).toBe(true);
  });

  it('reaches all six valid sets from the default', () => {
    function pathTo(target: R2Selection): (typeof KEYS)[number][] {
      if (r2Same(target, EVERY)) return ['every'];
      if (r2Same(target, MUHAMMAD)) return ['muhammad'];
      if (r2Same(target, DAWOOD)) return ['dawood'];
      if (r2Same(target, WHITE)) return ['white'];
      if (r2Same(target, MUHAMMAD_WHITE)) return ['muhammad', 'white'];
      return ['dawood', 'white'];
    }
    for (const target of ALL) {
      let state = R2_DEFAULT;
      for (const key of pathTo(target)) state = nextR2Selection(state, key);
      expect(r2Same(state, target)).toBe(true);
    }
  });

  it('reads every catalog seed back to its set', () => {
    expect(r2Same(r2Seed('every'), EVERY)).toBe(true);
    expect(r2Same(r2Seed('muhammad+white'), MUHAMMAD_WHITE)).toBe(true);
    expect(r2Same(r2Seed('dawood+white'), DAWOOD_WHITE)).toBe(true);
    expect(r2Same(r2Seed('nonsense'), EVERY)).toBe(true);
  });

  it('speaks the present tense when the draft matches the saved set', () => {
    expect(r2Description(EVERY, EVERY)).toBe('Sahur is scheduled for every day.');
    expect(r2Description(MUHAMMAD_WHITE, MUHAMMAD_WHITE)).toBe(
      'Sahur is scheduled for Mondays and Thursdays and the three white days.'
    );
  });

  it('speaks the future tense while the draft differs from the saved set', () => {
    expect(r2Description(MUHAMMAD_WHITE, EVERY)).toBe(
      'Sahur will be scheduled for Mondays and Thursdays and the three white days.'
    );
    expect(r2Description(DAWOOD_WHITE, EVERY)).toBe(
      'Sahur will be scheduled for alternate days, one on and one off, and the three white days.'
    );
    expect(r2Description(MUHAMMAD, MUHAMMAD_WHITE)).toBe('Sahur will be scheduled for Mondays and Thursdays.');
  });

  it('describes every valid set', () => {
    expect(r2Description(MUHAMMAD, MUHAMMAD)).toBe('Sahur is scheduled for Mondays and Thursdays.');
    expect(r2Description(DAWOOD, DAWOOD)).toBe('Sahur is scheduled for alternate days, one on and one off.');
    expect(r2Description(WHITE, WHITE)).toBe('Sahur is scheduled for the three white days.');
    expect(r2Description(DAWOOD_WHITE, DAWOOD_WHITE)).toBe(
      'Sahur is scheduled for alternate days, one on and one off, and the three white days.'
    );
  });
});
