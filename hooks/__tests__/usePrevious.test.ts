/**
 * Unit tests for hooks/usePrevious.ts
 *
 * Prayer, Time and Alert compare a value with what the last render saw, to play a date-roll cascade or a selection
 * fade on exactly the render where it changed. The hook runs under hookHarness, whose effects run after the render
 * that declared them, as React's do.
 */

import { usePrevious } from '../usePrevious';
import { mountHook } from './hookHarness';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
jest.mock('react', () => require('./hookHarness').react);

describe('usePrevious', () => {
  it('has nothing to compare with on the first render', () => {
    expect(mountHook((value: string) => usePrevious(value), '2026-09-13').result).toBeUndefined();
  });

  it.each<[string, unknown, unknown]>([
    ['a display date rolling to the next day', '2026-09-13', '2026-09-14'],
    ['a row being selected', false, true],
    ['a row being deselected', true, false],
    ['the first list arriving', null, '2026-09-14'],
  ])('sees %s on exactly the render where it happens', (_, before, after) => {
    const view = mountHook((value: unknown) => usePrevious(value), before);

    view.rerender(before);
    expect(view.result).toBe(before);

    view.rerender(after);
    expect(view.result).toBe(before);

    view.rerender(after);
    expect(view.result).toBe(after);

    view.rerender(before);
    expect(view.result).toBe(after);
  });
});
