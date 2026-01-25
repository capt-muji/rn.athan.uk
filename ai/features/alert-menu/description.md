# Feature: Alert Menu Popup

**Status:** Approved
**Author:** muji
**Date:** 2026-01-25
**Specialist:** Architect

---

## Overview

Transform the prayer alert from a cycle-through popup (Off -> Silent -> Sound) to a **floating popup menu** that allows users to configure both at-time alerts and pre-prayer reminders for each prayer independently.

## Goals

- [ ] Replace tap-to-cycle alert behavior with popup menu
- [ ] Add pre-prayer reminder support (Off/Silent/Sound)
- [ ] Add configurable reminder intervals (5/10/15/20/25/30 min)
- [ ] Maintain per-prayer independence for all settings
- [ ] Enforce constraint: reminders require at-time notification enabled

## Non-Goals

- User-selectable reminder sound (hardcoded to `reminders.wav`)
- More than 2 notifications per prayer (at-time + reminder max)
- Global reminder settings (all settings are per-prayer)

## User Stories

### Story 1: Configure At-Time Alert

**As a** user
**I want** to open a menu when tapping a prayer's alert icon
**So that** I can see and select my notification preference (Off/Silent/Sound)

**Acceptance Criteria:**

- [ ] Tapping alert icon opens popup menu (not cycle-through)
- [ ] Popup menu shows near alert icon with arrow pointing to it
- [ ] Radio options for Off/Silent/Sound
- [ ] Sound option shows chevron to open BottomSheetSound
- [ ] Selection persists after closing menu

### Story 2: Configure Pre-Prayer Reminder

**As a** user
**I want** to enable a reminder notification before prayer time
**So that** I can prepare for prayer in advance

**Acceptance Criteria:**

- [ ] Reminder section visible only when at-time != Off
- [ ] Reminder options: Off (default) / Silent / Sound
- [ ] Reminder sound is hardcoded (plays reminders.wav)
- [ ] Reminder disabled automatically when at-time set to Off

### Story 3: Configure Reminder Interval

**As a** user
**I want** to choose how many minutes before prayer to receive the reminder
**So that** I can customize the notification timing

**Acceptance Criteria:**

- [ ] Interval picker visible only when reminder != Off
- [ ] Interval options: 5, 10, 15 (default), 20, 25, 30 minutes
- [ ] Interval persists per-prayer

## Technical Design

### Data Flow

```
User taps Alert icon
  -> Opens popup menu (Modal)
  -> If alert is dim (not next prayer): Light it up (AnimFill.animate(1))
  -> Snapshot current values (atTime, reminder, interval)
  -> User selects preferences (updates LOCAL state only)
  -> Menu closes via:
     - User taps outside (backdrop)
     - User taps alert icon again (toggle)
     - Countdown reaches ≤ 2 seconds (auto-close, same as Overlay.tsx)
     - Android back button
  -> On close: Compare local state vs original snapshot
     -> If CHANGED: Commit to Jotai atoms + reschedule notifications
     -> If UNCHANGED: Do nothing (zero notification impact)
  -> If alert was dim: Return to dim state (AnimFill.animate(0))
```

**Key principles:**

1. Notification rescheduling ONLY happens on menu close, and ONLY if something changed
2. No debounce needed (toggle pattern handles spam clicks naturally)
3. Auto-close at 2s matches Overlay.tsx behavior (still commits changes)
4. If app force-closed while menu open → uncommitted changes lost (intentional - keeps state in sync)

### Components Affected

| Component                       | Change Type | Description                              |
| ------------------------------- | ----------- | ---------------------------------------- |
| `shared/types.ts`               | Modified    | Add ReminderInterval type and constants  |
| `stores/notifications.ts`       | Modified    | Add reminder atoms, scheduling functions |
| `stores/database.ts`            | Modified    | Add reminder database functions          |
| `shared/notifications.ts`       | Modified    | Add reminder Android channel             |
| `device/notifications.ts`       | Modified    | Add addOneScheduledReminderForPrayer     |
| `components/AlertMenu.tsx`      | **New**     | Popup menu content component             |
| `components/AlertMenuArrow.tsx` | **New**     | SVG arrow pointing to alert icon         |
| `components/Alert.tsx`          | Modified    | Add Modal, remove cycling popup          |
| `hooks/useAlertPopupState.ts`   | **Delete**  | No longer needed                         |

### State Changes

**New atoms (in stores/notifications.ts):**

- `standardReminderAlertAtoms[]` - Per-prayer reminder type
- `extraReminderAlertAtoms[]` - Per-prayer reminder type
- `standardReminderIntervalAtoms[]` - Per-prayer interval
- `extraReminderIntervalAtoms[]` - Per-prayer interval

**Local state (in Alert.tsx):**

- `menuOpen` (boolean) - Whether popup is visible

**Storage keys:**

- `preference_reminder_standard_{index}`
- `preference_reminder_extra_{index}`
- `preference_reminder_interval_standard_{index}`
- `preference_reminder_interval_extra_{index}`

### API Changes

None - all local notifications.

## Edge Cases

| Scenario                                     | Expected Behavior                                |
| -------------------------------------------- | ------------------------------------------------ |
| At-time changed to Off when reminder enabled | Auto-disable reminder, clear scheduled reminders |
| Istijaba reminder on non-Friday              | Skip scheduling (same as at-time)                |
| Reminder time already passed                 | Skip scheduling for that day                     |
| App restart                                  | All preferences restored from MMKV               |

## Error Handling

| Error Condition   | User Message                              | Recovery                         |
| ----------------- | ----------------------------------------- | -------------------------------- |
| Permission denied | Toast: "Enable notifications in settings" | Guide to system settings         |
| Scheduling fails  | Silent (logged)                           | Will retry on next refresh cycle |

## Testing Plan

### Manual Tests

- [ ] Open alert menu for each prayer type
- [ ] At-time Off/Silent/Sound all work
- [ ] Sound chevron opens BottomSheetSound
- [ ] Reminder section hidden when at-time = Off
- [ ] Interval section hidden when reminder = Off
- [ ] Setting at-time to Off disables reminder
- [ ] Reminder notifications fire at correct time
- [ ] Settings persist across app restart
- [ ] Popup position correct for all prayer rows

### Validation

```bash
yarn validate
```

## Risks & Mitigations

| Risk                               | Likelihood | Impact | Mitigation                                  |
| ---------------------------------- | ---------- | ------ | ------------------------------------------- |
| iOS 64 notification limit exceeded | Low        | High   | 2-day rolling window keeps count at ~44 max |
| Menu position off-screen           | Medium     | Medium | Math.max/min clamping for bounds            |
| Z-index conflicts with Overlay     | Low        | Medium | Guard: don't open if overlay.isOn           |
| Reminder + at-time race condition  | Low        | Medium | Use withSchedulingLock for all scheduling   |

## Open Questions

- [x] Reminder sound file name? **Answer:** `reminders.wav` (hardcoded)
- [x] Max notifications per prayer? **Answer:** 2 (at-time + reminder)
- [x] Default reminder interval? **Answer:** 15 minutes

---

## Approval

- [x] Architect: Plan approved
- [x] Implementer: Ready to build
- [x] ReviewerQA: Security/quality concerns addressed

**Decision:** ADR-006 (Popup Menu over Bottom Sheet)
