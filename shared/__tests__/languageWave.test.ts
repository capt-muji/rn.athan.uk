/**
 * The T-537 language wave's shape gates: the catalogue count lands at exactly 75,
 * the six wave locales ship on every registry surface, the six retired locales
 * leave no dead key anywhere, and the picker list holds its own codepoint order
 * (the D26 invariant the wave re-sorted after the earlier waves' three drifts).
 */

import catalogLock from '@/shared/i18n/catalog-lock.json';
import { catalogFor } from '@/shared/i18n/loader';
import { LOCALE_IDS, type LocaleId } from '@/shared/i18n/locale';
import nativeStrings from '@/shared/i18n/native-strings.json';
import widgetStatics from '@/shared/i18n/widget-statics.json';
import { LANGUAGE_NAMES, nativeLanguageName } from '@/shared/languageNames';

const WAVE_IN = ['hil', 'bcl', 'war', 'mrw', 'mfa', 'ti'] as const;
const WAVE_OUT = ['zh-Hant', 'dv', 'ce', 'aa', 'mnk', 'dje'] as const;

describe('the language wave', () => {
  it('holds the catalogue count at exactly seventy-five', () => {
    expect(LOCALE_IDS).toHaveLength(75);
    expect(LANGUAGE_NAMES).toHaveLength(75);
    expect(Object.keys(catalogLock)).toHaveLength(74);
    expect(Object.keys(nativeStrings).filter((k) => k !== '_comment')).toHaveLength(75);
    expect(Object.keys(widgetStatics).filter((k) => !k.startsWith('_'))).toHaveLength(75);
  });

  it.each(WAVE_IN)('%s ships on every registry surface', (tag) => {
    expect(LOCALE_IDS).toContain(tag);
    expect(LANGUAGE_NAMES.some((entry) => entry.id === tag)).toBe(true);
    expect(Object.keys(catalogLock)).toContain(tag);
    expect(Object.keys(nativeStrings)).toContain(tag);
    expect(Object.keys(widgetStatics)).toContain(tag);
    // The loader answers the wave's tag with a catalog that carries the key set
    expect(() => catalogFor(tag)).not.toThrow();
    expect(catalogFor(tag)['prayer.fajr']).toBeTruthy();
    expect(nativeLanguageName(tag)).toBeTruthy();
  });

  it.each(WAVE_OUT)('%s leaves no dead key on any registry surface', (tag) => {
    expect(LOCALE_IDS as readonly string[]).not.toContain(tag);
    expect(LANGUAGE_NAMES.some((entry) => (entry.id as string) === tag)).toBe(false);
    expect(Object.keys(catalogLock)).not.toContain(tag);
    expect(Object.keys(nativeStrings)).not.toContain(tag);
    expect(Object.keys(widgetStatics)).not.toContain(tag);
    // The loader has no factory left for the retired tag
    expect(() => catalogFor(tag as LocaleId)).toThrow();
  });

  it('keeps the picker list in its own codepoint order', () => {
    const names = LANGUAGE_NAMES.map((entry) => entry.name);
    expect(names).toEqual([...names].sort());
  });
});
