/**
 * Unit tests for shared/whatsNew.ts
 *
 * Tests the What's New display rules and content contract:
 * - shouldShowWhatsNew() - version comparison + content-presence logic
 * - getPlatformBadge() - informational badge rendering rules
 * - WHATS_NEW content - shape, limits, and validity (guards future edits)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  filterWhatsNewItems,
  getPlatformBadges,
  MAX_WHATS_NEW_ARCHIVE,
  MAX_WHATS_NEW_BODY_LENGTH,
  MAX_WHATS_NEW_ITEMS,
  MAX_WHATS_NEW_TITLE_LENGTH,
  shouldShowWhatsNew,
  VISIBLE_WHATS_NEW,
  WHATS_NEW,
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

  // The modal is headed with the INSTALLED version, so notes stamped for any other release
  // would present old items under today's number. Releases that ship past the last stamp
  // must silent-ship instead, which is the contract the file documents.
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
  // the it.each closures below.
  const content = WHATS_NEW;
  if (content === null) return;

  it('has a semver version string', () => {
    expect(content.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it(`archives between 1 and ${MAX_WHATS_NEW_ARCHIVE} items`, () => {
    expect(content.items.length).toBeGreaterThanOrEqual(1);
    expect(content.items.length).toBeLessThanOrEqual(MAX_WHATS_NEW_ARCHIVE);
  });

  it('has unique item titles (stable render keys)', () => {
    const titles = content.items.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each(content.items.map((entry) => [entry.title, entry]))(
    'item "%s" has a non-empty title within the limit',
    (_title, entry) => {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.title.length).toBeLessThanOrEqual(MAX_WHATS_NEW_TITLE_LENGTH);
    }
  );

  it.each(content.items.map((entry) => [entry.title, entry]))(
    'item "%s" has a non-empty body within the limit',
    (_title, entry) => {
      expect(entry.body.trim().length).toBeGreaterThan(0);
      expect(entry.body.length).toBeLessThanOrEqual(MAX_WHATS_NEW_BODY_LENGTH);
    }
  );

  it.each(content.items.map((entry) => [entry.title, entry]))(
    'item "%s" has a valid platform when set',
    (_title, entry) => {
      if (entry.platform !== undefined) {
        expect(['ios', 'android']).toContain(entry.platform);
      }
    }
  );
});

// =============================================================================
// filterWhatsNewItems / VISIBLE_WHATS_NEW TESTS
// =============================================================================

describe('filterWhatsNewItems', () => {
  const flagsOn = { widgets: true };
  const flagsOff = { widgets: false };

  it('shows items stamped with the presenting release', () => {
    const items = [item({ version: '1.13.0' })];
    expect(filterWhatsNewItems(items, '1.13.0', flagsOn)).toHaveLength(1);
  });

  it('hides items stamped with a different release', () => {
    const items = [item({ version: '1.12.0' })];
    expect(filterWhatsNewItems(items, '1.13.0', flagsOn)).toHaveLength(0);
  });

  it('hides parked (null version) items until stamped', () => {
    const items = [item({ version: null })];
    expect(filterWhatsNewItems(items, '1.13.0', flagsOn)).toHaveLength(0);
  });

  it('hides a matching item when its flag is disabled', () => {
    const items = [item({ flags: ['widgets'] })];
    expect(filterWhatsNewItems(items, '1.13.0', flagsOff)).toHaveLength(0);
    expect(filterWhatsNewItems(items, '1.13.0', flagsOn)).toHaveLength(1);
  });

  it('keeps only the current release among a mixed archive', () => {
    const items = [
      item({ title: 'Old', version: '1.11.0' }),
      item({ title: 'Now', version: '1.13.0' }),
      item({ title: 'Parked', version: null }),
      item({ title: 'Future', version: '1.14.0' }),
    ];
    const visible = filterWhatsNewItems(items, '1.13.0', flagsOn);
    expect(visible.map((entry) => entry.title)).toEqual(['Now']);
  });
});

describe('VISIBLE_WHATS_NEW', () => {
  it('shows only current-release items, or nothing on a silent release', () => {
    const visible = VISIBLE_WHATS_NEW?.items ?? [];
    expect(visible.length).toBeLessThanOrEqual(MAX_WHATS_NEW_ITEMS);
    const anyCurrentReleaseItems = (WHATS_NEW?.items ?? []).some((entry) => entry.version === WHATS_NEW?.version);
    if (!anyCurrentReleaseItems) {
      expect(VISIBLE_WHATS_NEW).toBeNull();
    }
  });

  // `expect(entry.version).toBe(WHATS_NEW?.version)` used to stand here, and it was
  // vacuously true for any stamp: both sides came from the same hand-maintained string, so
  // the archive could fall arbitrarily far behind the shipping binary without a word. The
  // version a user actually sees is app.json's, read here from disk rather than from the
  // module under test, so this is an independent oracle.
  it('never lets an item stamped for another release reach a user', () => {
    const installedVersion = INSTALLED_VERSION;
    // Exactly what app/index.tsx does on launch, for a user upgrading from anywhere
    const presented = shouldShowWhatsNew(installedVersion, null, VISIBLE_WHATS_NEW)
      ? (VISIBLE_WHATS_NEW?.items ?? [])
      : [];

    for (const entry of presented) {
      expect(entry.version).toBe(installedVersion);
    }
  });

  it('keeps the parked widgets item in the archive (wording preserved, never shown)', () => {
    const parked = WHATS_NEW?.items.find((entry) => entry.version === null);
    expect(parked?.title).toBe('Home & Lock widgets');
    expect(parked?.flags).toEqual(['widgets']);
    expect((VISIBLE_WHATS_NEW?.items ?? []).map((entry) => entry.title)).not.toContain('Home & Lock widgets');
  });
});
