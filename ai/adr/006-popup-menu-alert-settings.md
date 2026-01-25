# ADR-006: Popup Menu for Alert Settings

**Status:** Accepted
**Date:** 2026-01-25
**Decision Makers:** User (product owner)

---

## Context

The app needs a UI for configuring per-prayer notification settings:

- At-time alert (Off/Silent/Sound)
- Pre-prayer reminder (Off/Silent/Sound)
- Reminder interval (5/10/15/20/25/30 minutes)

The initial design used a bottom sheet, but bottom sheets are the established pattern for **app-wide settings** (BottomSheetSettings, BottomSheetSound). Using a bottom sheet for prayer-specific settings creates UX inconsistency.

**Problem Identified:**

- Bottom sheets are used for global/app-wide settings in this app
- Alert settings are prayer-specific (each prayer configured independently)
- Current cycling popup (Off → Silent → Sound) doesn't support reminders
- Need visual connection between the menu and the specific prayer being configured

## Decision

**Use a floating popup menu that appears near the alert icon with an arrow pointing to it.**

Implementation approach:

1. Use React Native's built-in Modal component for tap-away dismissal
2. Reuse stored `measurementsListAtom` from List.tsx for positioning (no measureInWindow needed)
3. Calculate row Y position: `listMeasurements.pageY + (index * STYLES.prayer.height)`
4. Menu appears to the left of the alert icon with an SVG arrow pointing right
5. **Deferred commit** - Changes only saved on menu close, not on each tap
6. Guard against opening when overlay is active

### Deferred Commit Pattern

**Key architectural decision:** Notification rescheduling only happens when the menu closes, not on each option tap.

**Why:**

- User can make multiple changes (at-time, reminder, interval) before committing
- Avoids unnecessary notification churn during menu interaction
- If user makes no changes and closes menu, nothing happens (no impact)
- No delay on close - immediate commit if changes detected
- If app is force-closed while menu open, changes are NOT committed (intentional)

**How it works:**

1. On menu open: Load current values into local state, snapshot original values
2. On option tap: Update local state only (UI reflects change immediately)
3. On menu close: Compare local state vs original snapshot
4. If changed: Commit to Jotai atoms + reschedule notifications
5. If unchanged: Do nothing (zero notification impact)

**Menu close triggers (all trigger commit):**

- User taps outside menu (backdrop)
- User taps alert icon again (toggle)
- **Auto-close when countdown ≤ 2 seconds** (same as Overlay.tsx)
- Android back button

**NOT a close trigger (no commit):**

- App force-closed/killed while menu open → uncommitted changes lost (intentional)

### Visual Feedback for Dim Alerts

When tapping an alert icon that is dim (not the "next" prayer):

1. On menu open: Alert icon lights up (AnimFill.animate(1))
2. While menu open: Alert stays bright
3. On menu close: Alert returns to dim state (AnimFill.animate(0))

### No Debounce Needed

The alert icon now acts as a simple toggle for the popup menu:

- First tap → opens menu
- Second tap (or tap outside) → closes menu

This toggle behavior makes spam-click protection unnecessary. No debounce is implemented or required.

## Consequences

### Positive

- Contextual UI - arrow points to the specific prayer's alert icon
- **Efficient notifications** - only reschedules when menu closes with actual changes
- **No unnecessary rescheduling** - if user opens/closes without changing, zero impact
- Consistent with mobile popup menu patterns
- Maintains visual connection to prayer row
- Simple implementation - Modal handles tap-away automatically
- Reuses existing measurements (no new measureInWindow calls)
- No new Jotai atoms needed (uses local state in Alert.tsx)
- No debounce complexity (toggle pattern handles spam clicks naturally)

### Negative

- Position calculation needed for menu placement
- Must handle screen bounds edge cases (top/bottom clamping)
- Different pattern from existing bottom sheets (intentional)
- Slightly more complex state management (local vs committed state)

### Neutral

- Modal is built-in, no new dependencies
- All logic contained in Alert.tsx - simple maintenance
- Two new files created: AlertMenu.tsx, AlertMenuArrow.tsx

## Alternatives Considered

### Alternative 1: Bottom Sheet

**Description:** Open a bottom sheet when tapping the alert icon (similar to BottomSheetSettings).

**Pros:**

- Consistent with existing bottom sheet components
- More screen real estate for content
- Familiar to users of the app

**Cons:**

- Bottom sheets are for app-wide settings, not prayer-specific
- Loses visual connection to the alert being configured
- User must remember which prayer they're configuring
- Creates UX pattern confusion

**Why Rejected:** Bottom sheets are the established pattern for app-wide settings (sound selection, app settings). Using one for prayer-specific settings creates inconsistency.

### Alternative 2: Portal Pattern in \_layout.tsx

**Description:** Create AlertMenuPortal.tsx in \_layout.tsx with Jotai atoms for state management.

**Pros:**

- Clean separation of concerns
- Follows pattern similar to bottom sheets

**Cons:**

- More complex architecture (new file, new atoms, \_layout changes)
- Requires alertMenuStateAtom in stores/ui.ts
- Modal achieves same result with less code

**Why Rejected:** Adds unnecessary complexity. Modal with local state is simpler.

### Alternative 3: measureInWindow on Each Open

**Description:** Call measureInWindow on the alert icon ref each time the menu opens.

**Pros:**

- Gets exact position of the alert icon

**Cons:**

- Requires ref on alert icon
- Async measurement can cause position flicker
- More complex than reusing stored measurements

**Why Rejected:** List.tsx already stores measurements in measurementsListAtom. Row position = listY + (index × 57).

### Alternative 4: Immediate Scheduling on Each Tap

**Description:** Schedule notifications immediately when user taps an option in the menu.

**Pros:**

- Simpler state management (no deferred commit)
- Changes take effect immediately

**Cons:**

- Notification churn if user changes mind multiple times
- Unnecessary work if user opens menu but doesn't change anything
- Multiple reschedule operations during single menu session

**Why Rejected:** Deferred commit is more efficient - only reschedules once when menu closes, and skips entirely if nothing changed.

## Implementation Notes

- Use `measurementsListAtom` from stores/ui.ts (already captured by List.tsx)
- Row Y calculation: `listMeasurements.pageY + (index * STYLES.prayer.height)`
- STYLES.prayer.height = 57 (fixed)
- Screen bounds clamping with Math.max/min
- Guard: don't open menu if overlay.isOn
- SVG arrow follows PrayerExplanation.tsx pattern
- withSchedulingLock for race condition protection on commit
- **Deferred commit:** Compare `localState` vs `originalSnapshot` on close
- **No debounce:** Alert icon toggles menu open/close directly

## Related Decisions

- ADR-003: Prayer explanation contextual display (similar pattern - per-prayer UI)
- ADR-001: Rolling notification buffer (notification scheduling constraints)

---

## Revision History

| Date       | Author | Change                                             |
| ---------- | ------ | -------------------------------------------------- |
| 2026-01-25 | User   | Accepted - Popup menu over bottom sheet for alerts |
| 2026-01-25 | User   | v2 - Deferred commit pattern, removed debounce     |
