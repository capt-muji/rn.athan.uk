/**
 * Unit tests for shared/whatsNew.ts
 *
 * Tests the What's New display rules and content contract:
 * - shouldShowWhatsNew() - version comparison + content-presence logic
 * - getPlatformBadge() - informational badge rendering rules
 * - WHATS_NEW content - shape, limits, and validity (guards future edits)
 */

import {
  getPlatformBadges,
  MAX_WHATS_NEW_BODY_LENGTH,
  MAX_WHATS_NEW_ITEMS,
  MAX_WHATS_NEW_TITLE_LENGTH,
  shouldShowWhatsNew,
  WHATS_NEW,
  type WhatsNewItem,
  type WhatsNewRelease,
} from '../whatsNew';

const release = (items: WhatsNewItem[]): WhatsNewRelease => ({ version: '1.13.0', items });
const item = (overrides: Partial<WhatsNewItem> = {}): WhatsNewItem => ({
  title: 'Test title',
  body: 'Test body',
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
    expect(shouldShowWhatsNew('1.12.2', '1.13.0', release([item()]))).toBe(false);
  });

  it('handles minor and patch upgrade boundaries', () => {
    expect(shouldShowWhatsNew('1.13.0', '1.12.9', release([item()]))).toBe(true);
    expect(shouldShowWhatsNew('1.13.1', '1.13.0', release([item()]))).toBe(true);
    expect(shouldShowWhatsNew('2.0.0', '1.99.99', release([item()]))).toBe(true);
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
  // the it.each closures below.
  const content = WHATS_NEW;
  if (content === null) return;

  it('has a semver version string', () => {
    expect(content.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it(`has between 1 and ${MAX_WHATS_NEW_ITEMS} items`, () => {
    expect(content.items.length).toBeGreaterThanOrEqual(1);
    expect(content.items.length).toBeLessThanOrEqual(MAX_WHATS_NEW_ITEMS);
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
