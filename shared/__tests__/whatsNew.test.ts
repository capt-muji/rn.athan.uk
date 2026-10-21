/**
 * Unit tests for shared/whatsNew.ts
 *
 * Tests the What's New display rules and content contract:
 * - shouldShowWhatsNew() - version comparison + content-presence logic
 * - getPlatformBadge() - informational badge rendering rules
 * - filterWhatsNewItems() - the stamps and flags a build may present
 * - groupWhatsNewItems() - major.minor grouping, newest first, patch hidden
 * - getVisibleWhatsNew() - the sort, the newest-20 window, silent-ship semantics
 * - WHATS_NEW content - shape, limits, and validity (guards future edits)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FEATURE_FLAGS } from '@/shared/flags';
import { t } from '@/shared/i18n';
import * as loader from '@/shared/i18n/loader';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ms } from '@/shared/i18n/ms';
import { compareVersions } from '@/shared/versionUtils';

import {
  currentVisibleWhatsNew,
  filterWhatsNewItems,
  getPlatformBadges,
  getVisibleWhatsNew,
  groupWhatsNewItems,
  MAX_WHATS_NEW_ARCHIVE,
  MAX_WHATS_NEW_BODY_LENGTH,
  MAX_WHATS_NEW_TITLE_LENGTH,
  shouldShowWhatsNew,
  WHATS_NEW,
  WHATS_NEW_DISPLAY_WINDOW,
  type WhatsNewArchiveItem,
  type WhatsNewArchiveRelease,
  type WhatsNewItem,
  type WhatsNewRelease,
} from '../whatsNew';

/**
 * The version of the running binary, read from app.json the way the store and
 * `getInstalledVersion` see it. Read from disk, not imported from the module under test, so
 * a comparison against it cannot come out true just because both sides share one source.
 */
const appJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'app.json'), 'utf8'));
const INSTALLED_VERSION: string = appJson.expo.version;

/**
 * A bundled release. The stamp is parameterised because the modal only shows when it equals
 * the installed version — an upgrade-boundary case has to stamp the notes for the binary
 * they ship in, exactly as the maintenance ritual requires.
 */
const release = (items: WhatsNewItem[], version = '1.13.0'): WhatsNewRelease => ({ version, items });
const item = (overrides: Partial<WhatsNewItem> = {}): WhatsNewItem => ({
  title: 'Test title',
  body: 'Test body',
  version: '1.13.0',
  ...overrides,
});

/** An archive fixture: the same item shape the archive itself is maintained as */
const archive = (items: WhatsNewArchiveItem[], version = '1.13.0'): WhatsNewArchiveRelease => ({ version, items });
const archiveItem = (overrides: Partial<WhatsNewArchiveItem> = {}): WhatsNewArchiveItem => ({
  titleKey: 'whatsNew.title.tabletSupport',
  bodyKey: 'whatsNew.body.tabletSupport',
  version: '1.13.0',
  ...overrides,
});

// =============================================================================
// shouldShowWhatsNew TESTS
// =============================================================================

describe('shouldShowWhatsNew', () => {
  it('returns false when whatsNew is null (silent release)', () => {
    expect(shouldShowWhatsNew('1.13.0', null, null)).toBe(false);
  });

  it('returns false when whatsNew has no items', () => {
    expect(shouldShowWhatsNew('1.13.0', null, release([]))).toBe(false);
  });

  it('returns false when installed version is empty (unreadable config)', () => {
    expect(shouldShowWhatsNew('', null, release([item()]))).toBe(false);
    expect(shouldShowWhatsNew(null, null, release([item()]))).toBe(false);
  });

  it('returns true when shown version is null (upgrade to the release that introduced the feature)', () => {
    expect(shouldShowWhatsNew('1.13.0', null, release([item()]))).toBe(true);
  });

  it('returns false when shown version equals installed (already shown or fresh install)', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.13.0', release([item()]))).toBe(false);
  });

  it('returns true when installed is newer than shown (upgrade)', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.12.2', release([item()]))).toBe(true);
  });

  it('returns true when a version is skipped (only newest notes exist by construction)', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.10.0', release([item()]))).toBe(true);
    expect(shouldShowWhatsNew('1.13.0', '1.0.0', release([item()]))).toBe(true);
  });

  it('returns false when installed is older than shown (downgrade)', () => {
    // Stamped for the running binary, so it is the downgrade that stops it, not the stamp
    expect(shouldShowWhatsNew('1.12.2', '1.13.0', release([item()], '1.12.2'))).toBe(false);
  });

  it('handles minor and patch upgrade boundaries', () => {
    // Each release carries the notes stamped for the binary it ships in
    expect(shouldShowWhatsNew('1.13.0', '1.12.9', release([item()], '1.13.0'))).toBe(true);
    expect(shouldShowWhatsNew('1.13.1', '1.13.0', release([item()], '1.13.1'))).toBe(true);
    expect(shouldShowWhatsNew('2.0.0', '1.99.99', release([item()], '2.0.0'))).toBe(true);
  });

  it('returns false across every state when whatsNew is null (silent ship wins)', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.10.0', null)).toBe(false);
    expect(shouldShowWhatsNew('1.13.0', '1.13.0', null)).toBe(false);
  });

  // The gate is the release stamp, never an item's own version: the changelog presents
  // history, and shouldShowWhatsNew decides only whether it appears at all
  it('returns false when the notes were stamped for an earlier release', () => {
    expect(shouldShowWhatsNew('1.25.3', '1.24.30', release([item()], '1.24.30'))).toBe(false);
    expect(shouldShowWhatsNew('1.25.3', null, release([item()], '1.24.30'))).toBe(false);
  });

  it('returns false when the notes were stamped for a release not yet shipped', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.12.0', release([item()], '1.14.0'))).toBe(false);
  });

  it('silent-ships every intermediate release until the stamp is moved forward', () => {
    const stamped1_24_30 = release([item({ version: '1.24.30' })], '1.24.30');

    expect(shouldShowWhatsNew('1.25.0', '1.24.30', stamped1_24_30)).toBe(false);
    expect(shouldShowWhatsNew('1.25.1', '1.24.30', stamped1_24_30)).toBe(false);
    expect(shouldShowWhatsNew('1.25.2', '1.24.30', stamped1_24_30)).toBe(false);
    // ...and it speaks again the moment the ritual stamps the shipping release
    expect(shouldShowWhatsNew('1.25.3', '1.24.30', release([item({ version: '1.25.3' })], '1.25.3'))).toBe(true);
  });
});

// =============================================================================
// getPlatformBadges TESTS
// =============================================================================

describe('getPlatformBadges', () => {
  it('returns only iOS for an iOS-exclusive item (device-independent)', () => {
    expect(getPlatformBadges(item({ platform: 'ios' }))).toEqual(['iOS']);
  });

  it('returns only Android for an Android-exclusive item', () => {
    expect(getPlatformBadges(item({ platform: 'android' }))).toEqual(['Android']);
  });

  it('returns both platforms for a cross-platform item', () => {
    expect(getPlatformBadges(item())).toEqual(['iOS', 'Android']);
  });
});

// =============================================================================
// WHATS_NEW CONTENT CONTRACT TESTS (guards future release edits)
// =============================================================================

describe('WHATS_NEW content contract', () => {
  // Silent releases (null) are valid - only shape needs guarding when present.
  // Captured to a local because TS cannot narrow an imported binding across
  // the it.each closures below. The archive holds keys, so the contract runs
  // over the copy each entry resolves to.
  const content = WHATS_NEW;
  if (content === null) return;
  const resolved = content.items.map((entry) => ({ ...entry, title: t(entry.titleKey), body: t(entry.bodyKey) }));

  it('has a semver version string', () => {
    expect(content.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it(`archives between 1 and ${MAX_WHATS_NEW_ARCHIVE} items`, () => {
    expect(content.items.length).toBeGreaterThanOrEqual(1);
    expect(content.items.length).toBeLessThanOrEqual(MAX_WHATS_NEW_ARCHIVE);
  });

  it('has unique item titles (stable render keys)', () => {
    const titles = resolved.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('ships no parked drafts - every archived item carries a real release version', () => {
    for (const entry of content.items) {
      expect(entry.version).not.toBeNull();
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it.each(resolved.map((entry) => [entry.title, entry]))(
    'item "%s" has a non-empty title within the limit',
    (_title, entry) => {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.title.length).toBeLessThanOrEqual(MAX_WHATS_NEW_TITLE_LENGTH);
    }
  );

  it.each(resolved.map((entry) => [entry.title, entry]))(
    'item "%s" has a non-empty body within the limit',
    (_title, entry) => {
      expect(entry.body.trim().length).toBeGreaterThan(0);
      expect(entry.body.length).toBeLessThanOrEqual(MAX_WHATS_NEW_BODY_LENGTH);
    }
  );

  it.each(resolved.map((entry) => [entry.title, entry]))('item "%s" has a valid platform when set', (_title, entry) => {
    if (entry.platform !== undefined) {
      expect(['ios', 'android']).toContain(entry.platform);
    }
  });
});

// =============================================================================
// filterWhatsNewItems TESTS
// =============================================================================

describe('filterWhatsNewItems', () => {
  const flagsOn = { iosWidgets: true, androidWidgets: true };
  const flagsOff = { iosWidgets: false, androidWidgets: false };

  it('shows stamped items whatever release they shipped in', () => {
    const items = [archiveItem({ version: '2.0.37' }), archiveItem({ version: '1.24.10' })];
    expect(filterWhatsNewItems(items, flagsOn)).toHaveLength(2);
  });

  it('hides parked (null version) items until stamped', () => {
    const items = [archiveItem({ version: null })];
    expect(filterWhatsNewItems(items, flagsOn)).toHaveLength(0);
  });

  it('hides an item when its flag is disabled', () => {
    const items = [archiveItem({ flags: ['iosWidgets'] })];
    expect(filterWhatsNewItems(items, flagsOff)).toHaveLength(0);
    expect(filterWhatsNewItems(items, flagsOn)).toHaveLength(1);
  });

  it('keeps every stamped item among a mixed archive, parked ones excluded', () => {
    const items = [
      archiveItem({ titleKey: 'whatsNew.title.athanSounds', version: '1.11.0' }),
      archiveItem(),
      archiveItem({ titleKey: 'whatsNew.title.widgets', version: null }),
      archiveItem({ titleKey: 'whatsNew.title.helpPage', version: '1.14.0' }),
    ];
    const visible = filterWhatsNewItems(items, flagsOn);
    expect(visible.map((entry) => entry.titleKey)).toEqual([
      'whatsNew.title.athanSounds',
      'whatsNew.title.tabletSupport',
      'whatsNew.title.helpPage',
    ]);
  });

  it('hides a flagged item when given no flags, since the build ships with widgets off', () => {
    const items = [archiveItem(), archiveItem({ titleKey: 'whatsNew.title.widgets', flags: ['iosWidgets'] })];
    // The premise: jest.setup.js leaves the widgets flag as it ships
    expect(FEATURE_FLAGS.iosWidgets).toBe(false);

    const visible = filterWhatsNewItems(items);

    expect(visible.map((entry) => entry.titleKey)).toEqual(['whatsNew.title.tabletSupport']);
  });
});

// =============================================================================
// groupWhatsNewItems TESTS
// =============================================================================

describe('groupWhatsNewItems', () => {
  it('merges the patches of one release under a single major.minor key, patch hidden', () => {
    const items = [
      item({ version: '1.29.0' }),
      item({ title: 'Help page', version: '1.29.258' }),
      item({ title: 'Second reminder', version: '1.29.10' }),
    ];

    const groups = groupWhatsNewItems(items);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe('v1.29');
    expect(groups[0]?.items.map((entry) => entry.version)).toEqual(['1.29.258', '1.29.10', '1.29.0']);
  });

  it('orders groups newest first, whatever order the items arrive in', () => {
    const items = [
      item({ title: 'Tablet support', version: '1.24.9' }),
      item({ title: 'Language', version: '2.0.5' }),
      item({ title: 'Athan sounds', version: '1.27.140' }),
    ];

    expect(groupWhatsNewItems(items).map((group) => group.key)).toEqual(['v2.0', 'v1.27', 'v1.24']);
  });

  it('keeps equal-version items in their given order', () => {
    const first = item({ title: 'Tablet support', version: '1.29.10' });
    const second = item({ title: 'Athan sounds', version: '1.29.10' });

    expect(groupWhatsNewItems([second, first])[0]?.items.map((entry) => entry.title)).toEqual([
      'Athan sounds',
      'Tablet support',
    ]);
  });

  it('never groups a parked (null version) item: it has no release to sit under', () => {
    const parked = item({ title: 'Future feature', version: null });

    expect(groupWhatsNewItems([parked, item({ version: '1.13.0' })])).toHaveLength(1);
  });
});

// =============================================================================
// getVisibleWhatsNew TESTS
// =============================================================================

describe('getVisibleWhatsNew', () => {
  const flagsOn = { iosWidgets: true, androidWidgets: true };
  const flagsOff = { iosWidgets: false, androidWidgets: false };

  it('presents nothing for a silent release', () => {
    expect(getVisibleWhatsNew(null, flagsOn)).toBeNull();
  });

  it('presents nothing when no item is visible in the build', () => {
    const hidden = archive([archiveItem({ version: null }), archiveItem({ flags: ['iosWidgets'] })]);

    expect(getVisibleWhatsNew(hidden, flagsOff)).toBeNull();
  });

  it('presents the stamped items the build may show, newest release first, judged by the flags it is given', () => {
    const mixed = archive([
      archiveItem(),
      archiveItem({ titleKey: 'whatsNew.title.athanSounds', bodyKey: 'whatsNew.body.athanSounds', version: '1.12.0' }),
      archiveItem({ titleKey: 'whatsNew.title.widgets', bodyKey: 'whatsNew.body.widgets', flags: ['iosWidgets'] }),
    ]);

    expect(getVisibleWhatsNew(mixed, flagsOn)).toEqual(
      release([
        item({ title: 'Tablet support', body: 'Added support for tablets' }),
        item({
          title: 'Home & Lock widgets',
          body: 'Added prayer times to Home and Lock Screen',
          flags: ['iosWidgets'],
        }),
        item({ title: 'Athan sounds', body: 'Added new Athan sounds', version: '1.12.0' }),
      ])
    );
    expect(getVisibleWhatsNew(mixed, flagsOff)).toEqual(
      release([
        item({ title: 'Tablet support', body: 'Added support for tablets' }),
        item({ title: 'Athan sounds', body: 'Added new Athan sounds', version: '1.12.0' }),
      ])
    );
  });

  it(`windows the list to the newest ${WHATS_NEW_DISPLAY_WINDOW} items, boundary exact`, () => {
    // 1.50.0 newest down to 1.30.0 oldest: the 21st (oldest) item drops, the 20th stays
    const versions = Array.from({ length: 21 }, (_, i) => `1.${50 - i}.0`);
    const many = archive(
      versions.map((version) => archiveItem({ version })),
      '2.4.0'
    );

    const visible = getVisibleWhatsNew(many, flagsOn);

    expect(visible?.items).toHaveLength(WHATS_NEW_DISPLAY_WINDOW);
    expect(visible?.items.map((entry) => entry.version)).toEqual(versions.slice(0, 20));
  });
});

// =============================================================================
// THE ARCHIVE / currentVisibleWhatsNew TESTS
// =============================================================================

describe('the archive', () => {
  // The modal debuted 2026-10-20 carrying every feature the app has ever shipped. T-297
  // restamps each item with the version it truly shipped in, named from git history, so
  // the groups name real releases: v2.0, v1.29, v1.24, v1.7.
  it('presents every archived feature at once, newest release first', () => {
    const newestFirst = [...(WHATS_NEW?.items ?? [])].sort((a, b) =>
      compareVersions(b.version ?? '0', a.version ?? '0')
    );

    expect((currentVisibleWhatsNew()?.items ?? []).map((entry) => entry.title)).toEqual(
      newestFirst.map((entry) => t(entry.titleKey))
    );
  });

  it('announces the language feature with its catalog copy', () => {
    const entry = (currentVisibleWhatsNew()?.items ?? []).find((item) => item.title === t('whatsNew.title.language'));
    expect(entry?.body).toBe(t('whatsNew.body.language'));
  });

  it('reads the ms title under ms', () => {
    setActiveLocale('ms');
    try {
      const items = currentVisibleWhatsNew()?.items ?? [];
      expect(items.some((item) => item.title === 'Bahasa')).toBe(true);
    } finally {
      setActiveLocale('en');
    }
  });
});

describe('currentVisibleWhatsNew', () => {
  // `expect(WHATS_NEW?.version).toBe('2.3.0')` used to stand here, and any stamp satisfied
  // the archive's own tests while the build moved on. The version a user actually sees is
  // app.json's, read here from disk rather than from the module under test, so this is an
  // independent oracle: a stamp left behind the shipping binary silent-ships the release.
  it('ships its banner stamp at the version this tree builds', () => {
    expect(WHATS_NEW?.version).toBe(INSTALLED_VERSION);
  });

  // The grouped changelog exists to show history: the window is cross-release by design,
  // and the appear gate (shouldShowWhatsNew) is the only thing that decides whether it opens
  it('presents items from older releases inside the window', () => {
    const presented = currentVisibleWhatsNew()?.items ?? [];
    expect(presented.some((entry) => entry.version !== INSTALLED_VERSION)).toBe(true);
  });

  it('presents the widgets feature on both platforms (no badge, no flag gate)', () => {
    // Both platforms ship widgets and neither flag ever ships off again, so
    // the archive presents the feature unbadged everywhere
    const widgets = WHATS_NEW?.items.find((entry) => entry.titleKey === 'whatsNew.title.widgets');
    expect(widgets?.platform).toBeUndefined();
    expect(widgets?.flags).toBeUndefined();
    expect((currentVisibleWhatsNew()?.items ?? []).map((entry) => entry.title)).toContain('Home & Lock widgets');
  });

  it('resolves the active locale catalog at call time, not at module load', () => {
    setActiveLocale('ms');
    // The historical archive is English stand-ins in every locale, so the catalog the
    // loader hands back is the only witness that can tell ms from en here
    const catalog = jest.spyOn(loader, 'currentCatalog');
    currentVisibleWhatsNew();
    expect(catalog.mock.results[0]?.value).toBe(ms);
    catalog.mockRestore();
    setActiveLocale('en');
  });
});
