# Implementation Plan: Alert Menu Popup (v12 - FINAL)

**Status:** Under Review
**Created:** 2026-01-25
**Revised:** 2026-01-25 (v12 - added minor recommendations from specialists)
**Specialist:** Architect

---

## Summary

Transform the prayer alert from a cycle-through popup to a **floating popup menu** with:
1. At-Time Alert (Off/Silent/Sound)
2. Pre-Prayer Reminder (Off/Silent/Sound) - requires at-time enabled
3. Reminder Interval (5/10/15/20/25/30 min) - visible when reminder enabled

**CRITICAL: This is a POPUP MENU, NOT a bottom sheet.**

**Decision:** ADR-006 (Popup Menu over Bottom Sheet)

---

## Key Behavioral Changes (v9)

### 1. No Debounce Required
The alert icon now acts as a simple **toggle** for the popup menu:
- Tap → opens menu
- Tap again (or tap outside) → closes menu

This toggle behavior makes spam-click protection unnecessary. No debounce is implemented.

### 2. Deferred Commit Pattern
Notification rescheduling **ONLY** happens when the menu closes:

```
Menu Opens:
  -> Snapshot current values (atTime, reminder, interval)
  -> Load into local state
  -> If alert is dim (not next prayer): Light it up

User Interacts:
  -> Taps update LOCAL state only
  -> UI reflects changes immediately
  -> NO notification scheduling yet

Menu Closes (via any trigger):
  -> Compare local state vs original snapshot
  -> IF CHANGED: Commit to Jotai + reschedule notifications
  -> IF UNCHANGED: Do nothing (zero notification impact)
  -> If alert was dim: Return to dim state
```

**Benefits:**
- No notification churn during menu interaction
- User can change mind multiple times before committing
- Zero impact if user opens menu without changing anything

### 3. Auto-Close on Timer (NEW in v9)
**Same behavior as Overlay.tsx:** When countdown reaches ≤ 2 seconds, auto-close the menu.

```typescript
// Monitor countdown - when ≤ 2 seconds, trigger close with commit
useEffect(() => {
  if (menuOpen && countdown.timeLeft <= 2 && countdown.timeLeft > 0) {
    handleCloseMenu(); // This commits changes
  }
}, [menuOpen, countdown.timeLeft]);
```

**Why:** Prevents menu from blocking the UI when prayer time is imminent.

### 4. Dim Alert Visual Feedback (NEW in v9)
When tapping an alert that is **dim** (not the "next" prayer, not passed):

```typescript
// On menu OPEN - if alert is dim, light it up
const handlePress = useCallback(() => {
  // ... guards ...

  // Light up dim alert when opening menu
  if (!Prayer.isNext) {
    AnimFill.animate(1); // Bright
  }

  setMenuOpen(true);
}, [Prayer.isNext]);

// On menu CLOSE - if alert was dim, return to dim
const handleCloseMenu = useCallback(async () => {
  setMenuOpen(false);

  // Return dim alert to dim state
  if (!Prayer.isNext) {
    AnimFill.animate(0); // Dim
  }

  // ... commit logic ...
}, [Prayer.isNext]);
```

**Why:** Visual feedback shows which alert is being configured.

### 5. App Force-Close Behavior (CONFIRMED)
If user opens menu, makes changes, but **force-closes the app** (without closing the menu):
- Changes are **NOT committed** (intentional)
- State remains in sync (Jotai atoms unchanged)
- Next app open shows original values

**Why:** Deferred commit pattern ensures state consistency. Only explicit close triggers commit.

---

## Key Constraints (from ADR-001)

- Reminders require at-time notification to be enabled
- Reminder sound is hardcoded `reminders.wav` (not user-selectable)
- Each prayer configured independently (per-prayer settings)
- Max 2 notifications per prayer (at-time + reminder)
- **Notification limit:** 11 prayers x 2 notifications x 2 days = 44 max (under iOS 64 limit)

---

## Architecture (v5 - Reviewed)

### Key Insight

Use Modal with local state in Alert.tsx. Reuse stored `measurementsListAtom` from List.tsx for positioning.

### Position Calculation Formula

```typescript
// From measurementsListAtom (same pattern as Overlay.tsx)
const listMeasurements = useAtomValue(measurementsListAtom);
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Calculate row Y position
const rowY = listMeasurements.pageY + (index * STYLES.prayer.height);

// Menu dimensions (estimated)
const MENU_HEIGHT = 280; // Approximate height for all sections
const MENU_WIDTH = 200;

// Center menu vertically on the row, clamp to screen bounds
const menuTop = Math.max(
  SPACING.xl, // Min top padding
  Math.min(
    rowY + (STYLES.prayer.height / 2) - (MENU_HEIGHT / 2),
    screenHeight - MENU_HEIGHT - SPACING.xl // Max bottom
  )
);

// Position menu to the left of the alert icon
const menuRight = screenWidth - listMeasurements.pageX - listMeasurements.width + SPACING.gap;
```

### Stale Measurements Guard

```typescript
// Don't open menu if measurements not yet captured
if (listMeasurements.pageY === 0) {
  logger.warn('Alert menu: measurements not ready');
  return;
}
```

### Why Modal (Not View)

**Justification:** A View with absolute positioning inside Alert.tsx gets clipped by parent ScrollView/container boundaries. Modal escapes the React component tree, providing:
- Full-screen backdrop for tap-away dismissal
- No z-index conflicts with parent containers
- Built-in animation support

**Alternative considered:** Portal pattern in _layout.tsx - rejected for added complexity.

### What This Eliminates
- No `AlertMenuPortal.tsx` file
- No `alertMenuStateAtom` in stores/ui.ts
- No changes to `_layout.tsx`
- No `measureInWindow` calls

### What We Keep
- Menu positioned near alert with arrow
- Tap-away dismissal (Modal's backdrop)
- **Deferred commit** (no save/cancel buttons, but scheduling happens on close)
- Overlay guard (don't open when overlay active)
- Screen bounds clamping
- All notification/reminder infrastructure

---

## Phases

### Phase 0: Documentation
- [x] Create ADR-006-popup-menu-alert-settings.md
- [x] Update ai/features/alert-menu/description.md
- [x] Update ai/features/alert-menu/plan.md (this file)
- [ ] Document forwardRef + useImperativeHandle pattern in ai/AGENTS.md

**Task 0.4: Document forwardRef Pattern in AGENTS.md**

- **File:** `ai/AGENTS.md`
- **Change Type:** Modified
- **Description:** Document forwardRef + useImperativeHandle as an approved pattern
- **Complexity:** Small

Add to the React Patterns section in AGENTS.md:

```markdown
### forwardRef + useImperativeHandle Pattern

Use this pattern when a parent component needs to read child state without lifting state up:

```typescript
// Child component
interface ChildHandle {
  getState: () => SomeState;
}

const Child = forwardRef<ChildHandle, ChildProps>(function Child(props, ref) {
  const [state, setState] = useState<SomeState>(initialState);

  useImperativeHandle(ref, () => ({
    getState: () => state,
  }), [state]);

  return <View>...</View>;
});

// Parent component
const Parent = () => {
  const childRef = useRef<ChildHandle>(null);

  const handleSomething = () => {
    const childState = childRef.current?.getState();
    // Use child state...
  };

  return <Child ref={childRef} />;
};
```

**When to use:**
- Parent needs to read child's local state (e.g., deferred commit pattern)
- Child owns UI state, parent owns commit/submit logic
- Avoids lifting state up or creating Jotai atoms for temporary state

**First used:** AlertMenu.tsx (Alert Menu Popup feature)
```

**Acceptance Criteria:**
- [ ] forwardRef pattern documented in AGENTS.md
- [ ] Example code included
- [ ] Use cases explained
- [ ] Reference to first usage (AlertMenu.tsx)

---

### Phase 1: Types & Data Layer

### Phase 2: Notification Infrastructure

### Phase 3: UI Components

### Phase 4: Integration & Testing

---

## Task Breakdown

### Phase 1: Types & Data Layer

**Task 1.1: Add Reminder Types**

- **Files:** `shared/types.ts`, `shared/constants.ts`
- **Change Type:** Modified
- **Description:** Add ReminderInterval type and constants
- **Complexity:** Small

**In shared/types.ts:**
```typescript
// Add after AlertType enum (around line 175)

/**
 * Reminder interval options in minutes
 * Used for pre-prayer reminder notifications
 */
export type ReminderInterval = 5 | 10 | 15 | 20 | 25 | 30;

/**
 * State snapshot for alert menu deferred commit pattern
 * Used to compare original vs current state on menu close
 */
export interface AlertMenuState {
  atTimeType: AlertType;
  reminderType: AlertType;
  interval: number;
}
```

**In shared/constants.ts:**
```typescript
// Add in NOTIFICATION CONFIGURATION section

/** Available reminder intervals in minutes */
export const REMINDER_INTERVALS: readonly number[] = [5, 10, 15, 20, 25, 30] as const;

/** Default reminder interval (15 minutes) */
export const DEFAULT_REMINDER_INTERVAL = 15;

/**
 * Validates and returns a valid reminder interval
 * Falls back to DEFAULT_REMINDER_INTERVAL if invalid
 */
export const validateReminderInterval = (value: unknown): number => {
  if (typeof value === 'number' && REMINDER_INTERVALS.includes(value)) {
    return value;
  }
  return DEFAULT_REMINDER_INTERVAL;
};
```

**Acceptance Criteria:**
- [ ] ReminderInterval type exported from types.ts
- [ ] **AlertMenuState interface** exported from types.ts (consolidated location)
- [ ] REMINDER_INTERVALS array exported from constants.ts
- [ ] DEFAULT_REMINDER_INTERVAL constant exported
- [ ] validateReminderInterval helper for runtime validation

---

**Task 1.2: Add Reminder Atoms to stores/notifications.ts**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Add atoms for reminder preferences with validation
- **Complexity:** Medium
- **Dependencies:** Task 1.1

```typescript
import { ReminderInterval } from '@/shared/types';
import { DEFAULT_REMINDER_INTERVAL, validateReminderInterval } from '@/shared/constants';

// =============================================================================
// REMINDER ATOMS
// =============================================================================

/**
 * Factory function to create a reminder alert atom
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer (0-based, validated)
 */
export const createReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const type = scheduleType === ScheduleType.Standard ? 'standard' : 'extra';
  return atomWithStorageNumber(`preference_reminder_${type}_${prayerIndex}`, AlertType.Off);
};

/**
 * Factory function to create a reminder interval atom
 * Uses validateReminderInterval for runtime validation
 */
export const createReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const type = scheduleType === ScheduleType.Standard ? 'standard' : 'extra';
  return atomWithStorageNumber(`preference_reminder_interval_${type}_${prayerIndex}`, DEFAULT_REMINDER_INTERVAL);
};

/** Reminder alert atoms for standard prayers (6 prayers) */
export const standardReminderAlertAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Standard, index)
);

/** Reminder alert atoms for extra prayers (5 prayers) */
export const extraReminderAlertAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Extra, index)
);

/** Reminder interval atoms for standard prayers */
export const standardReminderIntervalAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Standard, index)
);

/** Reminder interval atoms for extra prayers */
export const extraReminderIntervalAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Extra, index)
);

// =============================================================================
// REMINDER HELPERS
// =============================================================================

/**
 * Gets the Jotai atom for a specific prayer's reminder alert
 * @throws Error if prayerIndex is out of bounds
 */
export const getReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderAlertAtoms : extraReminderAlertAtoms;

  if (prayerIndex < 0 || prayerIndex >= atoms.length) {
    throw new Error(`Invalid prayer index: ${prayerIndex} for ${scheduleType}`);
  }

  return atoms[prayerIndex];
};

/** Gets the current reminder alert type for a prayer */
export const getReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number): AlertType => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

/** Sets the reminder alert type for a prayer */
export const setReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);
};

/**
 * Gets the Jotai atom for a specific prayer's reminder interval
 * @throws Error if prayerIndex is out of bounds
 */
export const getReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderIntervalAtoms : extraReminderIntervalAtoms;

  if (prayerIndex < 0 || prayerIndex >= atoms.length) {
    throw new Error(`Invalid prayer index: ${prayerIndex} for ${scheduleType}`);
  }

  return atoms[prayerIndex];
};

/** Gets the current reminder interval for a prayer (validated) */
export const getReminderInterval = (scheduleType: ScheduleType, prayerIndex: number): number => {
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  const value = store.get(atom);
  return validateReminderInterval(value);
};

/** Sets the reminder interval for a prayer */
export const setReminderInterval = (scheduleType: ScheduleType, prayerIndex: number, interval: number) => {
  const validInterval = validateReminderInterval(interval);
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  store.set(atom, validInterval);
};
```

**Acceptance Criteria:**
- [ ] Reminder alert atoms created for all 11 prayers
- [ ] Reminder interval atoms created for all 11 prayers
- [ ] All 6 helper functions implemented with bounds checking
- [ ] Runtime validation with validateReminderInterval
- [ ] Default values: AlertType.Off for alerts, 15 for intervals
- [ ] Storage keys: `preference_reminder_${type}_${index}`, `preference_reminder_interval_${type}_${index}`

---

### Phase 2: Notification Infrastructure

**Task 2.1: Add Database Functions to stores/database.ts**

- **File:** `stores/database.ts`
- **Change Type:** Modified
- **Description:** Add functions to track reminder notifications
- **Complexity:** Small

```typescript
// =============================================================================
// REMINDER NOTIFICATION TRACKING
// =============================================================================

/**
 * Adds a scheduled reminder notification record
 * Key format: scheduled_reminders_{scheduleType}_{prayerIndex}_{id}
 */
export const addOneScheduledReminderForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: { id: string; date: string; time: string }
) => {
  const key = `scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}`;
  setItem(key, notification);
  logger.info('REMINDER DB: Added:', notification);
};

/**
 * Gets all scheduled reminder records for a prayer
 */
export const getAllScheduledRemindersForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number
): { id: string; date: string; time: string }[] => {
  const prefix = `scheduled_reminders_${scheduleType}_${prayerIndex}_`;
  return getAllWithPrefix(prefix) as { id: string; date: string; time: string }[];
};

/**
 * Clears all scheduled reminder records for a prayer
 */
export const clearAllScheduledRemindersForPrayer = (scheduleType: ScheduleType, prayerIndex: number) => {
  clearPrefix(`scheduled_reminders_${scheduleType}_${prayerIndex}_`);
};

/**
 * Clears all scheduled reminder records for an entire schedule
 */
export const clearAllScheduledRemindersForSchedule = (scheduleType: ScheduleType) => {
  clearPrefix(`scheduled_reminders_${scheduleType}_`);
};

// UPDATE cleanup() function - add these lines:
export const cleanup = () => {
  // ... existing prefixes ...
  clearPrefix('scheduled_reminders_');           // All reminder tracking
  clearPrefix('preference_reminder_');           // Reminder alert preferences
  clearPrefix('preference_reminder_interval_');  // Reminder interval preferences
};
```

**Acceptance Criteria:**
- [ ] addOneScheduledReminderForPrayer function added
- [ ] getAllScheduledRemindersForPrayer function added
- [ ] clearAllScheduledRemindersForPrayer function added
- [ ] clearAllScheduledRemindersForSchedule function added
- [ ] cleanup() updated with 3 new prefixes
- [ ] Key format: `scheduled_reminders_{scheduleType}_{prayerIndex}_{id}`

---

**Task 2.2: Add Reminder Content Generator to shared/notifications.ts**

- **File:** `shared/notifications.ts`
- **Change Type:** Modified
- **Description:** Add reminder notification content + Android channel
- **Complexity:** Small

```typescript
import { AlertType } from '@/shared/types';

/**
 * Generates notification content for a pre-prayer reminder
 *
 * @param englishName Prayer name in English (e.g., "Fajr")
 * @param arabicName Prayer name in Arabic (e.g., "الفجر")
 * @param intervalMinutes Minutes before prayer (e.g., 15)
 * @param alertType Alert type (Silent or Sound)
 * @returns Notification content for Expo Notifications
 *
 * @example
 * genReminderNotificationContent("Fajr", "الفجر", 15, AlertType.Sound)
 * // Returns: { title: "Fajr in 15 min", body: "‎الفجر", sound: "reminders.wav" }
 */
export const genReminderNotificationContent = (
  englishName: string,
  arabicName: string,
  intervalMinutes: number,
  alertType: AlertType
): Notifications.NotificationContentInput => {
  return {
    title: `${englishName} in ${intervalMinutes} min`,
    body: `\u200E${arabicName}`, // LTR mark for Arabic
    sound: alertType === AlertType.Sound ? 'reminders.wav' : false,
    color: '#5a3af7',
    priority: Notifications.AndroidNotificationPriority.HIGH,
    interruptionLevel: 'timeSensitive',
  };
};

/**
 * Creates the Android notification channel for reminders
 * Must be called on app start (Android only)
 */
export const createReminderAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reminder', {
    name: 'Prayer Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'reminders.wav',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
  });

  logger.info('NOTIFICATION: Created reminder Android channel');
};

// UPDATE initializeNotifications to include reminder channel:
export const initializeNotifications = async (
  checkPermissions: () => Promise<boolean>,
  refreshFn: () => Promise<void>
) => {
  try {
    await createDefaultAndroidChannel();
    await createReminderAndroidChannel(); // ADD THIS LINE

    const hasPermission = await checkPermissions();
    if (hasPermission) await refreshFn();
    else logger.info('NOTIFICATION: Notifications disabled, skipping refresh');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to initialize notifications:', error);
  }
};
```

**Acceptance Criteria:**
- [ ] genReminderNotificationContent returns correct format
- [ ] Title format: "{Prayer} in {X} min"
- [ ] Sound: reminders.wav for Sound type, false for Silent
- [ ] createReminderAndroidChannel creates channel with ID 'reminder'
- [ ] initializeNotifications calls createReminderAndroidChannel
- [ ] Verify reminders.wav exists in assets/audio

---

**Task 2.3: Add Device Reminder Functions to device/notifications.ts**

- **File:** `device/notifications.ts`
- **Change Type:** Modified
- **Description:** Add functions to schedule and clear reminder notifications
- **Complexity:** Medium
- **Dependencies:** Task 2.2, Task 2.1

```typescript
import { subMinutes } from 'date-fns';

/**
 * Schedules a single reminder notification for a prayer
 *
 * @param englishName Prayer name in English
 * @param arabicName Prayer name in Arabic
 * @param date Date string (YYYY-MM-DD)
 * @param time Prayer time string (HH:mm)
 * @param reminderAlertType Alert type (Silent or Sound)
 * @param intervalMinutes Minutes before prayer to trigger reminder
 * @returns Notification metadata for database storage
 */
export const addOneScheduledReminderForPrayer = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  reminderAlertType: AlertType,
  intervalMinutes: number
): Promise<{ id: string; date: string; time: string }> => {
  // Calculate trigger time = prayer time - interval
  const prayerDateTime = NotificationUtils.genTriggerDate(date, time);
  const triggerDateTime = subMinutes(prayerDateTime, intervalMinutes);

  // Generate content
  const content = NotificationUtils.genReminderNotificationContent(
    englishName,
    arabicName,
    intervalMinutes,
    reminderAlertType
  );

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDateTime,
        channelId: Platform.OS === 'android' ? 'reminder' : undefined,
      },
    });

    // Format trigger time for database (HH:mm)
    const triggerTime = format(triggerDateTime, 'HH:mm');

    logger.info('REMINDER SYSTEM: Scheduled:', { id, date, time: triggerTime, englishName, intervalMinutes });
    return { id, date, time: triggerTime };
  } catch (error) {
    logger.error('REMINDER SYSTEM: Failed to schedule:', error);
    throw error;
  }
};

/**
 * Clears all scheduled reminders for a specific prayer from device
 */
export const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const reminders = Database.getAllScheduledRemindersForPrayer(scheduleType, prayerIndex);

  await Promise.all(
    reminders.map((r) => Notifications.cancelScheduledNotificationAsync(r.id))
  );

  logger.info('REMINDER SYSTEM: Cancelled all reminders for prayer:', { scheduleType, prayerIndex, count: reminders.length });
};
```

**Acceptance Criteria:**
- [ ] addOneScheduledReminderForPrayer schedules at (prayer time - interval)
- [ ] Uses 'reminder' channel on Android
- [ ] Returns { id, date, time } for database storage
- [ ] clearAllScheduledRemindersForPrayer cancels all reminders
- [ ] Error handling with logger.error

---

**Task 2.4: Add Reminder Scheduling to stores/notifications.ts**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Add reminder scheduling with 30-second buffer
- **Complexity:** Medium
- **Dependencies:** Tasks 1.2, 2.1, 2.3

```typescript
import { subMinutes, differenceInSeconds } from 'date-fns';

/**
 * 30-second buffer for "already passed" check
 *
 * RATIONALE: Prevents scheduling notifications that would fire immediately
 * or within a very short window, which could cause notification spam.
 * The 30-second buffer gives enough time for the notification to be
 * properly scheduled by the OS.
 */
const REMINDER_BUFFER_SECONDS = 30;

/**
 * Schedules a single reminder notification for a prayer on a specific date
 *
 * Handles:
 * - Validation that trigger time is in future (with 30s buffer)
 * - Istijaba filtering (skip on non-Fridays)
 * - Database storage of notification metadata
 */
async function scheduleReminderNotificationForDate(
  scheduleType: ScheduleType,
  prayerIndex: number,
  date: string,
  englishName: string,
  arabicName: string,
  reminderAlertType: AlertType,
  intervalMinutes: number
): Promise<void> {
  try {
    const dateObj = TimeUtils.createLondonDate(date);
    const prayerData = Database.getPrayerByDate(dateObj);
    if (!prayerData) {
      logger.warn('REMINDER: No prayer data for date:', { date });
      return;
    }

    const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];
    if (!prayerTime || typeof prayerTime !== 'string') {
      logger.warn('REMINDER: Invalid prayer time:', { date, englishName });
      return;
    }

    // Calculate trigger time = prayer time - interval
    const prayerDateTime = NotificationUtils.genTriggerDate(date, prayerTime);
    const triggerDateTime = subMinutes(prayerDateTime, intervalMinutes);
    const now = new Date();

    // Skip if trigger time is in past (with 30-second buffer)
    const secondsUntilTrigger = differenceInSeconds(triggerDateTime, now);
    if (secondsUntilTrigger < REMINDER_BUFFER_SECONDS) {
      logger.info('REMINDER: Skipping past/imminent reminder:', {
        date,
        prayerTime,
        englishName,
        intervalMinutes,
        secondsUntilTrigger
      });
      return;
    }

    // Skip Istijaba on non-Fridays
    if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
      logger.info('REMINDER: Skipping Istijaba on non-Friday:', { date });
      return;
    }

    const notification = await Device.addOneScheduledReminderForPrayer(
      englishName,
      arabicName,
      date,
      prayerTime,
      reminderAlertType,
      intervalMinutes
    );

    Database.addOneScheduledReminderForPrayer(scheduleType, prayerIndex, notification);
  } catch (error) {
    logger.error('REMINDER: Failed to schedule notification:', { error, date, englishName });
  }
}

/**
 * Schedule multiple reminders (X days) for a single prayer (internal)
 */
const _addMultipleScheduleRemindersForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  reminderAlertType: AlertType
) => {
  // Clear existing reminders first
  await clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);

  if (reminderAlertType === AlertType.Off) return;

  const interval = getReminderInterval(scheduleType, prayerIndex);
  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);

  await Promise.all(
    nextXDays.map((date) =>
      scheduleReminderNotificationForDate(
        scheduleType,
        prayerIndex,
        date,
        englishName,
        arabicName,
        reminderAlertType,
        interval
      )
    )
  );

  logger.info('REMINDER: Scheduled multiple reminders:', { scheduleType, prayerIndex, englishName, interval });
};

/**
 * Schedule multiple reminders for a single prayer (public, with lock)
 */
export const addMultipleScheduleRemindersForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  reminderAlertType: AlertType
) => {
  return withSchedulingLock(
    () => _addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, reminderAlertType),
    'addMultipleScheduleRemindersForPrayer'
  );
};

/**
 * Clears all scheduled reminders for a specific prayer
 */
export const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
};
```

**Acceptance Criteria:**
- [ ] REMINDER_BUFFER_SECONDS = 30 with documented rationale
- [ ] scheduleReminderNotificationForDate handles all edge cases
- [ ] Istijaba filtering for non-Fridays
- [ ] Uses withSchedulingLock for race protection
- [ ] Error handling with logger.error (non-blocking)
- [ ] clearAllScheduledRemindersForPrayer clears device + database

---

**Task 2.5: Add Constraint Enforcement to setPrayerAlertType**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** When at-time is Off, auto-disable reminder (atomic operation)
- **Complexity:** Small
- **Dependencies:** Task 2.4

```typescript
/**
 * Sets the alert type for a specific prayer
 *
 * CONSTRAINT: When at-time is set to Off, reminder is also disabled.
 * This is an atomic operation - both state changes happen together.
 * Notification cleanup is fire-and-forget (errors logged, not thrown).
 */
export const setPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);

  // CONSTRAINT: When at-time is turned off, disable reminder atomically
  if (alertType === AlertType.Off) {
    const reminderAtom = getReminderAlertAtom(scheduleType, prayerIndex);
    store.set(reminderAtom, AlertType.Off);

    // Fire-and-forget cleanup (errors logged but don't block UI)
    clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex).catch((error) =>
      logger.error('Failed to clear reminders on at-time disable:', error)
    );
  }
};
```

**Acceptance Criteria:**
- [ ] Setting at-time to Off atomically sets reminder to Off
- [ ] Clears scheduled reminders (fire-and-forget)
- [ ] Errors logged but don't block UI
- [ ] Interval value is left unchanged (not reset)

---

**Task 2.6: Update _rescheduleAllNotifications**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Include reminder scheduling in full reschedule flow
- **Complexity:** Medium
- **Dependencies:** Task 2.4

```typescript
/**
 * Schedule all reminders for a schedule (internal)
 */
const _addAllScheduleRemindersForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('REMINDER: Scheduling all reminders for schedule:', { scheduleType });

  const { english: prayers, arabic: arabicPrayers } = getPrayerArrays(scheduleType);

  const promises = prayers.map(async (_, index) => {
    const reminderType = getReminderAlertType(scheduleType, index);
    if (reminderType === AlertType.Off) return;

    return _addMultipleScheduleRemindersForPrayer(
      scheduleType,
      index,
      prayers[index],
      arabicPrayers[index],
      reminderType
    );
  });

  await Promise.all(promises);
  logger.info('REMINDER: Scheduled all reminders for schedule:', { scheduleType });
};

/**
 * Reschedules all notifications (at-time + reminders) for both schedules
 */
const _rescheduleAllNotifications = async () => {
  // Cancel ALL scheduled notifications globally
  await Notifications.cancelAllScheduledNotificationsAsync();
  logger.info('NOTIFICATION: Cancelled all scheduled notifications via Expo API');

  // Clear database records for both schedules (at-time + reminders)
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Extra);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Extra);
  logger.info('NOTIFICATION: Cleared all database records');

  // Schedule all enabled notifications + reminders in parallel
  await Promise.all([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
    _addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    _addAllScheduleRemindersForSchedule(ScheduleType.Standard),
    _addAllScheduleRemindersForSchedule(ScheduleType.Extra),
  ]);

  logger.info('NOTIFICATION: Rescheduled all notifications and reminders');
};
```

**Acceptance Criteria:**
- [ ] _addAllScheduleRemindersForSchedule function added
- [ ] _rescheduleAllNotifications clears reminder database records
- [ ] Schedules reminders in parallel with at-time notifications
- [ ] All 4 operations (2 schedules × 2 types) run in parallel

---

### Phase 3: UI Components

**Task 3.0: Add Commit Function to hooks/useNotification.ts**

- **File:** `hooks/useNotification.ts`
- **Change Type:** Modified
- **Description:** Add commitAlertMenuChanges for deferred scheduling on menu close
- **Complexity:** Medium
- **Dependencies:** Tasks 1.2, 2.4

```typescript
import { AlertType, ScheduleType, AlertMenuState } from '@/shared/types';

/**
 * Commits all alert menu changes on menu close
 *
 * DEFERRED COMMIT PATTERN:
 * - Called ONLY when menu closes
 * - Compares current state vs original snapshot
 * - Only schedules notifications if something actually changed
 * - Handles all three settings (at-time, reminder, interval) in one commit
 *
 * @param scheduleType Standard or Extra
 * @param prayerIndex Prayer index (0-based)
 * @param englishName Prayer name in English
 * @param arabicName Prayer name in Arabic
 * @param original Original state snapshot from menu open
 * @param current Current state at menu close
 * @returns true if commit succeeded (or no changes), false on error
 */
const commitAlertMenuChanges = useCallback(
  async (
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string,
    original: AlertMenuState,
    current: AlertMenuState
  ): Promise<boolean> => {
    // Check if anything changed
    const atTimeChanged = original.atTimeType !== current.atTimeType;
    const reminderChanged = original.reminderType !== current.reminderType;
    const intervalChanged = original.interval !== current.interval;

    // Nothing changed - skip all scheduling
    if (!atTimeChanged && !reminderChanged && !intervalChanged) {
      logger.info('AlertMenu: No changes detected, skipping commit');
      return true;
    }

    logger.info('AlertMenu: Committing changes', {
      scheduleType,
      prayerIndex,
      atTimeChanged,
      reminderChanged,
      intervalChanged,
    });

    try {
      // Check permissions if enabling anything
      if (
        (atTimeChanged && current.atTimeType !== AlertType.Off) ||
        (reminderChanged && current.reminderType !== AlertType.Off)
      ) {
        const hasPermission = await ensurePermissions();
        if (!hasPermission) {
          return false;
        }
      }

      // 1. Commit at-time change (this also handles reminder constraint)
      if (atTimeChanged) {
        // setPrayerAlertType handles the constraint:
        // when at-time = Off, it auto-disables reminder
        await handleAlertChange(
          scheduleType,
          prayerIndex,
          englishName,
          arabicName,
          current.atTimeType
        );
      }

      // 2. Commit reminder change (only if at-time is not Off)
      // Track if we need to schedule reminders (avoid double scheduling)
      let needsReminderScheduling = false;

      if (reminderChanged && current.atTimeType !== AlertType.Off) {
        setReminderAlertType(scheduleType, prayerIndex, current.reminderType);

        if (current.reminderType === AlertType.Off) {
          await clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
        } else {
          needsReminderScheduling = true;
        }
      }

      // 3. Commit interval change (only if reminder is enabled)
      if (intervalChanged && current.reminderType !== AlertType.Off) {
        setReminderInterval(scheduleType, prayerIndex, current.interval);
        needsReminderScheduling = true;
      }

      // 4. Schedule reminders ONCE if needed (prevents double scheduling)
      if (needsReminderScheduling) {
        await addMultipleScheduleRemindersForPrayer(
          scheduleType,
          prayerIndex,
          englishName,
          arabicName,
          current.reminderType
        );
      }

      return true;
    } catch (error) {
      logger.error('AlertMenu: Failed to commit changes:', error);
      return false;
    }
  },
  [handleAlertChange, ensurePermissions]
);

// Add to return object:
return {
  handleAlertChange,
  commitAlertMenuChanges,  // NEW - for deferred commit
  ensurePermissions,
};
```

**Acceptance Criteria:**
- [ ] commitAlertMenuChanges added to useNotification hook
- [ ] Compares original vs current state before committing
- [ ] Skips all scheduling if nothing changed (returns true)
- [ ] Handles all three settings in correct order (at-time → reminder → interval)
- [ ] Respects constraints (reminder requires at-time enabled)
- [ ] Permission check only if enabling notifications
- [ ] Error handling with logger.error
- [ ] Returns boolean for success/failure

---

**Task 3.1: Create AlertMenu.tsx**

- **File:** `components/AlertMenu.tsx`
- **Change Type:** **New**
- **Description:** Popup menu content with deferred commit pattern
- **Complexity:** Large
- **Dependencies:** Tasks 1.2, 2.4, 3.0

```typescript
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import ChevronRightIcon from '@/assets/icons/svg/chevron-right.svg';
import { COLORS, TEXT, SPACING, RADIUS, REMINDER_INTERVALS } from '@/shared/constants';
import logger from '@/shared/logger';
import { AlertType, ScheduleType, AlertMenuState } from '@/shared/types'; // Import consolidated type
import {
  getPrayerAlertType,
  getReminderAlertType,
  getReminderInterval,
} from '@/stores/notifications';
import { showSheet } from '@/stores/ui';

interface AlertMenuProps {
  scheduleType: ScheduleType;
  prayerIndex: number;
  englishName: string;
  arabicName: string;
  onClose: () => void;
}

/** Ref handle for parent component to access state */
export interface AlertMenuHandle {
  getCurrentState: () => AlertMenuState;
  getOriginalState: () => AlertMenuState | null;
}

const ALERT_OPTIONS = [
  { type: AlertType.Off, label: 'Off' },
  { type: AlertType.Silent, label: 'Silent' },
  { type: AlertType.Sound, label: 'Sound' },
];

/**
 * Alert menu popup content
 *
 * DEFERRED COMMIT PATTERN:
 * - On mount: Snapshot current values into originalState ref
 * - On tap: Update LOCAL state only (UI reflects change immediately)
 * - On close: Parent (Alert.tsx) calls ref methods to get state for commit
 * - If nothing changed: Zero notification impact
 *
 * Renders three sections:
 * 1. At prayer time (Off/Silent/Sound)
 * 2. Reminder (hidden when at-time = Off)
 * 3. Remind me interval (hidden when reminder = Off)
 *
 * NEW PATTERN: Uses forwardRef + useImperativeHandle to expose state to parent.
 * This is the first usage of this pattern in the codebase - chosen because:
 * 1. Enables parent to read child state without lifting state up
 * 2. Clean separation: child owns UI state, parent owns commit logic
 * 3. No Jotai atoms needed for temporary menu state
 *
 * Uses Haptics.ImpactFeedbackStyle.Light for option taps.
 */
const AlertMenu = forwardRef<AlertMenuHandle, AlertMenuProps>(function AlertMenu(
  { scheduleType, prayerIndex, englishName, arabicName, onClose },
  ref
) {
  // Original state snapshot (captured on mount, never changes)
  const originalStateRef = useRef<AlertMenuState | null>(null);

  // Current local state (updates on each tap, NOT committed until close)
  const [atTimeType, setAtTimeType] = useState<AlertType>(AlertType.Off);
  const [reminderType, setReminderType] = useState<AlertType>(AlertType.Off);
  const [interval, setInterval] = useState<number>(15);

  // Load current values on mount and snapshot original state
  useEffect(() => {
    const currentAtTime = getPrayerAlertType(scheduleType, prayerIndex);
    const currentReminder = getReminderAlertType(scheduleType, prayerIndex);
    const currentInterval = getReminderInterval(scheduleType, prayerIndex);

    // Set local state
    setAtTimeType(currentAtTime);
    setReminderType(currentReminder);
    setInterval(currentInterval);

    // Snapshot original state (only once on mount)
    if (originalStateRef.current === null) {
      originalStateRef.current = {
        atTimeType: currentAtTime,
        reminderType: currentReminder,
        interval: currentInterval,
      };
      logger.info('AlertMenu: Captured original state', originalStateRef.current);
    }
  }, [scheduleType, prayerIndex]);

  // Expose state getters to parent via useImperativeHandle (React-idiomatic pattern)
  useImperativeHandle(
    ref,
    () => ({
      getCurrentState: () => ({ atTimeType, reminderType, interval }),
      getOriginalState: () => originalStateRef.current,
    }),
    [atTimeType, reminderType, interval]
  );

  // Handle at-time option tap - LOCAL STATE ONLY
  const handleAtTimePress = useCallback((alertType: AlertType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Update local state (UI reflects immediately)
    setAtTimeType(alertType);

    // Constraint: disable reminder when at-time is Off
    if (alertType === AlertType.Off) {
      setReminderType(AlertType.Off);
    }

    // NO scheduling here - deferred until menu close
  }, []);

  // Handle Sound chevron tap - open BottomSheetSound
  // This is a special case: close menu first, then open sheet
  const handleSoundChevronPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    // Wait for menu close animation before opening sheet
    setTimeout(() => showSheet(), 150);
  }, [onClose]);

  // Handle reminder option tap - LOCAL STATE ONLY
  const handleReminderPress = useCallback((alertType: AlertType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderType(alertType);
    // NO scheduling here - deferred until menu close
  }, []);

  // Handle interval chip tap - LOCAL STATE ONLY
  const handleIntervalPress = useCallback((newInterval: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterval(newInterval);
    // NO scheduling here - deferred until menu close
  }, []);

  return (
    <View style={styles.container}>
      {/* Section: At prayer time */}
      <Text style={styles.sectionLabel}>At prayer time</Text>
      <View style={styles.optionsContainer}>
        {ALERT_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={[styles.option, atTimeType === option.type && styles.optionSelected]}
            onPress={() => handleAtTimePress(option.type)}
          >
            <Text style={[styles.optionText, atTimeType === option.type && styles.optionTextSelected]}>
              {option.label}
            </Text>
            {option.type === AlertType.Sound && atTimeType === AlertType.Sound && (
              <Pressable onPress={handleSoundChevronPress} hitSlop={8}>
                <ChevronRightIcon width={16} height={16} style={{ color: COLORS.text.primary }} />
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>

      {/* Section: Reminder (hidden when at-time = Off) */}
      {atTimeType !== AlertType.Off && (
        <>
          <Text style={styles.sectionLabel}>Reminder</Text>
          <View style={styles.optionsContainer}>
            {ALERT_OPTIONS.map((option) => (
              <Pressable
                key={option.type}
                style={[styles.option, reminderType === option.type && styles.optionSelected]}
                onPress={() => handleReminderPress(option.type)}
              >
                <Text style={[styles.optionText, reminderType === option.type && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Section: Remind me (hidden when reminder = Off) */}
      {atTimeType !== AlertType.Off && reminderType !== AlertType.Off && (
        <>
          <Text style={styles.sectionLabel}>Remind me</Text>
          <View style={styles.chipsContainer}>
            {REMINDER_INTERVALS.map((mins) => (
              <Pressable
                key={mins}
                style={[styles.chip, interval === mins && styles.chipSelected]}
                onPress={() => handleIntervalPress(mins)}
              >
                <Text style={[styles.chipText, interval === mins && styles.chipTextSelected]}>
                  {mins} min
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
});

export default AlertMenu;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface.elevatedBorder,
    padding: SPACING.lg,
    minWidth: 180,
  },
  sectionLabel: {
    color: COLORS.text.secondary,
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  optionsContainer: {
    gap: SPACING.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  optionSelected: {
    backgroundColor: COLORS.interactive.active,
  },
  optionText: {
    color: COLORS.text.primary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  optionTextSelected: {
    fontFamily: TEXT.family.medium,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.rounded,
    backgroundColor: COLORS.interactive.inactive,
    borderWidth: 1,
    borderColor: COLORS.interactive.inactiveBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.interactive.active,
    borderColor: COLORS.interactive.activeBorder,
  },
  chipText: {
    color: COLORS.text.primary,
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
  },
  chipTextSelected: {
    fontFamily: TEXT.family.medium,
  },
});
```

**Acceptance Criteria:**
- [ ] Three sections render correctly
- [ ] Sections show/hide based on LOCAL state (at-time Off hides reminder, reminder Off hides interval)
- [ ] **NO immediate notification scheduling** - local state only
- [ ] Original state captured on mount via useRef
- [ ] Sound chevron transitions to BottomSheetSound (closes menu, waits 150ms, opens sheet)
- [ ] Haptic feedback: ImpactFeedbackStyle.Light for options, Medium for chevron
- [ ] **Uses forwardRef + useImperativeHandle** (React-idiomatic pattern)
- [ ] Exposes `AlertMenuHandle` interface with getCurrentState() and getOriginalState()
- [ ] Uses constants from shared/constants.ts

---

**Task 3.2: Create AlertMenuArrow.tsx**

- **File:** `components/AlertMenuArrow.tsx`
- **Change Type:** **New**
- **Description:** SVG arrow pointing right toward alert icon
- **Complexity:** Small

```typescript
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS, SPACING } from '@/shared/constants';

/**
 * Arrow pointing right, used to connect AlertMenu to the alert icon
 * Follows PrayerExplanation.tsx arrow pattern with right-pointing direction
 */
export default function AlertMenuArrow() {
  return (
    <View style={styles.container}>
      <Svg width={12} height={30} viewBox="0 0 12 30">
        {/* Fill first */}
        <Path d="M0 0 L8.5 12 Q11 15 8.5 18 L0 30 Z" fill={COLORS.surface.elevated} />
        {/* Border stroke - only top and bottom edges, not left */}
        <Path
          d="M0 0 L8.5 12 Q11 15 8.5 18 L0 30"
          fill="none"
          stroke={COLORS.surface.elevatedBorder}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: SPACING.overlap, // Negative margin to overlap with menu border
  },
});
```

**Acceptance Criteria:**
- [ ] SVG arrow points right (toward alert icon)
- [ ] Fill matches COLORS.surface.elevated
- [ ] Border matches COLORS.surface.elevatedBorder
- [ ] Uses SPACING.overlap for seamless connection to menu

---

**Task 3.3: Modify Alert.tsx**

- **File:** `components/Alert.tsx`
- **Change Type:** Modified
- **Description:** Add Modal with menu, remove cycling popup, implement deferred commit on close
- **Complexity:** Medium
- **Dependencies:** Tasks 3.0, 3.1, 3.2

```typescript
// MODIFY existing imports
// Change: import { useState, useEffect, useCallback, useMemo } from 'react';
// To: import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Pressable, Dimensions } from 'react-native'; // ADD Modal, Pressable, Dimensions
import { useAtomValue } from 'jotai'; // Already imported, keep as-is

import AlertMenu, { AlertMenuHandle } from '@/components/AlertMenu';
import AlertMenuArrow from '@/components/AlertMenuArrow';
import { useNotification } from '@/hooks/useNotification';
import { measurementsListAtom } from '@/stores/ui';
import { getCountdownAtom } from '@/stores/countdown'; // Correct import for countdown
import {
  getPrayerAlertType,
  getReminderAlertType,
  getReminderInterval,
} from '@/stores/notifications';
import { AlertMenuState } from '@/shared/types'; // Consolidated type location
import { STYLES, SPACING } from '@/shared/constants';
import logger from '@/shared/logger';

// REMOVE imports
// import { useAlertPopupState } from '@/hooks/useAlertPopupState';

// ADD constants
const MENU_HEIGHT = 280; // Approximate max height
const MENU_WIDTH = 200;
const AUTO_CLOSE_THRESHOLD = 2; // Close menu when countdown <= 2 seconds

export default function Alert({ type, index, isOverlay = false }: Props) {
  // ... existing state ...

  // ADD: Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const listMeasurements = useAtomValue(measurementsListAtom);

  // Get the correct countdown atom for this schedule type (Standard or Extra)
  const countdownAtom = useMemo(() => getCountdownAtom(type), [type]);
  const countdown = useAtomValue(countdownAtom); // For auto-close on timer

  const { commitAlertMenuChanges } = useNotification();

  // ADD: Ref for deferred commit pattern (uses AlertMenuHandle from AlertMenu.tsx)
  const alertMenuRef = useRef<AlertMenuHandle>(null);
  const originalStateRef = useRef<AlertMenuState | null>(null);
  const wasDimRef = useRef<boolean>(false); // Track if alert was dim when menu opened
  const commitInProgressRef = useRef<boolean>(false); // Prevent opening during async commit
  const autoCloseTriggeredRef = useRef<boolean>(false); // Prevent double auto-close

  // REMOVE: useAlertPopupState hook usage
  // const { isPopupActive, showPopup, clearTimeouts } = useAlertPopupState({...});

  // ADD: Calculate menu position
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

  const rowY = listMeasurements.pageY + (index * STYLES.prayer.height);

  const menuTop = Math.max(
    SPACING.xl,
    Math.min(
      rowY + (STYLES.prayer.height / 2) - (MENU_HEIGHT / 2),
      screenHeight - MENU_HEIGHT - SPACING.xl
    )
  );

  const menuRight = screenWidth - listMeasurements.pageX - listMeasurements.width + SPACING.gap;

  // REPLACE handlePress - toggle menu open/close (no debounce needed)
  const handlePress = useCallback(() => {
    // If menu is open, close it (toggle behavior)
    if (menuOpen) {
      handleCloseMenu();
      return;
    }

    // Guard: don't open if overlay is active
    if (overlay.isOn) return;

    // Guard: don't open if commit is in progress (prevents state race on rapid toggle)
    if (commitInProgressRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      logger.info('Alert menu: commit in progress, skipping open');
      return;
    }

    // Guard: don't open if measurements not ready
    if (listMeasurements.pageY === 0) {
      logger.warn('Alert menu: measurements not ready, skipping');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset auto-close flag when opening new menu session
    autoCloseTriggeredRef.current = false;

    // Track if alert is dim (not next prayer) - will need to restore on close
    wasDimRef.current = !Prayer.isNext;

    // Light up dim alert when opening menu
    if (!Prayer.isNext) {
      AnimFill.animate(1); // Bright
      logger.info('Alert: Lighting up dim alert for menu');
    }

    // Capture original state BEFORE opening menu
    originalStateRef.current = {
      atTimeType: getPrayerAlertType(type, index),
      reminderType: getReminderAlertType(type, index),
      interval: getReminderInterval(type, index),
    };
    logger.info('Alert: Captured original state on open', originalStateRef.current);

    setMenuOpen(true);
  }, [menuOpen, overlay.isOn, listMeasurements.pageY, type, index, Prayer.isNext, AnimFill]);

  // ADD: Close handler with DEFERRED COMMIT
  const handleCloseMenu = useCallback(async () => {
    // Prevent double close (from auto-close + manual close race)
    if (commitInProgressRef.current) {
      logger.info('Alert: Commit already in progress, skipping duplicate close');
      return;
    }

    setMenuOpen(false);
    commitInProgressRef.current = true; // Mark commit started

    // Return dim alert to dim state (if it was dim when menu opened)
    if (wasDimRef.current) {
      AnimFill.animate(0); // Dim
      logger.info('Alert: Returning alert to dim state');
    }
    wasDimRef.current = false;

    // Guard: Check refs are available (defensive null check)
    if (!alertMenuRef.current) {
      logger.warn('Alert: alertMenuRef not available, skipping commit');
      commitInProgressRef.current = false;
      return;
    }

    if (!originalStateRef.current) {
      logger.warn('Alert: originalStateRef not available, skipping commit');
      commitInProgressRef.current = false;
      return;
    }

    // Get current state from AlertMenu component via ref
    const currentState = alertMenuRef.current.getCurrentState();
    const originalState = originalStateRef.current;

    try {
      // Commit changes (only schedules if something changed)
      const success = await commitAlertMenuChanges(
        type,
        index,
        Prayer.english,
        Prayer.arabic,
        originalState,
        currentState
      );

      if (!success) {
        logger.warn('Alert: Commit failed, state may be inconsistent');
      }
    } finally {
      // Always clear commit flag and refs
      commitInProgressRef.current = false;
      originalStateRef.current = null;
    }
  }, [type, index, Prayer.english, Prayer.arabic, commitAlertMenuChanges, AnimFill]);

  // ADD: Auto-close when countdown <= 2 seconds (same behavior as Overlay.tsx)
  useEffect(() => {
    // Guard: prevent double auto-close trigger
    if (autoCloseTriggeredRef.current) return;

    if (menuOpen && countdown.timeLeft <= AUTO_CLOSE_THRESHOLD && countdown.timeLeft > 0) {
      autoCloseTriggeredRef.current = true; // Mark auto-close triggered
      logger.info('Alert: Auto-closing menu due to countdown <= 2 seconds');
      handleCloseMenu(); // This triggers commit
    }
  }, [menuOpen, countdown.timeLeft, handleCloseMenu]);

  // KEEP: All animation effects (AnimFill, AnimScale, etc.)
  // ...

  // MODIFY: Remove popup-related effects
  // REMOVE: useEffect that uses isPopupActive
  // REMOVE: useEffect that clears timeouts on overlay change

  return (
    <View style={styles.container}>
      {/* KEEP: Icon pressable with animations */}
      <Pressable
        onPress={handlePress}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}
        style={styles.iconContainer}
      >
        <Animated.View style={AnimScale.style}>
          <Svg viewBox="0 0 256 256" width={SIZE.icon.md} height={SIZE.icon.md}>
            <AnimatedPath d={ALERT_ICONS[ALERT_CONFIGS[iconIndex].icon]} animatedProps={AnimFill.animatedProps} />
          </Svg>
        </Animated.View>
      </Pressable>

      {/* REMOVE: Old popup JSX */}
      {/* <Animated.View style={[styles.popup, ...]}>...</Animated.View> */}

      {/* ADD: Modal with AlertMenu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseMenu}>
          <View
            style={[
              styles.menuContainer,
              { top: menuTop, right: menuRight }
            ]}
            // Prevent tap propagation to backdrop
            onStartShouldSetResponder={() => true}
          >
            <AlertMenu
              ref={alertMenuRef}
              scheduleType={type}
              prayerIndex={index}
              englishName={Prayer.english}
              arabicName={Prayer.arabic}
              onClose={handleCloseMenu}
            />
            <AlertMenuArrow />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ADD to styles
const styles = StyleSheet.create({
  // ... existing styles ...

  menuContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },

  // REMOVE: popup style (no longer needed)
});
```

**Acceptance Criteria:**
- [ ] Modal opens on press (toggle behavior - no debounce)
- [ ] Tap outside Modal OR tap alert icon again → closes menu
- [ ] **DEFERRED COMMIT:** On close, calls commitAlertMenuChanges with original vs current state
- [ ] Original state captured on menu OPEN (before user interacts)
- [ ] **Null checks:** alertMenuRef and originalStateRef validated before commit
- [ ] **Logs warnings** on null refs or commit failure
- [ ] Uses `AlertMenuHandle` ref type from AlertMenu.tsx
- [ ] Menu positioned using formula: `rowY = listMeasurements.pageY + (index * STYLES.prayer.height)`
- [ ] Screen bounds clamping with Math.max/min
- [ ] Overlay guard: don't open if `overlay.isOn`
- [ ] Stale measurements guard: don't open if `listMeasurements.pageY === 0`
- [ ] Animation logic preserved (AnimScale, AnimFill)
- [ ] Haptic feedback: ImpactFeedbackStyle.Medium on press
- [ ] Old popup JSX removed
- [ ] useAlertPopupState import removed
- [ ] No debounce logic (toggle pattern handles spam clicks)
- [ ] **AUTO-CLOSE (v9):** Menu auto-closes when countdown ≤ 2 seconds (triggers commit)
- [ ] **DIM ALERT FEEDBACK (v9):** Dim alerts light up when menu opens, return to dim on close
- [ ] **wasDimRef** tracks whether alert was dim when menu opened
- [ ] **countdownAtom** monitored for auto-close trigger
- [ ] **commitInProgressRef** prevents opening during async commit (rapid toggle guard)
- [ ] **autoCloseTriggeredRef** prevents double auto-close trigger

---

**Task 3.4: Delete useAlertPopupState.ts**

- **File:** `hooks/useAlertPopupState.ts`
- **Change Type:** **Delete**
- **Description:** No longer needed
- **Complexity:** Small

**Pre-deletion verification:**
```bash
grep -r "useAlertPopupState" --include="*.ts" --include="*.tsx"
# Should only show: components/Alert.tsx (which we're modifying)
```

**Acceptance Criteria:**
- [ ] Verify only Alert.tsx imports this hook
- [ ] Delete the file
- [ ] Verify yarn validate passes

---

### Phase 4: Integration & Testing

**Task 4.1: Verify reminders.wav exists**

- **Action:** Verify audio file exists
- **Complexity:** Small

```bash
ls -la assets/audio/reminders.wav
# Should exist and have reasonable file size
```

**Acceptance Criteria:**
- [ ] reminders.wav exists in assets/audio
- [ ] File is valid audio file

---

**Task 4.2: Add Comprehensive Unit Tests**

- **Files:** `stores/__tests__/notifications.test.ts`, `shared/__tests__/notifications.test.ts`
- **Change Type:** Modified/New
- **Description:** Add ~40 test cases for reminder functionality
- **Complexity:** Large

```typescript
// stores/__tests__/notifications.test.ts

describe('Reminder Atoms', () => {
  describe('createReminderAlertAtom', () => {
    it('creates atom with default value AlertType.Off');
    it('creates unique atoms for each prayer');
    it('uses correct storage key format: preference_reminder_{type}_{index}');
  });

  describe('createReminderIntervalAtom', () => {
    it('creates atom with default value 15');
    it('uses correct storage key format: preference_reminder_interval_{type}_{index}');
  });

  describe('getReminderAlertAtom', () => {
    it('returns correct atom for standard prayers');
    it('returns correct atom for extra prayers');
    it('throws Error for invalid prayer index (negative)');
    it('throws Error for invalid prayer index (out of bounds)');
  });

  describe('getReminderAlertType', () => {
    it('returns AlertType.Off for unset prayers');
    it('returns stored value for set prayers');
  });

  describe('setReminderAlertType', () => {
    it('updates reminder alert atom');
    it('persists value to storage');
  });

  describe('getReminderInterval', () => {
    it('returns 15 for unset prayers');
    it('returns stored value for set prayers');
    it('validates and falls back to 15 for invalid stored values');
  });

  describe('setReminderInterval', () => {
    it('updates reminder interval atom');
    it('validates interval before storing');
    it('falls back to 15 for invalid interval');
  });
});

describe('Constraint Enforcement', () => {
  describe('setPrayerAlertType', () => {
    it('disables reminder when at-time set to Off');
    it('clears scheduled reminders when at-time set to Off');
    it('does not affect reminder when at-time set to Silent');
    it('does not affect reminder when at-time set to Sound');
    it('does not reset interval when at-time set to Off');
  });
});

describe('Reminder Scheduling', () => {
  describe('scheduleReminderNotificationForDate', () => {
    it('skips when prayer data not found');
    it('skips when trigger time is in past');
    it('skips when trigger time is within 30-second buffer');
    it('schedules when trigger time is in future');
    it('skips Istijaba on non-Friday');
    it('schedules Istijaba on Friday');
    it('calculates correct trigger time (prayer time - interval)');
    it('stores notification in database');
    it('logs error and continues on scheduling failure');
  });

  describe('addMultipleScheduleRemindersForPrayer', () => {
    it('clears existing reminders before scheduling');
    it('skips scheduling when reminder type is Off');
    it('schedules for NOTIFICATION_ROLLING_DAYS days');
    it('uses withSchedulingLock');
    it('skips when already scheduling (lock held)');
  });

  describe('clearAllScheduledRemindersForPrayer', () => {
    it('cancels all device notifications');
    it('clears database records');
  });
});

describe('Reschedule All', () => {
  describe('_addAllScheduleRemindersForSchedule', () => {
    it('schedules reminders for all prayers with enabled reminders');
    it('skips prayers with reminder type Off');
  });

  describe('_rescheduleAllNotifications', () => {
    it('clears reminder database records for both schedules');
    it('schedules reminders in parallel with at-time notifications');
  });
});

// File: components/__tests__/AlertMenu.test.tsx
// Mock setup required: expo-haptics, react-native-reanimated, Jotai atoms

describe('AlertMenu Component', () => {
  // Mock setup
  beforeEach(() => {
    jest.mock('expo-haptics');
    jest.mock('@/stores/notifications', () => ({
      getPrayerAlertType: jest.fn(() => AlertType.Off),
      getReminderAlertType: jest.fn(() => AlertType.Off),
      getReminderInterval: jest.fn(() => 15),
    }));
  });

  describe('Rendering', () => {
    it('renders At prayer time section always');
    it('renders Reminder section when atTimeType is not Off');
    it('hides Reminder section when atTimeType is Off');
    it('renders Remind me section when reminder is enabled');
    it('hides Remind me section when reminderType is Off');
  });

  describe('Local State (No Scheduling)', () => {
    it('updates local atTimeType on option tap without scheduling');
    it('updates local reminderType on option tap without scheduling');
    it('updates local interval on chip tap without scheduling');
    it('auto-disables reminderType when atTimeType set to Off (local)');
  });

  describe('Ref Methods (forwardRef + useImperativeHandle)', () => {
    it('exposes getCurrentState() via ref');
    it('exposes getOriginalState() via ref');
    it('getCurrentState() returns current local state');
    it('getOriginalState() returns snapshot from mount');
    it('originalState is captured only once on mount');
  });

  describe('Haptics', () => {
    it('triggers Light haptic on option tap');
    it('triggers Medium haptic on chevron tap');
  });

  describe('Sound Chevron', () => {
    it('calls onClose when chevron tapped');
    it('opens BottomSheetSound after 150ms delay');
  });
});

// File: components/__tests__/Alert.test.tsx
// Mock setup required: react-native Modal, measurementsListAtom, useNotification

describe('Alert Component (Modal)', () => {
  beforeEach(() => {
    jest.mock('@/stores/ui', () => ({
      measurementsListAtom: { pageY: 100, pageX: 50, width: 300 },
    }));
    jest.mock('@/hooks/useNotification', () => ({
      useNotification: () => ({
        commitAlertMenuChanges: jest.fn().mockResolvedValue(true),
      }),
    }));
  });

  describe('Toggle Behavior', () => {
    it('opens menu on first tap');
    it('closes menu on second tap (toggle)');
    it('closes menu on backdrop tap');
    it('handles rapid toggle during commit gracefully');
  });

  describe('Deferred Commit', () => {
    it('captures originalState before opening menu');
    it('calls commitAlertMenuChanges on close');
    it('clears originalStateRef after commit');
    it('handles null alertMenuRef gracefully');
    it('handles null originalStateRef gracefully');
    it('logs warning on commit failure');
  });

  describe('Guards', () => {
    it('does not open when overlay.isOn is true');
    it('does not open when measurements not ready (pageY === 0)');
    it('logs warning when measurements not ready');
  });

  describe('Position Calculation', () => {
    it('calculates menuTop with screen bounds clamping');
    it('clamps to SPACING.xl minimum at top');
    it('clamps to screenHeight - MENU_HEIGHT - SPACING.xl at bottom');
  });

  describe('Auto-Close on Timer (v9)', () => {
    it('auto-closes menu when countdown reaches 2 seconds');
    it('auto-closes menu when countdown reaches 1 second');
    it('does not auto-close when countdown > 2 seconds');
    it('does not auto-close when countdown is 0 (already passed)');
    it('triggers commit when auto-closing');
    it('logs auto-close reason');
  });

  describe('Dim Alert Visual Feedback (v9)', () => {
    it('lights up dim alert (AnimFill.animate(1)) when menu opens');
    it('does not change already-bright alert (isNext) when menu opens');
    it('returns dim alert to dim state (AnimFill.animate(0)) on close');
    it('wasDimRef tracks whether alert was dim on open');
    it('wasDimRef is reset to false after close');
  });

  describe('Race Condition Guards (v11)', () => {
    it('commitInProgressRef blocks open when commit is in progress');
    it('commitInProgressRef triggers warning haptic when blocking open');
    it('commitInProgressRef is set to true at start of handleCloseMenu');
    it('commitInProgressRef is cleared in finally block even on error');
    it('autoCloseTriggeredRef prevents double auto-close trigger');
    it('autoCloseTriggeredRef is reset to false when menu opens');
    it('rapid toggle (open-close-open) is handled gracefully');
    it('simultaneous manual close and auto-close only triggers one commit');
  });

  describe('App Force-Close Behavior', () => {
    it('uncommitted changes are lost if app killed while menu open');
    it('Jotai atoms remain unchanged if menu never closed');
  });
});

// hooks/__tests__/useNotification.test.ts

describe('commitAlertMenuChanges (Deferred Commit)', () => {
  describe('No Changes Scenario', () => {
    it('returns true immediately if original === current (no scheduling)');
    it('logs "No changes detected" message');
    it('does not call any scheduling functions');
  });

  describe('At-Time Changed', () => {
    it('commits at-time change when atTimeType differs');
    it('calls handleAlertChange for at-time updates');
    it('checks permissions if enabling (not Off)');
    it('skips permission check if disabling (Off)');
  });

  describe('Reminder Changed', () => {
    it('commits reminder change when reminderType differs');
    it('clears reminders when reminderType -> Off');
    it('schedules reminders when reminderType -> Silent/Sound');
    it('skips reminder commit if at-time is Off (constraint)');
  });

  describe('Interval Changed', () => {
    it('commits interval change when interval differs');
    it('reschedules reminders with new interval');
    it('skips interval commit if reminder is Off');
  });

  describe('Multiple Changes', () => {
    it('commits all changes in correct order: at-time -> reminder -> interval');
    it('handles at-time Off + reminder change (reminder skipped due to constraint)');
    it('handles all three changed simultaneously');
  });

  describe('Error Handling', () => {
    it('returns false on permission denial');
    it('returns false on scheduling error');
    it('logs error with details');
  });

  describe('State Comparison', () => {
    it('detects atTimeType change (Off -> Sound)');
    it('detects reminderType change (Off -> Silent)');
    it('detects interval change (15 -> 30)');
    it('detects no change when all values equal');
    it('handles change-then-revert (back to original = no change)');
  });
});

// shared/__tests__/notifications.test.ts

describe('genReminderNotificationContent', () => {
  it('creates content with "{Prayer} in {X} min" title format');
  it('includes Arabic name in body with LTR mark');
  it('uses reminders.wav for Sound alert type');
  it('returns false for sound on Silent alert type');
  it('returns false for sound on Off alert type');
  it('sets correct priority and interruptionLevel');
});

describe('createReminderAndroidChannel', () => {
  it('creates channel with ID "reminder"');
  it('sets correct sound file');
  it('returns early on iOS');
});

// shared/__tests__/constants.test.ts

describe('validateReminderInterval', () => {
  it('returns value for valid intervals (5, 10, 15, 20, 25, 30)');
  it('returns DEFAULT_REMINDER_INTERVAL for invalid number');
  it('returns DEFAULT_REMINDER_INTERVAL for non-number');
  it('returns DEFAULT_REMINDER_INTERVAL for undefined');
  it('returns DEFAULT_REMINDER_INTERVAL for null');
});
```

**Edge Case Tests:**
```typescript
describe('Edge Cases', () => {
  describe('Midnight Crossing', () => {
    it('schedules reminder at 23:55 for prayer at 00:10 next day');
    it('handles Isha after midnight correctly');
    it('handles year boundary (Dec 31 -> Jan 1)');
  });

  describe('Interval vs Prayer Time', () => {
    it('skips reminder when prayer is 3 mins away with 5-min interval');
    it('schedules reminder when prayer is exactly 5 mins away with 5-min interval');
    it('handles 30-second buffer edge (31 seconds = schedule, 29 seconds = skip)');
  });

  describe('Istijaba Reminders', () => {
    it('schedules on Friday');
    it('skips Saturday');
    it('skips Sunday through Thursday');
  });

  describe('DST Transitions (UK Clock Changes)', () => {
    it('schedules reminder correctly when clocks spring forward (March)');
    it('schedules reminder correctly when clocks fall back (October)');
    it('handles prayer at 01:30 during spring forward (time skips to 02:00)');
    it('handles duplicate times during fall back');
  });

  describe('Permission Edge Cases', () => {
    it('handles permission revocation mid-session gracefully');
    it('prompts for permission if revoked during menu interaction');
  });

  describe('Short Prayer Intervals', () => {
    it('handles 30-min reminder when prayers are 20 mins apart');
    it('skips reminder that would fire after prayer time');
  });
});
```

**Database Tests:**
```typescript
// stores/__tests__/database.test.ts

describe('Reminder Record Management', () => {
  describe('addOneScheduledReminderForPrayer', () => {
    it('stores reminder with correct key format');
    it('stores reminders separately from at-time notifications');
  });

  describe('getAllScheduledRemindersForPrayer', () => {
    it('returns only reminders for specified prayer');
    it('returns empty array when no reminders');
  });

  describe('clearAllScheduledRemindersForPrayer', () => {
    it('clears only reminders for specified prayer');
    it('does not affect at-time notifications');
    it('does not affect reminders for other prayers');
  });

  describe('clearAllScheduledRemindersForSchedule', () => {
    it('clears all reminders for schedule');
    it('does not affect other schedule');
  });

  describe('cleanup', () => {
    it('includes scheduled_reminders_ prefix');
    it('includes preference_reminder_ prefix');
    it('includes preference_reminder_interval_ prefix');
  });
});
```

**Acceptance Criteria:**
- [ ] ~40 unit test cases added
- [ ] All reminder atom functions tested
- [ ] Constraint enforcement tested
- [ ] Edge cases tested (Istijaba, midnight crossing, past times)
- [ ] Database functions tested
- [ ] Content generator tested
- [ ] Validation helper tested

---

**Task 4.3: Add Integration Tests**

- **File:** `__tests__/integration/alertMenu.test.ts`
- **Change Type:** **New**
- **Description:** End-to-end flow tests with deferred commit pattern
- **Complexity:** Medium

```typescript
describe('Alert Menu Integration', () => {
  describe('Deferred Commit Pattern', () => {
    it('open menu, make no changes, close -> zero notifications scheduled');
    it('open menu, change at-time, close -> notifications scheduled on close only');
    it('open menu, change multiple options, close -> single commit on close');
    it('open menu, change value, change back to original, close -> no changes committed');
  });

  describe('Full User Flow', () => {
    it('tap at-time Sound -> reminder section visible (local state only)');
    it('tap reminder Sound -> interval section visible (local state only)');
    it('tap interval 30 -> local state updated (not committed yet)');
    it('close menu -> all changes committed, reminders scheduled with 30-min offset');
    it('tap at-time Off -> reminder auto-disabled in local state');
    it('close menu with at-time Off -> reminder cleared on commit');
  });

  describe('Sound Chevron Flow', () => {
    it('tap Sound chevron -> menu closes -> commit happens -> BottomSheetSound opens');
  });

  describe('Toggle Behavior (No Debounce)', () => {
    it('tap alert icon -> opens menu');
    it('tap alert icon again while open -> closes menu (with commit)');
    it('rapid tap-tap-tap -> toggles correctly without debounce');
  });

  describe('State Restoration', () => {
    it('settings persist after menu close (committed to MMKV)');
    it('settings persist after app restart simulation');
    it('reopening menu shows committed values, not stale local state');
  });

  describe('Concurrent Operations', () => {
    it('scheduling lock prevents race conditions during commit');
    it('multiple users tapping different prayers -> independent commits');
  });

  describe('Error Recovery', () => {
    it('commits successful changes when partial scheduling fails (Day 1 ok, Day 2 throws)');
    it('logs error but continues when database write fails');
    it('handles rapid toggle during async commit gracefully');
    it('state remains consistent after commit failure');
  });

  describe('Position Edge Cases', () => {
    it('positions correctly for first prayer (top of screen, clamps to SPACING.xl)');
    it('positions correctly for last prayer (bottom of screen, clamps)');
    it('recalculates position when screen dimensions change');
  });

  describe('Auto-Close Integration (v9)', () => {
    it('countdown reaches 2s while menu open with changes -> commits changes');
    it('countdown reaches 2s while menu open without changes -> no commit');
    it('countdown reaches 0 (passed) does not trigger auto-close');
    it('auto-close restores dim alert to dim state');
  });

  describe('Dim Alert Feedback Integration (v9)', () => {
    it('dim alert lights up -> user makes changes -> close -> commits + returns to dim');
    it('bright alert (next) -> user makes changes -> close -> commits, stays bright');
    it('dim alert lights up -> auto-close on timer -> commits + returns to dim');
  });

  describe('App Force-Close (Deferred Commit Guarantee)', () => {
    it('menu open with changes -> simulate app kill -> Jotai atoms unchanged');
    it('menu open with changes -> simulate app kill -> database unchanged');
    it('menu open with changes -> simulate app kill -> reopen shows original values');
  });
});
```

**Acceptance Criteria:**
- [ ] Integration test file created
- [ ] Deferred commit pattern tested (open/close without changes = no impact)
- [ ] Toggle behavior tested (no debounce)
- [ ] Full user flow tested
- [ ] State restoration tested
- [ ] Concurrent operation handling tested

---

**Task 4.4: Verification - yarn validate**

- TypeScript compilation passes
- ESLint passes
- Prettier passes
- All tests pass (including new ones)

---

**Task 4.5: Expanded Manual Testing Checklist**

**Deferred Commit Pattern (NEW):**
- [ ] Open menu, make NO changes, close → zero notification scheduling (verify logs)
- [ ] Open menu, change at-time to Sound, close → notifications scheduled ON CLOSE
- [ ] Open menu, change multiple options, close → single commit with all changes
- [ ] Open menu, change value, change BACK to original, close → no changes committed
- [ ] Changes reflect immediately in UI while menu open (local state)

**Toggle Behavior (No Debounce):**
- [ ] Tap alert icon → menu opens
- [ ] Tap alert icon again while menu open → menu closes (with commit)
- [ ] Rapid tap-tap-tap → toggles correctly, no spam issues
- [ ] Tap outside menu → closes menu (with commit)

**Auto-Close on Timer (v9):**
- [ ] Open menu, wait for countdown to reach 2 seconds → menu auto-closes
- [ ] Auto-close triggers commit (verify with logs)
- [ ] Changes made before auto-close are committed
- [ ] No changes made + auto-close = zero scheduling impact

**Dim Alert Visual Feedback (v9):**
- [ ] Tap dim alert (not next prayer) → alert lights up when menu opens
- [ ] Tap bright alert (next prayer) → no change in brightness
- [ ] Close menu on dim alert → alert returns to dim state
- [ ] Visual transition is smooth (AnimFill animation)

**App Force-Close Behavior:**
- [ ] Open menu, make changes, force-close app → changes NOT saved
- [ ] Reopen app → original values shown (not the uncommitted changes)
- [ ] State remains consistent after force-close

**Core Functionality:**
- [ ] Tap alert icon → popup appears near icon with arrow
- [ ] Tap outside popup → popup closes (commits changes)
- [ ] At-time Off/Silent/Sound all work (local state updates immediately)
- [ ] Sound chevron opens BottomSheetSound after menu closes (commits first)
- [ ] Reminder section hidden when at-time = Off
- [ ] Interval section hidden when reminder = Off
- [ ] Setting at-time to Off disables reminder (local state constraint)
- [ ] Reminder notifications fire at correct time (after commit)
- [ ] Settings persist across app restart
- [ ] Popup position correct for all prayer rows (top/middle/bottom)

**Platform Tests:**
- [ ] Test on iOS (notifications, sounds)
- [ ] Test on Android (notification channel, reminders.wav)
- [ ] Test with notifications disabled in system settings

**Visual/UX Tests:**
- [ ] Popup clamping at screen top (first prayer)
- [ ] Popup clamping at screen bottom (last prayer)
- [ ] Arrow alignment with alert icon
- [ ] Animation smooth on open/close

**Prayer-Specific Tests:**
- [ ] Test Istijaba reminder on Friday (should schedule)
- [ ] Test Istijaba reminder on Saturday-Thursday (should skip)
- [ ] Test Midnight/Last Third reminders (night prayers)

**Timing Tests:**
- [ ] Test each interval option (5/10/15/20/25/30 min)
- [ ] Verify notification shows correct "X minutes before"
- [ ] Verify reminder sound plays

**State Tests:**
- [ ] Overlay guard (popup doesn't open when overlay active)
- [ ] Haptic feedback on all interactions
- [ ] Stale measurements guard (doesn't open before measurements ready)

**Error Tests:**
- [ ] Behavior when notification permission denied
- [ ] Behavior when scheduling fails (should log, not crash)

**Accessibility Tests:**
- [ ] VoiceOver announces "At prayer time" section and options
- [ ] TalkBack navigates through all selectable options
- [ ] Screen reader announces selected state for radio options
- [ ] Dynamic Type: menu text scales appropriately with system font size
- [ ] Reduced Motion: animations respect user preference (if applicable)
- [ ] Focus trap works within modal (no focus escape)

**Performance Tests:**
- [ ] Menu opens without noticeable delay
- [ ] Commit on close doesn't block UI (verify with slow network simulation)
- [ ] No excessive re-renders during menu interaction (verify with React DevTools)

---

## File Modifications Summary

| File                             | Change Type  | Description                                  |
| -------------------------------- | ------------ | -------------------------------------------- |
| `shared/types.ts`                | Modified     | Add ReminderInterval type                    |
| `shared/constants.ts`            | Modified     | Add REMINDER_INTERVALS, validateReminderInterval |
| `stores/notifications.ts`        | Modified     | Add reminder atoms, scheduling, constraints  |
| `stores/database.ts`             | Modified     | Add reminder database functions, cleanup     |
| `shared/notifications.ts`        | Modified     | Add content generator, channel, init         |
| `device/notifications.ts`        | Modified     | Add device scheduling functions              |
| `hooks/useNotification.ts`       | Modified     | Add handleReminderChange, handleIntervalChange |
| `components/AlertMenu.tsx`       | **New**      | Menu content with 3 sections                 |
| `components/AlertMenuArrow.tsx`  | **New**      | SVG arrow pointing right                     |
| `components/Alert.tsx`           | Modified     | Add Modal, remove cycling popup              |
| `hooks/useAlertPopupState.ts`    | **Delete**   | No longer needed                             |
| `stores/__tests__/notifications.test.ts` | Modified | Add ~40 reminder tests                |
| `shared/__tests__/notifications.test.ts` | Modified | Add content generator tests          |
| `shared/__tests__/constants.test.ts` | Modified | Add validation tests                     |
| `stores/__tests__/database.test.ts` | Modified | Add reminder database tests               |

**NOT modified (simplified architecture):**
- `stores/ui.ts` - No new atoms needed
- `app/_layout.tsx` - No portal needed

---

## Risk Analysis

| Risk                           | Likelihood | Impact | Mitigation                                    |
| ------------------------------ | ---------- | ------ | --------------------------------------------- |
| Menu position off-screen       | Medium     | Medium | Math.max/min clamping with SPACING.xl bounds  |
| Z-index conflicts with Overlay | Low        | Medium | Guard: `if (overlay.isOn) return`             |
| Notification race conditions   | Low        | Low    | withSchedulingLock on commit                  |
| Stale measurements             | Low        | Medium | Guard: `if (listMeasurements.pageY === 0)`    |
| Invalid interval in storage    | Low        | Low    | validateReminderInterval with fallback        |
| Android reminders.wav missing  | Low        | High   | Task 4.1: Verify file exists                  |
| State comparison bug on close  | Low        | Medium | Unit tests for all state comparison scenarios |
| Lost changes on crash          | Low        | Low    | Acceptable: user can re-open and re-select    |

**Risks Eliminated by v6 Changes:**
- ~~Rapid taps cause issues~~ - Toggle pattern handles naturally, no debounce needed
- ~~Notification churn during interaction~~ - Deferred commit, only schedules on close
- ~~Unnecessary rescheduling~~ - State comparison skips if nothing changed

**v9 Risk Considerations:**
| Risk                           | Likelihood | Impact | Mitigation                                    |
| ------------------------------ | ---------- | ------ | --------------------------------------------- |
| Auto-close interrupts user     | Low        | Low    | 2s threshold gives enough warning             |
| Dim animation conflicts        | Low        | Low    | wasDimRef tracks state, AnimFill is atomic    |
| Countdown atom not ready       | Low        | Medium | Guard: only auto-close if timeLeft > 0        |

---

## Success Criteria

- [ ] Alert icon tap opens popup menu (toggle behavior, no debounce)
- [ ] **Deferred commit:** Changes only committed on menu close
- [ ] **No-change optimization:** If user makes no changes, zero scheduling impact
- [ ] **Auto-close on timer (v9):** Menu auto-closes when countdown ≤ 2 seconds
- [ ] **Dim alert feedback (v9):** Dim alerts light up when menu opens, return to dim on close
- [ ] **App force-close (v9):** Uncommitted changes lost if app killed (intentional)
- [ ] At-time Off/Silent/Sound all work correctly
- [ ] Reminder section hidden when at-time = Off
- [ ] Interval section hidden when reminder = Off
- [ ] Reminder notifications fire at correct time before prayer
- [ ] Per-prayer settings are independent
- [ ] Settings persist across app restarts
- [ ] yarn validate passes
- [ ] All ~60 unit tests pass
- [ ] All edge cases handled (Istijaba, midnight, past times, DST)

---

## Specialist Review Scores (Target: 100/100)

| Specialist   | v4 | v5 | v6 | v7 | v8 | Issues Addressed in v9                           |
| ------------ | -- | -- | -- | -- | -- | ------------------------------------------------ |
| ReviewerQA   | 87 | 95 | 97 | 97 | 97 | Auto-close, dim feedback, force-close behavior   |
| Architect    | 80 | 100| 92 | 97 | 97 | Timer integration, AnimFill reuse                |
| Implementer  | 76 | 93 | 82 | 97 | 97 | countdownAtom, wasDimRef, AnimFill callbacks     |
| TestWriter   | 41 | 90 | 83 | 87 | 95 | Auto-close tests, dim feedback tests             |

**v9 Changes (user feedback):**
1. **Auto-close on timer** - Menu auto-closes when countdown ≤ 2 seconds (same as Overlay.tsx)
2. **Dim alert visual feedback** - Dim alerts light up when menu opens, return to dim on close
3. **App force-close confirmation** - Explicitly documented that uncommitted changes are lost
4. **wasDimRef** - Tracks whether alert was dim when menu opened
5. **countdownAtom integration** - Monitor countdown for auto-close trigger
6. **AnimFill reuse** - Use existing animation for dim/bright transitions
7. **New tests** - Auto-close tests, dim feedback tests, force-close integration tests
8. **New manual tests** - Auto-close, dim feedback, force-close verification

**v10 Fixes (specialist feedback):**
1. **Fixed countdownAtom import** - Changed from non-existent `countdownAtom` to `getCountdownAtom(type)` from `stores/countdown.ts`
2. **Added useMemo** - Countdown atom selection memoized based on schedule type
3. **Consolidated AlertMenuState** - Moved interface to single location in `shared/types.ts`
4. **Updated imports** - AlertMenu.tsx imports AlertMenuState from `@/shared/types`
5. **Updated Task 1.1** - Acceptance criteria now includes AlertMenuState interface export

**v11 Fixes (specialist feedback - ReviewerQA 93, Implementer 93):**
1. **commitInProgressRef** - Prevents opening menu during async commit (rapid toggle guard)
2. **autoCloseTriggeredRef** - Prevents double auto-close trigger
3. **Task 3.0** - Removed local AlertMenuState, now imports from `@/shared/types`
4. **Task 3.3** - Clarified useRef merges into existing React imports
5. **handleCloseMenu** - Added try/finally to ensure refs cleared even on error
6. **forwardRef documentation** - Added note that this is a new pattern for codebase

**v12 Final (minor recommendations from specialists - all 96/95+):**
1. **Warning haptic** - Added `Haptics.notificationAsync(Warning)` when commitInProgressRef blocks open
2. **Race condition tests** - Added 8 explicit test cases for commitInProgressRef and autoCloseTriggeredRef
3. **Task 0.4** - Added task to document forwardRef pattern in ai/AGENTS.md

**v12 Target: 95+/100** - All specialist feedback incorporated.
