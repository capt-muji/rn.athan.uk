/**
 * What's New - post-update announcement content and display rules
 *
 * A growing archive of release-note items, each stamped with the version it
 * shipped in. The modal shows only the CURRENT release's items, once, on the
 * first launch after a store update (never on fresh installs).
 *
 * Maintenance ritual (every store release):
 * 1. Stamp items shipping in this release with the release's version, and move
 *    WHATS_NEW.version to match - the modal shows nothing unless it equals the
 *    installed version, which is what makes step 5 true
 * 2. Leave drafted future items at version: null (parked, never shown)
 * 3. When a parked item ships, stamp it with that release's version
 * 4. Prune the archive past MAX_WHATS_NEW_ARCHIVE entries (oldest first)
 * 5. A release with no newly stamped items silent-ships automatically
 *
 * Display rules:
 * - Shows ONLY the current release's items, never accumulated history -
 *   skipped intermediate versions are dominated by the final feature state
 * - `platform` declares an item's availability: Apple/Android glyphs render
 *   in the item's leading column (both stacked for cross-platform items) -
 *   informational on every device, never a filter
 * - `version` and `flags` ARE filters: items stamped with another release,
 *   parked (null), or gated behind a disabled feature flag are removed
 *   (VISIBLE_WHATS_NEW), so a dark or future feature is never advertised
 *
 * @see ai/adr/012/ADR.md
 */

import { FEATURE_FLAGS, type FeatureFlagId } from '@/shared/flags';
import { compareVersions } from '@/shared/versionUtils';

/** Platforms an item can exclusive to */
export type WhatsNewPlatform = 'ios' | 'android';

/** One entry in the What's New archive */
export interface WhatsNewItem {
  /** Short factual title (max MAX_WHATS_NEW_TITLE_LENGTH chars) */
  title: string;
  /** One-line factual description (max MAX_WHATS_NEW_BODY_LENGTH chars) */
  body: string;
  /** Marks the item as exclusive to a platform (badged on the other platform) */
  platform?: WhatsNewPlatform;
  /** Feature flags that must be enabled for the item to show - makes it
   * impossible to advertise a feature that is flagged off in the build */
  flags?: FeatureFlagId[];
  /** Release this item shipped in; null parks the item (drafted, never
   * shown) until stamped with a shipping version */
  version: string | null;
}

/** The release notes for the current version */
export interface WhatsNewRelease {
  /** Store version these notes ship with: never rendered, but it gates the
   * modal - shouldShowWhatsNew shows nothing unless this is the installed
   * version, so an un-moved stamp silent-ships the release */
  version: string;
  /** Archived items across releases; only the current version's show */
  items: WhatsNewItem[];
}

// =============================================================================
// CONTENT - grow per release; prune past MAX_WHATS_NEW_ARCHIVE
//
// WHETHER A RELEASE GETS A MODAL IS AN EDITORIAL DECISION, and it is the owner's
// (ruling 2026-09-13). A real feature is worth interrupting someone for; a
// performance pass is not, and popping a modal for one just annoys people.
//
// So: move `version` (and the item stamps) to the shipping release when you want
// the modal to appear, and LEAVE THEM BEHIND when you do not. A stamp older than
// the installed version is how a release silent-ships, and that is a choice, not
// a bug. Deliberately NOT covered by a test — a test here would fail every time
// that choice is made, which is the fastest way to get the guard deleted.
// =============================================================================

export const WHATS_NEW: WhatsNewRelease | null = {
  version: '1.26.31',
  items: [
    {
      title: 'Tablet support',
      body: 'Athan now supported on tablets',
      version: '1.26.31',
    },
    {
      title: 'Athan sounds',
      body: 'New Athan sounds added',
      version: '1.26.31',
    },
    {
      title: 'Reminder sounds',
      body: 'Every reminder now has its own sound',
      version: '1.26.31',
    },
    {
      // PARKED: ships with the release that enables the widgets flag
      // (expo-widgets@57.0.16, ISSUES.md G.1) - stamp its version then
      title: 'Home & Lock widgets',
      body: 'Add prayer times to your Home and Lock Screen',
      platform: 'ios',
      flags: ['widgets'],
      version: null,
    },
  ],
};

// =============================================================================
// CONTENT LIMITS - enforced by shared/__tests__/whatsNew.test.ts
// =============================================================================

/** Maximum items shown per release (keeps the modal scannable) */
export const MAX_WHATS_NEW_ITEMS = 4;
/** Maximum archived items before pruning (oldest first) */
export const MAX_WHATS_NEW_ARCHIVE = 20;
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
 * The modal shows when the bundled notes were stamped for the running binary
 * AND the shown-version differs from the installed version:
 * - Fresh installs seed the shown-version to the installed version at first
 *   boot (see stores/version.ts handleAppUpgrade), so they never differ
 * - Existing users upgrading have an older (or absent) shown-version
 * - Users skipping versions still see only the installed version's notes -
 *   there is no history to accumulate by construction
 *
 * The stamp check is what makes step 5 of the maintenance ritual above true.
 * `app/index.tsx` heads the modal with the INSTALLED version, while the items
 * are filtered against the hand-maintained `WHATS_NEW.version`. Nothing
 * compared the two, so once releases shipped past the last stamp every upgrade
 * presented that old release's items under today's version number - notes the
 * user had already read, dated as if they were new. A release whose stamp has
 * not been moved forward now silent-ships, as the file has always documented.
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
  if (whatsNew.version !== installedVersion) return false;
  if (shownVersion === installedVersion) return false;
  if (!shownVersion) return true;

  return compareVersions(installedVersion, shownVersion) > 0;
};

/**
 * Filters the archive down to what this build may present
 *
 * An item shows only when BOTH hold: it is stamped with the presenting
 * release's version (parked null items and other releases' items stay
 * archived), and every feature flag it declares is enabled. Pure: the
 * parameters keep tests deterministic.
 *
 * @param items - Archived items across releases
 * @param releaseVersion - The release presenting the list
 * @param flags - Enabled-flag record (defaults to this build's flags)
 * @returns Items safe to show for this release in this build
 */
export const filterWhatsNewItems = (
  items: WhatsNewItem[],
  releaseVersion: string,
  flags: Record<FeatureFlagId, boolean> = FEATURE_FLAGS
): WhatsNewItem[] =>
  items.filter((item) => item.version === releaseVersion && !(item.flags ?? []).some((flag) => !flags[flag]));

/**
 * The release as this build may present it: WHATS_NEW reduced to the
 * current version's visible items, or null when nothing remains
 * (silent-ship semantics apply everywhere downstream).
 */
export const VISIBLE_WHATS_NEW: WhatsNewRelease | null = (() => {
  if (!WHATS_NEW) return null;
  const items = filterWhatsNewItems(WHATS_NEW.items, WHATS_NEW.version);
  return items.length > 0 ? { ...WHATS_NEW, items } : null;
})();

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
