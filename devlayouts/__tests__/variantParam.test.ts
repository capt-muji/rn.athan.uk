/**
 * The harness variant param (T-623): the deep-linkable one-based variant
 * selector for the screenshot pass. Absent or unreadable values open the
 * first variant; out-of-range values clamp to the ends.
 */

import { harnessIndexFromParam } from '@/devlayouts/variantParam';

describe('the harness variant param', () => {
  it('opens the first variant when the param is absent', () => {
    expect(harnessIndexFromParam(undefined, 50)).toBe(0);
    expect(harnessIndexFromParam('', 50)).toBe(0);
  });

  it('reads the one-based variant number, zero-padded or not', () => {
    expect(harnessIndexFromParam('1', 50)).toBe(0);
    expect(harnessIndexFromParam('01', 50)).toBe(0);
    expect(harnessIndexFromParam('7', 50)).toBe(6);
    expect(harnessIndexFromParam('50', 50)).toBe(49);
  });

  it('clamps past either end', () => {
    expect(harnessIndexFromParam('0', 50)).toBe(0);
    expect(harnessIndexFromParam('-3', 50)).toBe(0);
    expect(harnessIndexFromParam('51', 50)).toBe(49);
    expect(harnessIndexFromParam('999', 50)).toBe(49);
  });

  it('falls back to the first variant on garbage', () => {
    expect(harnessIndexFromParam('aligned-radio-rows', 50)).toBe(0);
    expect(harnessIndexFromParam('7x', 50)).toBe(6);
  });

  it('takes the first value of a repeated param', () => {
    expect(harnessIndexFromParam(['3', '7'], 50)).toBe(2);
    expect(harnessIndexFromParam([''], 50)).toBe(0);
  });
});
