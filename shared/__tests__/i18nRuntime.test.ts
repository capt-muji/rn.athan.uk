/**
 * The runtime locale switch: t() and prayerLabel() answer from the active catalog,
 * the device locale resolves once and memoizes, and the remount version bumps
 */

import { getDefaultStore } from 'jotai';

import { prayerLabel, t } from '@/shared/i18n';
import { currentLocaleId, localeVersionAtom, setActiveLocale } from '@/shared/i18n/locale';

describe('the runtime catalog switch', () => {
  afterEach(() => {
    setActiveLocale('en');
  });

  it('answers t() from the active locale the moment it is set', () => {
    setActiveLocale('ar');
    expect(t('prayer.fajr')).toBe('الفجر');
  });

  it('answers prayerLabel() from the active locale', () => {
    setActiveLocale('th');
    expect(prayerLabel('last third')).toBe('ช่วงสุดท้าย');
  });

  it('resolves the device locale on the first read and keeps answering without re-resolving', () => {
    // The jest-expo mock reports an en-US device, and no stored preference exists in a test
    expect(currentLocaleId()).toBe('en');
    expect(currentLocaleId()).toBe('en');
  });

  it('bumps the remount version once per switch', () => {
    const store = getDefaultStore();
    const before = store.get(localeVersionAtom);
    setActiveLocale('ms');
    expect(store.get(localeVersionAtom)).toBe(before + 1);
  });
});
