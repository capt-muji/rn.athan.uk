/**
 * The round-9 catalog's own invariants (T-623): the rows the gallery names
 * and both harness surfaces render - contiguous design numbers from 321,
 * unique slugs and names, the archetype floors the owner's order sets (at
 * least 15 indicator and 10 trigger archetypes across the full hundred, the
 * interim batches carrying what has landed), consecutive rows structurally
 * distinct in BOTH coordinates, no indicator-trigger pair repeated, and a
 * per-mode flag on roughly every fourth row.
 */

import { R9_CATALOG } from '@/devlayouts/r9/catalog';

const rows = R9_CATALOG;

describe('the round-9 catalog', () => {
  it('numbers its rows contiguously from 321', () => {
    expect(rows.map((row) => row.number)).toEqual(rows.map((_, position) => 321 + position));
  });

  it('numbers its designs contiguously from 1', () => {
    expect(rows.map((row) => row.design)).toEqual(rows.map((_, position) => position + 1));
  });

  it('gives every row a unique slug-shaped id', () => {
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(rows.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('gives every row a unique non-empty name', () => {
    const names = rows.map((row) => row.name);
    expect(new Set(names).size).toBe(rows.length);
    for (const name of names) expect(name.length).toBeGreaterThan(0);
  });

  it('never repeats an indicator-trigger pair', () => {
    const pairs = rows.map((row) => `${row.indicator}+${row.trigger}`);
    expect(new Set(pairs).size).toBe(rows.length);
  });

  it('makes consecutive rows structurally distinct in both coordinates', () => {
    for (let position = 1; position < rows.length; position += 1) {
      const previous = rows[position - 1];
      const current = rows[position];
      expect(current.indicator).not.toBe(previous.indicator);
      expect(current.trigger).not.toBe(previous.trigger);
    }
  });

  it('carries the archetype floors for the landed rows', () => {
    const indicators = new Set(rows.map((row) => row.indicator)).size;
    const triggers = new Set(rows.map((row) => row.trigger)).size;
    if (rows.length === 100) {
      expect(indicators).toBeGreaterThanOrEqual(15);
      expect(triggers).toBeGreaterThanOrEqual(10);
    } else {
      expect(indicators).toBeGreaterThanOrEqual(Math.min(15, Math.ceil(rows.length / 2)));
      expect(triggers).toBeGreaterThanOrEqual(Math.min(10, Math.ceil(rows.length / 3)));
    }
  });

  it('spreads the per-mode flag over about a quarter of the rows', () => {
    const perMode = rows.filter((row) => row.perMode).length;
    expect(perMode).toBeGreaterThanOrEqual(Math.floor(rows.length / 6));
    expect(perMode).toBeLessThanOrEqual(Math.ceil(rows.length / 2));
  });

  it('carries a valid motif hue on every row', () => {
    const hues = ['indigo', 'sky', 'green', 'amber', 'rose', 'violet', 'teal', 'gold', 'cyan', 'orange'];
    for (const row of rows) expect(hues).toContain(row.hue);
  });
});
