/**
 * The loader's thunk table: a catalog module evaluates only when its locale is
 * first read, once per process, inside marks that bracket the evaluation. All
 * 75 evaluating at loader evaluation was the launch-window cost the table
 * removed (digest 5117 A1), so the table's laziness and its memoization are
 * each pinned here.
 *
 * The en catalog stays effectively eager through the i18n index's own value
 * re-export (locale's graph reaches shared/time, which reads t()), so these
 * tests pin the OTHER locales' laziness and treat en's evaluation count as
 * unbounded noise.
 */

import type { LocaleId } from '@/shared/i18n/locale';

// jest.mock hoists above the array's declaration, so the name carries the mock
// prefix the hoisting rule accepts. No static import may precede the array:
// the hoisted factories would then run against an uninitialized const
const mockEvaluated: string[] = [];

jest.mock('@/shared/i18n/en', () => {
  mockEvaluated.push('en');
  return jest.requireActual('@/shared/i18n/en');
});
jest.mock('@/shared/i18n/ar', () => {
  mockEvaluated.push('ar');
  return jest.requireActual('@/shared/i18n/ar');
});
jest.mock('@/shared/i18n/ja', () => {
  mockEvaluated.push('ja');
  return jest.requireActual('@/shared/i18n/ja');
});
jest.mock('@/shared/i18n/zh-Hans', () => {
  mockEvaluated.push('zh-Hans');
  return jest.requireActual('@/shared/i18n/zh-Hans');
});

/** The loader in a fresh module registry, as a launch loads it */
const loadLoader = (): typeof import('../i18n/loader') => {
  let loader!: typeof import('../i18n/loader');
  jest.isolateModules(() => {
    loader = require('../i18n/loader');
  });
  return loader;
};

beforeEach(() => {
  mockEvaluated.length = 0;
});

describe('the catalog thunk table', () => {
  it('leaves the non-active catalogs unevaluated through the first read of the active one', () => {
    const loader = loadLoader();

    expect(typeof loader.currentCatalog()['time.now']).toBe('string');
    expect(mockEvaluated).not.toContain('ar');
    expect(mockEvaluated).not.toContain('ja');
    expect(mockEvaluated).not.toContain('zh-Hans');
  });

  it('evaluates a locale on its first read and never again', () => {
    const loader = loadLoader();
    loader.catalogFor('ar');
    const firstReads = mockEvaluated.filter((locale) => locale === 'ar').length;

    expect(typeof loader.catalogFor('ar')['time.now']).toBe('string');
    expect(typeof loader.currentPrayerLabels()).toBe('object');
    expect(mockEvaluated.filter((locale) => locale === 'ar')).toHaveLength(firstReads);
    expect(firstReads).toBeGreaterThan(0);
  });

  it('resolves every shipped locale to a catalog and its prayer labels', () => {
    const loader = loadLoader();
    const { LOCALE_IDS } = require('@/shared/i18n/locale') as { LOCALE_IDS: LocaleId[] };

    for (const locale of LOCALE_IDS) {
      const catalog = loader.catalogFor(locale);
      expect(typeof catalog['time.now']).toBe('string');
      expect(Object.keys(loader.catalogFor(locale)).length).toBeGreaterThan(0);
      expect(Object.keys(loader.currentPrayerLabels()).length).toBeGreaterThan(0);
    }
  });

  it("brackets each catalog's one-time evaluation with require marks, and repeats none", () => {
    const perfMark = jest.fn();
    jest.doMock('@/shared/perf', () => ({ perfMark }));
    let loader!: typeof import('../i18n/loader');
    jest.isolateModules(() => {
      loader = require('../i18n/loader');
    });
    jest.dontMock('@/shared/perf');

    loader.catalogFor('ja');
    loader.catalogFor('ja');

    const startCalls = perfMark.mock.calls.filter(([name]) => name === 'catalog_require_start');
    const endCalls = perfMark.mock.calls.filter(([name]) => name === 'catalog_require_end');
    expect(startCalls).toEqual([['catalog_require_start', { locale: 'ja' }]]);
    expect(endCalls).toEqual([['catalog_require_end', { locale: 'ja' }]]);
    expect(perfMark.mock.calls.indexOf(startCalls[0])).toBeLessThan(perfMark.mock.calls.indexOf(endCalls[0]));
  });
});
