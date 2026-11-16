/**
 * The cached-geometry hook: the settle flush writes a measurement only under
 * the key it was measured on
 */

import { getDefaultStore } from 'jotai/vanilla';

import { useCachedGeometry } from '@/hooks/useCachedGeometry';
import { bumpSheetSettleTick, measuredGeometryAtomFor } from '@/stores/geometry';

import { mountHook } from './hookHarness';

jest.mock('react', () => require('./hookHarness').react);
// jotai's react entry dies under the harness react mock, so the mock serves the two
// vanilla pieces this graph needs: atom for the store modules, useAtomValue as a plain read
jest.mock('jotai', () => ({
  atom: jest.requireActual('jotai/vanilla').atom,
  useAtomValue: (atom: unknown) => require('jotai/vanilla').getDefaultStore().get(atom),
}));
jest.mock('jotai/utils', () => jest.requireActual('jotai/vanilla/utils'));

const store = getDefaultStore();

const read = (key: string) => store.get(measuredGeometryAtomFor(key));

describe('the cached-geometry settle flush', () => {
  it('writes the measurement under the key it was measured on, at the settle tick', () => {
    const mounted = mountHook((key: string) => useCachedGeometry(key), 'flush_en');

    mounted.result[1](375);
    bumpSheetSettleTick();
    mounted.rerender();

    expect(read('flush_en')).toBe(375);

    mounted.unmount();
  });

  it('writes nothing for a measurement of zero, a text event with no lines', () => {
    const mounted = mountHook((key: string) => useCachedGeometry(key), 'flush_zero' as string);

    mounted.result[1](0);
    bumpSheetSettleTick();
    mounted.rerender();

    expect(read('flush_zero')).toBe(0);

    mounted.unmount();
  });

  it("never writes the old key's measurement under a key that changed before the settle", () => {
    const mounted = mountHook((key: string) => useCachedGeometry(key), 'flush_en_stale' as string);

    mounted.result[1](375);
    mounted.rerender('flush_ar_stale');
    bumpSheetSettleTick();
    mounted.rerender();

    expect(read('flush_ar_stale')).toBe(0);

    mounted.unmount();
  });
});
