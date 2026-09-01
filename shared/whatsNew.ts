/**
 * What's New - post-update announcement content and display rules
 *
 * A single bundled release-note entry for the CURRENT app version, shown once
 * on the first launch after a store update (never on fresh installs).
 *
 * Maintenance ritual (every store release):
 * 1. Fill `version` with the store version being submitted
 * 2. Rewrite `items` with user-facing changes only (new abilities, removed
 *    functionality, behavior changes users will notice) - no technical work
 *    (migrations, performance, refactors belong in App Store notes/README)
 * 3. Set `WHATS_NEW` to null to silent-ship a release (bug-fix-only updates)
 *
 * Display rules:
 * - Shows ONLY the installed version's items, never accumulated history -
 *   skipped intermediate versions are dominated by the final feature state
 * - `platform` declares an item's availability: Apple/Android glyphs render
 *   in the item's leading column (both stacked for cross-platform items) -
 *   informational on every device, never a filter
 *
 * @see ai/adr/012/ADR.md
 */

import { compareVersions } from '@/shared/versionUtils';

/** Platforms an item can be exclusive to */
export type WhatsNewPlatform = 'ios' | 'android';

/** One entry in the What's New list */
export interface WhatsNewItem {
  /** Short factual title (max MAX_TITLE_LENGTH chars) */
  title: string;
  /** One-line factual description (max MAX_BODY_LENGTH chars) */
  body: string;
  /** Marks the item as exclusive to a platform (badged on the other platform) */
  platform?: WhatsNewPlatform;
}

/** The release notes for the current version */
export interface WhatsNewRelease {
  /** Store version these notes ship with (dev sanity only - never rendered) */
  version: string;
  /** 1-4 user-facing items */
  items: WhatsNewItem[];
}

// =============================================================================
// CONTENT - edit this each release (or set to null to silent-ship)
// =============================================================================

export const WHATS_NEW: WhatsNewRelease | null = {
  version: '1.16.1',
  items: [
    {
      title: 'Home & Lock widgets',
      body: 'Add prayer times to your Home and Lock Screen',
      platform: 'ios',
    },
    {
      title: 'Athan sounds',
      body: 'New Athan sounds added',
    },
    {
      title: 'Reminder sounds',
      body: 'Every reminder now has its own sound',
    },
  ],
};

// =============================================================================
// CONTENT LIMITS - enforced by shared/__tests__/whatsNew.test.ts
// =============================================================================

/** Maximum number of items per release (keeps the modal scannable) */
export const MAX_WHATS_NEW_ITEMS = 4;
/** Maximum title length in characters */
export const MAX_WHATS_NEW_TITLE_LENGTH = 32;
/** Maximum body length in characters */
export const MAX_WHATS_NEW_BODY_LENGTH = 96;

// =============================================================================
// DISPLAY RULES (pure functions - fully unit tested)
// =============================================================================

/**
 * Decides whether the What's New modal should be displayed
 *
 * The modal shows when the shown-version differs from the installed version
 * AND the current release has bundled content:
 * - Fresh installs seed the shown-version to the installed version at first
 *   boot (see stores/version.ts handleAppUpgrade), so they never differ
 * - Existing users upgrading have an older (or absent) shown-version
 * - Users skipping versions still see only the installed version's notes -
 *   there is no history to accumulate by construction
 *
 * @param installedVersion - Version of the running binary (e.g. '1.13.0')
 * @param shownVersion - Version the modal was last shown for (or seeded with)
 * @param whatsNew - Bundled release content (null = silent release)
 * @returns true if the modal should be displayed now
 */
export const shouldShowWhatsNew = (
  installedVersion: string | null,
  shownVersion: string | null,
  whatsNew: WhatsNewRelease | null
): boolean => {
  if (!whatsNew || whatsNew.items.length === 0) return false;
  if (!installedVersion) return false;
  if (shownVersion === installedVersion) return false;
  if (!shownVersion) return true;

  return compareVersions(installedVersion, shownVersion) > 0;
};

/**
 * Returns the platform availability badges for an item
 *
 * Every item declares where it is available, independent of the viewing
 * device: an iOS-exclusive item shows the Apple glyph, an Android-exclusive
 * item the Android glyph, and a cross-platform item shows both stacked.
 * Badges are informational - items are never filtered by platform.
 *
 * @param item - The list item
 * @returns Platform labels to render as glyphs (never empty)
 */
export const getPlatformBadges = (item: WhatsNewItem): string[] => {
  if (item.platform === 'ios') return ['iOS'];
  if (item.platform === 'android') return ['Android'];
  return ['iOS', 'Android'];
};
