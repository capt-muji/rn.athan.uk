/**
 * What's New - post-update announcement content and display rules
 *
 * A growing archive of release-note items, each stamped with the version it
 * shipped in. The modal is a versioned changelog: the archive's newest
 * WHATS_NEW_DISPLAY_WINDOW items, grouped under major.minor version headings,
 * shown on the first launch after a release that stamps an item newer than the
 * user's stored shown-version - never on fresh installs, never on a release
 * that adds no item (owner order 2026-10-21, design B, content-driven).
 *
 * Maintenance ritual (every store release):
 * 1. Move WHATS_NEW.version to the shipping release - it names the release
 *    these notes ship with; the banner never gates the modal
 * 2. Leave drafted future items at version: null (parked, never shown)
 * 3. When a parked item ships, stamp it with that release's version - a
 *    stamped item newer than the user's stored shown-version is what opens
 *    the modal
 * 4. Prune the archive past MAX_WHATS_NEW_ARCHIVE entries (oldest first)
 * 5. A release that adds no items silent-ships by construction
 *
 * Display rules:
 * - The changelog is cross-release: items keep the true version they shipped
 *   in, and the newest window decides which are seen - skipped intermediate
 *   versions are dominated by the final feature state
 * - `platform` declares an item's availability: Apple/Android glyphs render
 *   at the item row's trailing edge (both side by side for cross-platform
 *   items) - informational on every device, never a filter
 * - `version` and `flags` ARE filters: parked (null) items, or items gated
 *   behind a disabled feature flag, are removed (currentVisibleWhatsNew()),
 *   so a dark or future feature is never advertised
 *
 * The archive holds catalog keys, not copy: every title and body renders
 * through t(), resolved once at the release boundary (getVisibleWhatsNew).
 */

import { FEATURE_FLAGS, type FeatureFlagId } from '@/shared/flags';
import { type TranslationKey, t } from '@/shared/i18n';
import { compareVersions } from '@/shared/versionUtils';

/** Platforms an item can exclusive to */
export type WhatsNewPlatform = 'ios' | 'android';

/** One archived entry: its copy as catalog keys, resolved for display through t() */
export interface WhatsNewArchiveItem {
  /** Catalog key holding the short factual title (max MAX_WHATS_NEW_TITLE_LENGTH chars) */
  titleKey: TranslationKey;
  /** Catalog key holding the one-line factual description (max MAX_WHATS_NEW_BODY_LENGTH chars) */
  bodyKey: TranslationKey;
  /** Marks the item as exclusive to a platform (badged on the other platform) */
  platform?: WhatsNewPlatform;
  /** Feature flags that must be enabled for the item to show - makes it
   * impossible to advertise a feature that is flagged off in the build */
  flags?: FeatureFlagId[];
  /** Release this item shipped in; null parks the item (drafted, never
   * shown) until stamped with a shipping version */
  version: string | null;
}

/** The archive a release's notes are maintained as: keys, not display copy */
export interface WhatsNewArchiveRelease {
  /** Store version these notes ship with: never rendered, and never a gate -
   * shouldShowWhatsNew reads only the item stamps, so the banner names the
   * release these notes ship with and the test oracle pins it to the build
   * version as proof the ritual ran */
  version: string;
  /** Archived items across releases; the newest display window shows */
  items: WhatsNewArchiveItem[];
}

/** One entry in the What's New modal */
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

/** The release notes for the current version, as the modal renders them */
export interface WhatsNewRelease {
  /** Store version these notes ship with: never rendered, and never a gate -
   * shouldShowWhatsNew reads only the item stamps, so the banner names the
   * release these notes ship with and the test oracle pins it to the build
   * version as proof the ritual ran */
  version: string;
  /** The changelog's items, newest release first, windowed to the newest
   * WHATS_NEW_DISPLAY_WINDOW entries, resolved to the copy the modal renders */
  items: WhatsNewItem[];
}

/** One version group of the changelog: its header label and its items */
export interface WhatsNewGroup {
  /** The major.minor of the group's items' versions, patch hidden (v1.29) */
  key: string;
  /** The group's items, newest first */
  items: WhatsNewItem[];
}

/** An archived item whose release stamp is set: the shape filterWhatsNewItems yields */
export type StampedWhatsNewArchiveItem = WhatsNewArchiveItem & { version: string };

/** Resolves one archived entry to the copy the modal renders */
const resolveItem = (item: StampedWhatsNewArchiveItem): WhatsNewItem => ({
  title: t(item.titleKey),
  body: t(item.bodyKey),
  platform: item.platform,
  flags: item.flags,
  version: item.version,
});

// =============================================================================
// CONTENT - grow per release; prune past MAX_WHATS_NEW_ARCHIVE
//
// WHETHER A RELEASE GETS A MODAL IS AN EDITORIAL DECISION, and it is the owner's.
// A real feature is worth interrupting someone for; a
// performance pass is not, and popping a modal for one just annoys people.
//
// So: stamp the shipped item with its release's version when the modal should
// appear, and ADD NOTHING when it should not. An archive with no item newer
// than the user's stored shown-version silent-ships by construction (owner
// order 2026-10-21, design B), and that is a choice, not a bug.
//
// The debut (owner order 2026-10-20): the modal opened with every feature the
// app has ever shipped. T-297 (owner order 2026-10-21) restamped each item with
// the version it truly shipped in, named from git history, so the groups name
// real releases.
// =============================================================================

export const WHATS_NEW: WhatsNewArchiveRelease | null = {
  version: '2.11.1',
  items: [
    {
      titleKey: 'whatsNew.title.language',
      bodyKey: 'whatsNew.body.language',
      version: '2.0.37',
    },
    {
      // The screen's own debut: the modal first shipped at 1.13.0 (git df08bfb1,
      // 2026-08-30), named from history per the T-297 restamp ruling
      titleKey: 'whatsNew.title.whatsNew',
      bodyKey: 'whatsNew.body.whatsNew',
      version: '1.13.0',
    },
    {
      titleKey: 'whatsNew.title.tabletSupport',
      bodyKey: 'whatsNew.body.tabletSupport',
      version: '1.24.10',
    },
    {
      titleKey: 'whatsNew.title.athanSounds',
      bodyKey: 'whatsNew.body.athanSounds',
      version: '1.24.10',
    },
    {
      titleKey: 'whatsNew.title.reminderSounds',
      bodyKey: 'whatsNew.body.reminderSounds',
      version: '1.24.10',
    },
    {
      // Unbadged: both platforms ship widgets and neither flag ever ships off again
      titleKey: 'whatsNew.title.widgets',
      bodyKey: 'whatsNew.body.widgets',
      version: '1.7.0',
    },
    {
      titleKey: 'whatsNew.title.secondReminder',
      bodyKey: 'whatsNew.body.secondReminder',
      version: '1.29.0',
    },
    {
      titleKey: 'whatsNew.title.helpPage',
      bodyKey: 'whatsNew.body.helpPage',
      version: '1.29.10',
    },
    {
      titleKey: 'whatsNew.title.qiblaCompass',
      bodyKey: 'whatsNew.body.qiblaCompass',
      version: '1.29.258',
    },
  ],
};

// =============================================================================
// CONTENT LIMITS - enforced by shared/__tests__/whatsNew.test.ts
// =============================================================================

/** Maximum archived items before pruning (oldest first) */
export const MAX_WHATS_NEW_ARCHIVE = 100;
/** Maximum title length in characters */
export const MAX_WHATS_NEW_TITLE_LENGTH = 32;
/** Maximum body length in characters */
export const MAX_WHATS_NEW_BODY_LENGTH = 96;
/** The changelog shows at most this many of the archive's newest items - the
 * owner's T-297 display window, a viewing limit distinct from the 100-entry
 * archive prune */
export const WHATS_NEW_DISPLAY_WINDOW = 20;

// =============================================================================
// DISPLAY RULES (pure functions - fully unit tested)
// =============================================================================

/**
 * Decides whether the What's New modal should be displayed
 *
 * Content-driven (owner order 2026-10-21, design B): the archive's newest
 * stamped item is the bar, and the modal shows only when that bar clears the
 * stored shown-version:
 * - A release that adds no stamped item never moves the bar, so a silent
 *   patch pops nothing by construction
 * - Fresh installs seed the shown-version to the installed version at first
 *   boot (see stores/version.ts handleAppUpgrade), and a stamp at or below
 *   the build never clears that seed, so fresh installs never see the modal
 * - A pre-tracker upgrader (no stored shown-version) gets the one catch-up
 *   display the debut gave everyone else, then the mark silences it
 * - The bar never outranks the running binary: a stamp ahead of it advertises
 *   an unshipped release and fails silent
 *
 * The release banner is never read here: it names the release these notes
 * ship with and nothing more (see the maintenance ritual above).
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

  const stamps = whatsNew.items
    .map((item) => item.version)
    .filter((version): version is string => version !== null)
    .sort(compareVersions);
  const newestStamp = stamps.length > 0 ? stamps[stamps.length - 1] : null;

  if (newestStamp === null) return false;
  // A stamp ahead of this build advertises an unshipped release; fail silent
  if (compareVersions(newestStamp, installedVersion) > 0) return false;
  if (!shownVersion) return true;

  return compareVersions(newestStamp, shownVersion) > 0;
};

/**
 * Filters the archive down to what this build may present
 *
 * An item shows only when BOTH hold: it is stamped with a real release
 * version (parked null items stay archived), and every feature flag it
 * declares is enabled. Which release an item shipped in no longer matters -
 * the changelog presents history. Pure: the parameters keep tests
 * deterministic.
 *
 * @param items - Archived items across releases
 * @param flags - Enabled-flag record (defaults to this build's flags)
 * @returns Items safe to show in this build, each stamped with its release
 */
export const filterWhatsNewItems = (
  items: WhatsNewArchiveItem[],
  flags: Record<FeatureFlagId, boolean> = FEATURE_FLAGS
): StampedWhatsNewArchiveItem[] =>
  items.filter(
    (item): item is StampedWhatsNewArchiveItem =>
      item.version !== null && !(item.flags ?? []).some((flag) => !flags[flag])
  );

/**
 * Groups the changelog's items under their release headings
 *
 * The key is the major.minor of each item's version with the patch hidden
 * (v1.29), because the patch number splits one release's feature set across
 * stray headings. Groups order newest-first - the first appearance in a
 * newest-first sort - and items keep the sort order inside their group.
 * Parked (null version) items have no release to sit under and never group.
 * Pure: the input array is never mutated.
 *
 * @param items - The changelog's items, in any order
 * @returns Groups keyed by release heading, newest group first
 */
export const groupWhatsNewItems = (items: WhatsNewItem[]): WhatsNewGroup[] => {
  const newestFirst = items
    .filter((item): item is WhatsNewItem & { version: string } => item.version !== null)
    .sort((a, b) => compareVersions(b.version, a.version));

  const groups: WhatsNewGroup[] = [];
  for (const item of newestFirst) {
    const [major, minor] = item.version.split('.');
    const key = `v${major}.${minor}`;
    const open = groups.find((group) => group.key === key);
    if (open) open.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
};

/**
 * A release as a build may present it: its visible items as the newest-first
 * display window, or null when nothing remains (silent-ship semantics apply
 * everywhere downstream). Pure: the parameters keep tests deterministic.
 *
 * @param release - Archived release content (null = silent release)
 * @param flags - Enabled-flag record of the build presenting it
 * @returns The release with its windowed items, resolved to display copy, or null
 */
export const getVisibleWhatsNew = (
  release: WhatsNewArchiveRelease | null,
  flags: Record<FeatureFlagId, boolean>
): WhatsNewRelease | null => {
  if (!release) return null;
  const items = filterWhatsNewItems(release.items, flags)
    .sort((a, b) => compareVersions(b.version, a.version))
    .slice(0, WHATS_NEW_DISPLAY_WINDOW);
  return items.length > 0 ? { version: release.version, items: items.map(resolveItem) } : null;
};

/**
 * WHATS_NEW as this build may present it, resolved against the ACTIVE catalog on
 * every call: a locale switch re-renders the archive without a reload (R1.3)
 */
export const currentVisibleWhatsNew = (): WhatsNewRelease | null => getVisibleWhatsNew(WHATS_NEW, FEATURE_FLAGS);

/**
 * Returns the platform availability badges for an item
 *
 * Every item declares where it is available, independent of the viewing
 * device: an iOS-exclusive item shows the Apple glyph, an Android-exclusive
 * item the Android glyph, and a cross-platform item shows both side by side.
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
