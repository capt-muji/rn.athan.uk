/**
 * The catalog lock (D49): each locale's entry is a hash of the English catalog it was
 * translated from, so an English edit that moves under the translations fails here
 * until they are re-translated or the lock is consciously re-taken with yarn i18n:lock.
 */

import { createHash } from 'node:crypto';

import lock from '@/shared/i18n/catalog-lock.json';
import { en } from '@/shared/i18n/en';

const LOCALES = ['ar', 'ms', 'so', 'hi', 'th'] as const;
const englishHash = createHash('sha256').update(JSON.stringify(en)).digest('hex');

describe('the catalog lock', () => {
  it('covers exactly the five translated locales', () => {
    expect(Object.keys(lock).sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)('%s is locked against the English it was translated from', (loc) => {
    const stored = lock[loc];
    if (stored !== englishHash) {
      throw new Error(`catalog lock stale for ${loc}: the English source changed; re-translate or run yarn i18n:lock`);
    }
  });
});
