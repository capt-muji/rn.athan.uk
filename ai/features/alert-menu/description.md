# Feature: Alert Menu Bottom Sheet

**Status:** Approved
**Author:** muji
**Date:** 2026-01-25
**Specialist:** Architect

---

## Overview

Transform the prayer alert from a cycle-through popup (Off -> Silent -> Sound) to a **menu bottom sheet** that allows users to configure both at-time alerts and pre-prayer reminders for each prayer independently.

## Goals

- [ ] Replace tap-to-cycle alert behavior with bottom sheet menu
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

- [ ] Tapping alert icon opens bottom sheet (not cycle-through)
- [ ] Bottom sheet shows prayer name in header
- [ ] Radio options for Off/Silent/Sound
- [ ] Sound option shows chevron to open BottomSheetSound
- [ ] Selection persists after closing sheet

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
  -> Opens BottomSheetAlertMenu
  -> User selects at-time/reminder preferences
  -> On sheet dismiss:
     -> Update Jotai atoms (persisted to MMKV)
     -> Reschedule notifications for this prayer
```

### Components Affected

| Component                             | Change Type | Description                                 |
| ------------------------------------- | ----------- | ------------------------------------------- |
| `shared/types.ts`                     | Modified    | Add ReminderInterval type and constants     |
| `stores/notifications.ts`             | Modified    | Add reminder atoms, scheduling functions    |
| `stores/ui.ts`                        | Modified    | Add alert menu sheet refs and context atoms |
| `stores/database.ts`                  | Modified    | Add reminder database functions             |
| `shared/notifications.ts`             | Modified    | Add reminder Android channel                |
| `device/notifications.ts`             | Modified    | Add addOneScheduledReminderForPrayer        |
| `components/BottomSheetAlertMenu.tsx` | **New**     | Alert menu bottom sheet                     |
| `components/Alert.tsx`                | Modified    | Change press handler to open sheet          |
| `app/_layout.tsx`                     | Modified    | Add BottomSheetAlertMenu                    |

### State Changes

**New atoms:**

- `alertMenuSheetModalAtom` - BottomSheetModal ref
- `alertMenuContextAtom` - Current prayer being configured
- `standardReminderAlertAtoms[]` - Per-prayer reminder type
- `extraReminderAlertAtoms[]` - Per-prayer reminder type
- `standardReminderIntervalAtoms[]` - Per-prayer interval
- `extraReminderIntervalAtoms[]` - Per-prayer interval

**Storage keys:**

- `preference_reminder_alert_standard_{index}`
- `preference_reminder_alert_extra_{index}`
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

### Validation

```bash
yarn validate
```

## Risks & Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                  |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------- |
| iOS 64 notification limit exceeded          | Low        | High   | 2-day rolling window keeps count at ~40 max |
| Reminder scheduling conflicts with at-time  | Low        | Medium | Schedule reminder first, then at-time       |
| Bottom sheet conflicts with existing sheets | Low        | Low    | Use separate modal ref                      |

## Open Questions

- [x] Reminder sound file name? **Answer:** `reminders.wav` (hardcoded)
- [x] Max notifications per prayer? **Answer:** 2 (at-time + reminder)
- [x] Default reminder interval? **Answer:** 15 minutes

---

## Approval

- [x] Architect: Plan approved (88 -> 92 after revisions)
- [x] Implementer: Ready to build (88 -> 91 after revisions)
- [x] ReviewerQA: Security/quality concerns addressed (85 -> 91 after revisions)

**Aggregate Score: 91/100** (meets 90+ threshold)
