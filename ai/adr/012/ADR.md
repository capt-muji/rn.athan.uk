# ADR-012: Post-Update "What's New" Modal

**Status:** Accepted
**Date:** 2026-08-30
**Decision Makers:** muji

---

## Context

The app has a dismissible "Update Available!" nag (`device/updates.ts` + `releases.json`/iTunes Lookup) that fires *before* a user updates. Nothing fires *after* an update: with ~50% of users on auto-update (who never see store release notes) and manual updaters who skim them at best, new capabilities (e.g. the iOS widgets in 1.13.0) ship invisibly. Research (Userpilot's 2026 announcement guide, NNGroup, Ducalis release-notes analysis, Linear/Notion/Segment/Slack patterns, r/reactnative implementations) converged on:

- A first-launch post-update modal is the standard channel for Tier-1 releases (new capabilities); minor fixes silent-ship to store notes only.
- The interruptive surface shows **release notes** (per-version by definition); multi-version history is a **changelog archive** — a separate, opt-in artifact.
- Copy leads with what the user can do; technical work (SDK migrations, performance, refactors) is excluded — users don't care and it trains them to dismiss.
- Fresh installs never see it (the store already shows notes at install time); reinstalls are fresh installs.

## Decision

1. **Bundled content, not remote.** A single typed constant `WHATS_NEW: WhatsNewRelease | null` in `shared/whatsNew.ts` ships in the binary. `null` = silent release. The modal's one critical moment — first launch post-update — can be offline; release notes are frozen at submission anyway. Contrast: `releases.json` stays remote because the update nag must change without a binary.
2. **Show rule (pure function `shouldShowWhatsNew`).** Show iff content exists AND `whats_new_shown_version ≠ installed` AND (absent OR older than installed). A separate MMKV key — NOT `app_installed_version`, which `handleAppUpgrade()` overwrites at boot.
3. **Fresh-install seeding.** `handleAppUpgrade()` captures `storedVersion` before overwriting; when absent (fresh install) it seeds `whats_new_shown_version = installed`. Existing users upgrading have an old/absent key → modal shows. Uninstall wipes MMKV → reinstall is a fresh install → never shows.
4. **Latest-version-only, by construction.** The binary contains only its own release's notes, so a user skipping N versions still sees only the installed version's items — no accumulation logic exists to maintain. (If several major features ever batch across unreleased versions, the remedy is a capped highlights list ≤4 items, never a stacked history.)
5. **Mark shown on display**, not dismiss — a crash mid-read cannot re-loop the modal.
6. **Platform is an availability glyph, never a filter.** Items may carry `platform?: 'ios' | 'android'`. The item's leading column renders filled Apple/Android glyphs (black on white, stacked, no container — owner-picked from a 14-variant design lab): one glyph for platform-exclusive items, both stacked for cross-platform items. Identical on every device (owner decision: Android users should see the app is maintained). The modal never hides on platform grounds.
7. **Presentation.** Centered modal reusing `components/modals/Modal.tsx` + `COLORS.light` tokens, title "What's New", subtitle renders the *runtime installed version* (EAS `appVersionSource: remote` — never a hand-synced string), one full-width Continue button. Copy: factual, no marketing.
8. **Nag sequencing.** When both are eligible (user lands on a non-latest version), What's New renders first; the nag is gated on `updateAvailable && !whatsNewVisible` and appears after Continue. Modals never stack.
9. **Always-accessible re-open.** A "What's new" row in the Settings sheet (hidden when `WHATS_NEW` is null) re-opens the modal — display-only, never touches the shown-version key. This is the lightweight version of the "passive changelog repository" best practice.
10. **Storage whitelists.** `whats_new_shown_version` is in BOTH `UPGRADE_KEEP_PREFIXES` (`stores/version.ts`) and the `updatePrayerData()` clear-except list (`stores/sync.ts`) — otherwise upgrade cache-clears wipe it and the modal re-shows.
11. **Dev preview.** `EXPO_PUBLIC_WHATS_NEW_PREVIEW=1` (gated on `__DEV__`) forces the modal on cold launch for screenshot/QA without version gymnastics.

## Consequences

### Positive

- Auto-updaters (half the base) finally learn what they got
- Once per version, crash-safe, offline-safe, deterministic
- Silent-ship path (`null`) keeps patch releases quiet — announcement fatigue is the #1 failure mode in the research
- Content contract test guards future release edits (item count, title/body caps, valid icons/platforms)

### Negative

- Copy is frozen at submission — a post-release typo needs a new release (accepted; same as Apple's own release notes)
- One more key to remember in two whitelists (mitigated by tests asserting both)

### Neutral

- `WHATS_NEW` is edited every release — same ritual as `releases.json`, documented in README §Release

## Alternatives Considered

### Remote content (extend `releases.json` with `whatsNew`)

**Description:** Fetch notes at runtime keyed by version.
**Pros:** Post-release copy edits; A/B testing.
**Cons:** First-launch-offline misses the one moment that matters; fetch/throttle complexity; no EAS Update channels exist to justify it.
**Why Rejected:** The display moment is offline-critical; editability of frozen-at-release copy has no real buyer here.

### Accumulated / "since last seen" notes

**Description:** Bundle a version→notes map; show everything newer than the shown-version.
**Pros:** Nothing missed for skip-updaters.
**Cons:** Longer modal (announcement fatigue); intermediate versions are noise (iterations of features the user never saw); stale bundled history.
**Why Rejected:** Industry scopes release notes per-version; "since last seen" is a pull-feed pattern (archive), not a push modal. For this app's one-feature-at-a-time cadence, latest-only loses nothing.

### Bottom-sheet / paginated carousel

**Description:** Sheet matching Settings idiom, or Segment-style "1 of 3" pages.
**Pros:** Roomier; walkthrough feel.
**Cons:** Heavier than 2-4 items warrant; sheets read as "browsing", system messages read as dialogs (matches the Update modal idiom).
**Why Rejected:** Overkill for the content volume; consistency with the existing system-dialog idiom wins.

### 5-second Continue block

**Description:** Grey out Continue briefly to force reading.
**Pros:** Ensures glance time.
**Cons:** Hostile, especially for elderly users; a dev in the wild does it for 3s and the thread's commenters don't endorse it either.
**Why Rejected:** Owner reversed during design; the Settings re-open button is the respectful answer to "dismissed too fast".

## Implementation Notes

- Mount: `app/index.tsx` beside `ModalUpdate` (after sync resolves); trigger in the mount-only effect next to `checkForUpdates`.
- The shown-version capture in `handleAppUpgrade()` must happen BEFORE `setStoredVersion()` overwrites `app_installed_version`.
- Title version comes from `getInstalledVersion()` at runtime — `WHATS_NEW.version` is dev sanity only (local app.json lags EAS-managed store versions).
- UAT builds auto-preview the draft: any internal version bump re-triggers the modal for testers.
- Release ritual: set `WHATS_NEW.version` to the store version at cut, review screenshots, submit; next cycle edit items or null.

## Related Decisions

- ADR-011 (widget countdown policy) — the feature this modal announces in 1.13.0
- `releases.json` update-nag flow (device/updates.ts) — the "before" counterpart of this "after" modal

---

## Revision History

| Date       | Author | Change        |
| ---------- | ------ | ------------- |
| 2026-08-30 | muji   | Initial draft |
