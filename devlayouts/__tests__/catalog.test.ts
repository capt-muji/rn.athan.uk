/**
 * The fasting layout catalog's own invariants (T-623): the plain rows the
 * registry binds components to and the gallery generator reads - 320 rows,
 * contiguous, uniquely named, every one carrying its archetype and its
 * explanation-hiding flag. The round-2 block (rows 51-150) names its opening
 * set, never hides the descriptions, and spans at least 20 archetypes; the
 * round-3 block (rows 151-320) does the same over its family archetypes.
 */

import catalog from '@/devlayouts/catalog.json';

type Row = {
  index: number;
  id: string;
  name: string;
  archetype: string;
  open?: string;
  hidesExplanations: boolean;
};

const rows: Row[] = catalog;
const r2 = rows.filter((row) => row.index > 50 && row.index <= 150);
const r3 = rows.filter((row) => row.index > 150);

const OPEN_SETS = new Set(['every', 'muhammad', 'dawood', 'white', 'muhammad+white', 'dawood+white']);

describe('the fasting layout catalog', () => {
  it('numbers its rows contiguously from 1', () => {
    expect(rows.map((row) => row.index)).toEqual(rows.map((_, position) => position + 1));
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

  it('gives every row a non-empty archetype', () => {
    for (const row of rows) expect(row.archetype.length).toBeGreaterThan(0);
  });

  it('carries a boolean hides flag on every row', () => {
    for (const row of rows) expect(typeof row.hidesExplanations).toBe('boolean');
  });

  it('holds all 320 rows', () => {
    expect(rows.length).toBe(320);
  });

  it('holds the round-2 block of 100 rows', () => {
    expect(r2.length).toBe(100);
  });

  it('names a valid opening set on every round-2 row', () => {
    for (const row of r2) expect(OPEN_SETS.has(row.open ?? '')).toBe(true);
  });

  it('hides no round-2 explanations: the spec wants the full description everywhere', () => {
    for (const row of r2) expect(row.hidesExplanations).toBe(false);
  });

  it('spans at least twenty round-2 archetypes', () => {
    expect(new Set(r2.map((row) => row.archetype)).size).toBeGreaterThanOrEqual(20);
  });

  it('holds the round-3 block of 170 rows', () => {
    expect(r3.length).toBe(170);
  });

  it('names a valid opening set on every round-3 row', () => {
    for (const row of r3) expect(OPEN_SETS.has(row.open ?? '')).toBe(true);
  });

  it('hides no round-3 explanations: the spec wants the full description everywhere', () => {
    for (const row of r3) expect(row.hidesExplanations).toBe(false);
  });

  it('spans at least eight round-3 archetypes', () => {
    expect(new Set(r3.map((row) => row.archetype)).size).toBeGreaterThanOrEqual(8);
  });
});
