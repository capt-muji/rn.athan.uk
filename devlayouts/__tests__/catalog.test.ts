/**
 * The fasting layout catalog's own invariants (T-623): the plain rows the
 * registry binds components to and the gallery generator reads - fifty rows,
 * contiguous, uniquely named, every one carrying its archetype and its
 * explanation-hiding flag.
 */

import catalog from '@/devlayouts/catalog.json';

type Row = { index: number; id: string; name: string; archetype: string; hidesExplanations: boolean };

const rows: Row[] = catalog;

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

  it('holds all fifty rows', () => {
    expect(rows.length).toBe(50);
  });
});
