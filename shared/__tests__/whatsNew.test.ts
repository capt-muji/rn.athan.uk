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
import { t, tIn } from '@/shared/i18n';
import * as loader from '@/shared/i18n/loader';
import { LOCALE_IDS, setActiveLocale } from '@/shared/i18n/locale';
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
 * A bundled release. The banner is parameterised because it names the release these notes
 * ship with - it never gates the modal (the item stamps do), and every fixture pins it to
 * the installed version exactly as the maintenance ritual requires.
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
  // The gate is content-driven (owner order 2026-10-21, design B): the archive's newest
  // stamped item is the bar, and the modal opens only when that bar clears the stored
  // shown-version. Every silent-path fixture pins the banner to the installed version with
  // stamps at or below the stored shown-version and the stored value below the installed
  // version - anything weaker stays green under a banner-equals gate and proves nothing.
  it('stays silent on a patch upgrade whose archive adds nothing new', () => {
    const silentPatch = release([item({ version: '2.0.37' }), item({ version: '1.24.10' })], '2.4.5');

    expect(shouldShowWhatsNew('2.4.5', '2.4.4', silentPatch)).toBe(false);
  });

  it('stays silent on the release after a silent patch, until a newer item ships', () => {
    const stillUnmoved = release([item({ version: '2.0.37' })], '2.5.0');

    expect(shouldShowWhatsNew('2.5.0', '2.4.4', stillUnmoved)).toBe(false);
  });

  it('shows on a feature release: the newest stamp clears the stored shown-version', () => {
    // The stored value sits strictly between the two stamps, so only the maximum counts
    const multiStamp = release([item({ version: '2.0.37' }), item({ version: '2.5.0' })], '2.5.0');

    expect(shouldShowWhatsNew('2.5.0', '2.4.4', multiStamp)).toBe(true);
  });

  it('stays silent when the newest stamp equals the stored shown-version (the fresh-install shadow)', () => {
    const alreadyShown = release([item({ version: '2.5.0' })], '2.5.0');

    expect(shouldShowWhatsNew('2.5.0', '2.5.0', alreadyShown)).toBe(false);
  });

  it('shows once to a pre-tracker upgrader, then the mark silences it', () => {
    const catchUp = release([item({ version: '2.0.37' })], '2.4.5');

    expect(shouldShowWhatsNew('2.4.5', null, catchUp)).toBe(true);
  });

  it('stays silent on a downgrade', () => {
    const rolledBack = release([item({ version: '2.0.37' })], '2.4.4');

    expect(shouldShowWhatsNew('2.4.4', '2.5.0', rolledBack)).toBe(false);
  });

  it('fails silent when the newest stamp is ahead of the installed binary', () => {
    const unshipped = release([item({ version: '2.5.0' })], '2.4.4');

    expect(shouldShowWhatsNew('2.4.4', '2.4.3', unshipped)).toBe(false);
  });

  it('ignores the release banner: the item stamps alone decide', () => {
    const misStampedBanner = release([item({ version: '2.0.37' }), item({ version: '2.5.0' })], '9.9.9');

    expect(shouldShowWhatsNew('2.5.0', '2.4.4', misStampedBanner)).toBe(true);
  });

  it('stays silent when every item is parked (version null)', () => {
    const allParked = release([item({ version: null }), item({ version: null })], '2.4.5');

    expect(shouldShowWhatsNew('2.4.5', '2.4.4', allParked)).toBe(false);
  });

  it('returns false when whatsNew is null (silent release)', () => {
    expect(shouldShowWhatsNew('1.13.0', null, null)).toBe(false);
  });

  it('returns false when whatsNew has no items', () => {
    expect(shouldShowWhatsNew('1.13.0', null, release([]))).toBe(false);
  });

  it('returns false when installed version is empty (unreadable config)', () => {
    // A zero stamp ranks level with an unreadable version, so only the guard fails this silent
    expect(shouldShowWhatsNew('', null, release([item({ version: '0.0.0' })]))).toBe(false);
    expect(shouldShowWhatsNew(null, null, release([item()]))).toBe(false);
  });

  it('returns false across every state when whatsNew is null (silent ship wins)', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.10.0', null)).toBe(false);
    expect(shouldShowWhatsNew('1.13.0', '1.13.0', null)).toBe(false);
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
// THE ARCHIVE UNDER EVERY TRANSLATED LOCALE (the translation lock)
// =============================================================================

describe('WHATS_NEW under every translated locale', () => {
  // en is the source, never a locale's fallback: a value that still equals its
  // en string is an untranslated stand-in and fails here. tIn reads the named
  // catalog without touching the active locale. Derived from LOCALE_IDS so a
  // future locale joins the lock the day its catalog lands.
  const content = WHATS_NEW;
  if (content === null) return;
  const TRANSLATED_LOCALES = LOCALE_IDS.filter((id) => id !== 'en');

  it.each(TRANSLATED_LOCALES)('%s carries no archive copy equal to its en source', (loc) => {
    const failures: string[] = [];
    for (const entry of content.items) {
      if (tIn(loc, entry.titleKey) === tIn('en', entry.titleKey)) {
        failures.push(`${loc}: ${entry.titleKey} still reads its en title`);
      }
      if (tIn(loc, entry.bodyKey) === tIn('en', entry.bodyKey)) {
        failures.push(`${loc}: ${entry.bodyKey} still reads its en body`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(TRANSLATED_LOCALES)('%s keeps every archived title and body inside the limits', (loc) => {
    const failures: string[] = [];
    for (const entry of content.items) {
      const title = tIn(loc, entry.titleKey);
      const body = tIn(loc, entry.bodyKey);
      if (title.trim().length === 0) failures.push(`${loc}: ${entry.titleKey} has an empty title`);
      if (body.trim().length === 0) failures.push(`${loc}: ${entry.bodyKey} has an empty body`);
      if (title.length > MAX_WHATS_NEW_TITLE_LENGTH) {
        failures.push(`${loc}: ${entry.titleKey} title over ${MAX_WHATS_NEW_TITLE_LENGTH}`);
      }
      if (body.length > MAX_WHATS_NEW_BODY_LENGTH) {
        failures.push(`${loc}: ${entry.bodyKey} body over ${MAX_WHATS_NEW_BODY_LENGTH}`);
      }
    }
    expect(failures).toEqual([]);
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
  // independent oracle. The banner names the release these notes ship with; it no longer
  // forces a pop (the item stamps decide that), so this pin is the one-line proof the
  // ritual ran.
  it('ships its banner stamp at the version this tree builds', () => {
    expect(WHATS_NEW?.version).toBe(INSTALLED_VERSION);
  });

  // Nothing announces a release newer than the binary carrying it: the gate fails such a
  // stamp silent at runtime, and this pin holds the archive itself to it. It is what keeps
  // fresh-install seeding and mark-on-display silent forever after - both write the
  // installed version as shown, and a stamp at or below the build can never clear it.
  it('stamps every shipped item at or below the version this tree builds', () => {
    for (const entry of WHATS_NEW?.items ?? []) {
      if (entry.version === null) continue;
      expect(compareVersions(entry.version, INSTALLED_VERSION)).toBeLessThanOrEqual(0);
    }
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
    // The witness is the loader, not the copy: whatever the catalogs read, the
    // resolver must hand back the active locale's catalog at call time
    const catalog = jest.spyOn(loader, 'currentCatalog');
    currentVisibleWhatsNew();
    expect(catalog.mock.results[0]?.value).toBe(ms);
    catalog.mockRestore();
    setActiveLocale('en');
  });
});
