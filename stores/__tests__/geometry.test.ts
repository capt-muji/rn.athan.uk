/**
 * Cached geometry: the measured-once dimensions a warm sheet re-derives on its first open, held
 * in MMKV so a later session's first open renders from the cache instead of measuring inside
 * its own entrance
 */

import { getDefaultStore } from 'jotai/vanilla';

import { growMeasuredGeometry, measuredGeometryAtomFor } from '@/stores/geometry';

const store = getDefaultStore();

const read = (key: string) => store.get(measuredGeometryAtomFor(key));

describe('a cached geometry value', () => {
  it('reads 0 for a key nothing ever measured', () => {
    expect(read('never_measured')).toBe(0);
  });

  it('keeps the first measurement that lands', () => {
    growMeasuredGeometry('reminder_row_width_360', 208);

    expect(read('reminder_row_width_360')).toBe(208);
  });

  it('accepts only a wider re-measurement, the name-width precedent', () => {
    growMeasuredGeometry('reminder_active_text_en', 42);
    growMeasuredGeometry('reminder_active_text_en', 40);

    expect(read('reminder_active_text_en')).toBe(42);

    growMeasuredGeometry('reminder_active_text_en', 44);

    expect(read('reminder_active_text_en')).toBe(44);
  });

  it('writes nothing for a non-positive measurement', () => {
    growMeasuredGeometry('sound_row_height_en', 0);

    expect(read('sound_row_height_en')).toBe(0);
  });
});
