# Implementation Plan: Alert Menu Bottom Sheet

**Status:** Approved
**Created:** 2026-01-25
**Revised:** 2026-01-25 (v2 - addressed reviewer feedback)
**Specialist:** Architect

---

## Overview

Transform the prayer alert from a cycle-through popup (Off -> Silent -> Sound) to a **menu bottom sheet** with:

1. **At-Time Alert** - Off/Silent/Sound (existing, restructured)
2. **Pre-Prayer Reminder** - Off/Silent/Sound (new, requires at-time enabled)
3. **Reminder Interval** - 5/10/15/20/25/30 minutes (new, visible when reminder enabled)

## Key Constraints (from ADR-001)

- Reminders require at-time notification to be enabled
- Reminder sound is hardcoded `reminders.wav` (not user-selectable)
- Each prayer configured independently (per-prayer settings)
- Max 2 notifications per prayer (at-time + reminder)
- **Notification limit:** 11 prayers x 2 notifications x 2 days = 44 max (under iOS 64 limit)

---

## Phases

### Phase 1: Types & Data Layer

### Phase 2: Notification Infrastructure

### Phase 3: UI Components

### Phase 4: Integration & Testing

---

## Task Breakdown

### Phase 1: Types & Data Layer

**Task 1.1: Add Reminder Types to shared/types.ts**

- **File:** `shared/types.ts`
- **Change Type:** Modified
- **Description:** Add ReminderInterval type and constants
- **Complexity:** Small
- **Code:**

```typescript
// Add after AlertType enum (around line 175)

/**
 * Reminder interval options in minutes
 * Used for pre-prayer reminder notifications
 */
export type ReminderInterval = 5 | 10 | 15 | 20 | 25 | 30;

/** Available reminder intervals */
export const REMINDER_INTERVALS: ReminderInterval[] = [5, 10, 15, 20, 25, 30];

/** Default reminder interval (15 minutes) */
export const DEFAULT_REMINDER_INTERVAL: ReminderInterval = 15;
```

- **Acceptance Criteria:**
  - [ ] ReminderInterval type exported
  - [ ] REMINDER_INTERVALS array exported
  - [ ] DEFAULT_REMINDER_INTERVAL constant exported
  - [ ] JSDoc comments included

---

**Task 1.2: Add Reminder Atoms to stores/notifications.ts**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Add atoms for reminder preferences mirroring existing alert atom pattern
- **Complexity:** Medium
- **Dependencies:** Task 1.1
- **Code:**

```typescript
import { ReminderInterval, DEFAULT_REMINDER_INTERVAL } from '@/shared/types';

// =============================================================================
// REMINDER ATOMS
// =============================================================================

/**
 * Factory function to create a reminder alert atom for persisting notification preferences
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom with MMKV persistence for the reminder alert type
 */
export const createReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const type = scheduleType === ScheduleType.Standard ? 'standard' : 'extra';
  return atomWithStorageNumber(`preference_reminder_${type}_${prayerIndex}`, AlertType.Off);
};

/**
 * Factory function to create a reminder interval atom
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom with MMKV persistence for the reminder interval
 */
export const createReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const type = scheduleType === ScheduleType.Standard ? 'standard' : 'extra';
  return atomWithStorageNumber(`preference_reminder_interval_${type}_${prayerIndex}`, DEFAULT_REMINDER_INTERVAL);
};

/** Array of reminder alert atoms for all standard prayers */
export const standardReminderAlertAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Standard, index)
);

/** Array of reminder alert atoms for all extra prayers */
export const extraReminderAlertAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Extra, index)
);

/** Array of reminder interval atoms for all standard prayers */
export const standardReminderIntervalAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Standard, index)
);

/** Array of reminder interval atoms for all extra prayers */
export const extraReminderIntervalAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Extra, index)
);

// =============================================================================
// REMINDER HELPERS
// =============================================================================

/**
 * Gets the Jotai atom for a specific prayer's reminder alert setting
 */
export const getReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderAlertAtoms : extraReminderAlertAtoms;
  return atoms[prayerIndex];
};

/**
 * Gets the current reminder alert type for a specific prayer
 */
export const getReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number): AlertType => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

/**
 * Sets the reminder alert type for a specific prayer
 */
export const setReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);
};

/**
 * Gets the Jotai atom for a specific prayer's reminder interval setting
 */
export const getReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderIntervalAtoms : extraReminderIntervalAtoms;
  return atoms[prayerIndex];
};

/**
 * Gets the current reminder interval for a specific prayer
 */
export const getReminderInterval = (scheduleType: ScheduleType, prayerIndex: number): number => {
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

/**
 * Sets the reminder interval for a specific prayer
 */
export const setReminderInterval = (scheduleType: ScheduleType, prayerIndex: number, interval: ReminderInterval) => {
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  store.set(atom, interval);
};
```

- **Acceptance Criteria:**
  - [ ] Reminder alert atoms created for all prayers (11 total)
  - [ ] Reminder interval atoms created for all prayers (11 total)
  - [ ] All 6 helper functions implemented (get/set for alert, interval, atom)
  - [ ] Default values: AlertType.Off for alerts, 15 for intervals
  - [ ] JSDoc comments on all exports
  - [ ] Storage keys follow pattern: `preference_reminder_${type}_${index}`

---

**Task 1.3: Add UI State Atoms to stores/ui.ts**

- **File:** `stores/ui.ts`
- **Change Type:** Modified
- **Description:** Add bottom sheet modal ref and context atoms
- **Complexity:** Small
- **Code:**

```typescript
import { ScheduleType } from '@/shared/types';

/** Context for alert menu: which prayer is being configured */
export interface AlertMenuContext {
  scheduleType: ScheduleType;
  prayerIndex: number;
  englishName: string;
  arabicName: string;
}

/** Reference to the alert menu bottom sheet modal */
export const alertMenuSheetModalAtom = atom<BottomSheetModal | null>(null);

/** Context: which prayer is being configured in the alert menu */
export const alertMenuContextAtom = atom<AlertMenuContext | null>(null);

// =============================================================================
// ALERT MENU ACTIONS
// =============================================================================

/** Sets the alert menu bottom sheet modal reference */
export const setAlertMenuSheetModal = (modal: BottomSheetModal | null) => store.set(alertMenuSheetModalAtom, modal);

/** Presents the alert menu bottom sheet */
export const showAlertMenuSheet = () => store.get(alertMenuSheetModalAtom)?.present();

/** Dismisses the alert menu bottom sheet */
export const hideAlertMenuSheet = () => store.get(alertMenuSheetModalAtom)?.dismiss();

/** Sets the context for the alert menu (which prayer is being configured) */
export const setAlertMenuContext = (context: AlertMenuContext | null) => store.set(alertMenuContextAtom, context);

/** Gets the current alert menu context */
export const getAlertMenuContext = () => store.get(alertMenuContextAtom);
```

- **Acceptance Criteria:**
  - [ ] AlertMenuContext interface defined
  - [ ] alertMenuSheetModalAtom added
  - [ ] alertMenuContextAtom added
  - [ ] All 5 actions added (set modal, show, hide, set context, get context)

---

### Phase 2: Notification Infrastructure

**Task 2.1: Add Database Functions to stores/database.ts**

- **File:** `stores/database.ts`
- **Change Type:** Modified
- **Description:** Add functions to track reminder notifications separately
- **Complexity:** Small
- **Code:**

```typescript
// =============================================================================
// REMINDER NOTIFICATION TRACKING
// =============================================================================

/**
 * Adds a scheduled reminder notification to the database
 * Key format: scheduled_reminders_{scheduleType}_{prayerIndex}_{id}
 */
export const addOneScheduledReminderForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: { id: string; date: string; time: string }
) => {
  const key = `scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}`;
  storage.set(key, JSON.stringify(notification));
};

/**
 * Gets all scheduled reminder IDs for a specific prayer
 */
export const getAllScheduledRemindersForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number
): { id: string; date: string; time: string }[] => {
  const prefix = `scheduled_reminders_${scheduleType}_${prayerIndex}_`;
  const keys = storage.getAllKeys().filter((key) => key.startsWith(prefix));
  return keys.map((key) => JSON.parse(storage.getString(key) || '{}'));
};

/**
 * Clears all scheduled reminders for a specific prayer from database
 */
export const clearAllScheduledRemindersForPrayer = (scheduleType: ScheduleType, prayerIndex: number) => {
  const prefix = `scheduled_reminders_${scheduleType}_${prayerIndex}_`;
  const keys = storage.getAllKeys().filter((key) => key.startsWith(prefix));
  keys.forEach((key) => storage.delete(key));
};

/**
 * Clears all scheduled reminders for an entire schedule from database
 */
export const clearAllScheduledRemindersForSchedule = (scheduleType: ScheduleType) => {
  const prefix = `scheduled_reminders_${scheduleType}_`;
  const keys = storage.getAllKeys().filter((key) => key.startsWith(prefix));
  keys.forEach((key) => storage.delete(key));
};

// UPDATE cleanup() function - add these lines:
// clearPrefix('scheduled_reminders_'); // All reminder tracking
// clearPrefix('preference_reminder_'); // Reminder preferences
```

- **Acceptance Criteria:**
  - [ ] addOneScheduledReminderForPrayer function added
  - [ ] getAllScheduledRemindersForPrayer function added
  - [ ] clearAllScheduledRemindersForPrayer function added
  - [ ] clearAllScheduledRemindersForSchedule function added
  - [ ] cleanup() function updated with reminder prefixes
  - [ ] Key format: `scheduled_reminders_{scheduleType}_{prayerIndex}_{id}`

---

**Task 2.2: Add Reminder Content Generator to shared/notifications.ts**

- **File:** `shared/notifications.ts`
- **Change Type:** Modified
- **Description:** Add function to generate reminder notification content + Android channel
- **Complexity:** Small
- **Code:**

```typescript
import { AlertType } from '@/shared/types';

/**
 * Generates notification content for a pre-prayer reminder
 * @param englishName Prayer name in English (e.g., "Fajr")
 * @param arabicName Prayer name in Arabic (e.g., "الفجر")
 * @param intervalMinutes Minutes before prayer (e.g., 15)
 * @param alertType Alert type (Silent or Sound)
 * @returns Notification content input for Expo Notifications
 */
export const genReminderNotificationContent = (
  englishName: string,
  arabicName: string,
  intervalMinutes: number,
  alertType: AlertType
): Notifications.NotificationContentInput => {
  return {
    title: `${englishName} in ${intervalMinutes} min`,
    body: `\u200E${arabicName}`,
    sound: alertType === AlertType.Sound ? 'reminders.wav' : false,
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
    vibrationPattern: [0, 250, 250, 250],
  });
};
```

- **Acceptance Criteria:**
  - [ ] genReminderNotificationContent function added
  - [ ] createReminderAndroidChannel function added
  - [ ] Content format: "{Prayer} in {X} min" / arabicName
  - [ ] Sound: reminders.wav for Sound type, false for Silent
  - [ ] Channel ID: 'reminder'

---

**Task 2.3: Add Device Reminder Functions to device/notifications.ts**

- **File:** `device/notifications.ts`
- **Change Type:** Modified
- **Description:** Add functions to schedule and clear reminder notifications
- **Complexity:** Medium
- **Dependencies:** Task 2.2, Task 2.1
- **Code:**

```typescript
import { subMinutes } from 'date-fns';
import * as NotificationUtils from '@/shared/notifications';
import * as Database from '@/stores/database';

/**
 * Schedules a single reminder notification for a prayer
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
  // Parse prayer time and calculate trigger time
  const prayerDateTime = TimeUtils.createLondonDateWithTime(date, time);
  const triggerDateTime = subMinutes(prayerDateTime, intervalMinutes);

  // Generate content
  const content = NotificationUtils.genReminderNotificationContent(
    englishName,
    arabicName,
    intervalMinutes,
    reminderAlertType
  );

  // Schedule notification
  const id = await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDateTime,
      channelId: Platform.OS === 'android' ? 'reminder' : undefined,
    },
  });

  // Format trigger time for database
  const triggerTime = TimeUtils.formatTime(triggerDateTime);

  return { id, date, time: triggerTime };
};

/**
 * Clears all scheduled reminders for a specific prayer from device
 */
export const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const reminders = Database.getAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
  await Promise.all(reminders.map((r) => Notifications.cancelScheduledNotificationAsync(r.id)));
};
```

- **Acceptance Criteria:**
  - [ ] addOneScheduledReminderForPrayer schedules notification at (prayer time - interval)
  - [ ] clearAllScheduledRemindersForPrayer cancels all reminders for a prayer
  - [ ] Uses 'reminder' channel on Android
  - [ ] Returns notification metadata for database

---

**Task 2.4: Add Reminder Scheduling to stores/notifications.ts**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Add functions to schedule reminders for a prayer with scheduling lock
- **Complexity:** Medium
- **Dependencies:** Tasks 1.2, 2.1, 2.3
- **Code:**

```typescript
/**
 * Schedules a single reminder notification for a prayer on a specific date
 * Handles validation, Istijaba filtering, and database storage.
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
    if (!prayerData) return;

    const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

    // Calculate trigger time = prayer time - interval
    const prayerDateTime = TimeUtils.createLondonDateWithTime(date, prayerTime);
    const triggerDateTime = subMinutes(prayerDateTime, intervalMinutes);

    // Skip if trigger time is in past (with 30 second buffer)
    const now = new Date();
    const bufferMs = 30 * 1000;
    if (triggerDateTime.getTime() < now.getTime() + bufferMs) {
      logger.info('Skipping past reminder:', { date, time: prayerTime, englishName, intervalMinutes });
      return;
    }

    // Skip Istijaba on non-Fridays
    if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
      logger.info('Skipping Istijaba reminder on non-Friday:', { date });
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

    await Database.addOneScheduledReminderForPrayer(scheduleType, prayerIndex, notification);
  } catch (error) {
    logger.error('Failed to schedule reminder notification:', error);
  }
}

/**
 * Schedule multiple reminders (X days) for a single prayer
 * Uses scheduling lock to prevent concurrent operations.
 */
const _addMultipleScheduleRemindersForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  reminderAlertType: AlertType
) => {
  // Clear existing reminders
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

  logger.info('NOTIFICATION: Scheduled reminders:', { scheduleType, prayerIndex, englishName, interval });
};

/**
 * Schedule multiple reminders for a single prayer (public entry point)
 * Guards against concurrent scheduling using withSchedulingLock.
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

- **Acceptance Criteria:**
  - [ ] scheduleReminderNotificationForDate handles all edge cases (past time, Istijaba, errors)
  - [ ] 30-second buffer for "already passed" check
  - [ ] addMultipleScheduleRemindersForPrayer uses withSchedulingLock
  - [ ] clearAllScheduledRemindersForPrayer cleans up device + database
  - [ ] Error handling with logger.error

---

**Task 2.5: Add Constraint Enforcement to setPrayerAlertType**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** When at-time is turned off, auto-disable reminder (fire-and-forget)
- **Complexity:** Small
- **Dependencies:** Task 2.4
- **Code:**

```typescript
/**
 * Sets the alert type for a specific prayer
 * CONSTRAINT: When at-time is set to Off, reminder is also disabled
 */
export const setPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);

  // CONSTRAINT: When at-time is turned off, disable reminder
  if (alertType === AlertType.Off) {
    const reminderAtom = getReminderAlertAtom(scheduleType, prayerIndex);
    store.set(reminderAtom, AlertType.Off);

    // Fire-and-forget cleanup (errors logged but not thrown)
    clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex).catch((error) =>
      logger.error('Failed to clear reminders on at-time disable:', error)
    );
  }
};
```

- **Acceptance Criteria:**
  - [ ] Setting at-time to Off auto-sets reminder to Off
  - [ ] Setting at-time to Off clears scheduled reminders (fire-and-forget)
  - [ ] Errors are logged but don't block UI

---

**Task 2.6: Update \_rescheduleAllNotifications**

- **File:** `stores/notifications.ts`
- **Change Type:** Modified
- **Description:** Include reminder scheduling in full reschedule flow
- **Complexity:** Medium
- **Dependencies:** Task 2.4
- **Code:**

```typescript
/**
 * Schedule all reminders for a schedule based on current preferences (internal)
 */
const _addAllScheduleRemindersForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('NOTIFICATION: Scheduling all reminders for schedule:', { scheduleType });

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
  logger.info('NOTIFICATION: Scheduled all reminders for schedule:', { scheduleType });
};

const _rescheduleAllNotifications = async () => {
  // Cancel ALL scheduled notifications globally
  await Notifications.cancelAllScheduledNotificationsAsync();
  logger.info('NOTIFICATION: Cancelled all scheduled notifications via Expo API');

  // Clear database records for both schedules (at-time + reminders)
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Extra);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Extra);
  logger.info('NOTIFICATION: Cleared database records');

  // Schedule all enabled notifications + reminders for both schedules
  await Promise.all([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
    _addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    _addAllScheduleRemindersForSchedule(ScheduleType.Standard),
    _addAllScheduleRemindersForSchedule(ScheduleType.Extra),
  ]);

  logger.info('NOTIFICATION: Rescheduled all notifications and reminders');
};
```

- **Acceptance Criteria:**
  - [ ] \_addAllScheduleRemindersForSchedule function added
  - [ ] \_rescheduleAllNotifications clears reminder database records
  - [ ] \_rescheduleAllNotifications schedules reminders in parallel with at-time

---

### Phase 3: UI Components

**Task 3.1: Create BottomSheetAlertMenu.tsx**

- **File:** `components/BottomSheetAlertMenu.tsx`
- **Change Type:** **New**
- **Description:** Create the alert menu bottom sheet component
- **Complexity:** Large
- **Dependencies:** Tasks 1.2, 1.3, 2.4

**Structure:**

```
BottomSheetAlertMenu
├── Header: Bell icon + "{Prayer} Alert"
├── Section: "At prayer time"
│   ├── RadioOption: Off
│   ├── RadioOption: Silent
│   └── RadioOption: Sound (+ chevron to BottomSheetSound)
├── Section: "Pre-prayer reminder" (hidden when at-time = Off)
│   ├── RadioOption: Off (DEFAULT)
│   ├── RadioOption: Silent
│   └── RadioOption: Sound
└── Section: "Remind me" (hidden when reminder = Off)
    └── IntervalPicker: [5] [10] [15] [20] [25] [30] min
```

**Key Implementation Details:**

```typescript
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BellIcon from '@/assets/icons/svg/bell.svg';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import { useNotification } from '@/hooks/useNotification';
import { COLORS, TEXT, SPACING, SIZE, RADIUS, STYLES, HIT_SLOP } from '@/shared/constants';
import { AlertType, REMINDER_INTERVALS } from '@/shared/types';
import {
  getPrayerAlertType,
  setPrayerAlertType,
  getReminderAlertType,
  setReminderAlertType,
  getReminderInterval,
  setReminderInterval,
  addMultipleScheduleNotificationsForPrayer,
  addMultipleScheduleRemindersForPrayer,
  clearAllScheduledNotificationForPrayer,
  clearAllScheduledRemindersForPrayer,
} from '@/stores/notifications';
import { alertMenuContextAtom, setAlertMenuSheetModal, hideAlertMenuSheet, showSheet } from '@/stores/ui';

export default function BottomSheetAlertMenu() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

  const context = useAtomValue(alertMenuContextAtom);
  const { handleAlertChange, ensurePermissions } = useNotification();

  // Temp state for UI (committed on dismiss)
  const [tempAtTime, setTempAtTime] = useState<AlertType>(AlertType.Off);
  const [tempReminder, setTempReminder] = useState<AlertType>(AlertType.Off);
  const [tempInterval, setTempInterval] = useState<number>(15);

  // Load current values when context changes
  useEffect(() => {
    if (!context) return;
    setTempAtTime(getPrayerAlertType(context.scheduleType, context.prayerIndex));
    setTempReminder(getReminderAlertType(context.scheduleType, context.prayerIndex));
    setTempInterval(getReminderInterval(context.scheduleType, context.prayerIndex));
  }, [context]);

  // Handle at-time change (with constraint enforcement)
  const handleAtTimeChange = useCallback(
    async (alertType: AlertType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (alertType !== AlertType.Off) {
        const hasPermission = await ensurePermissions();
        if (!hasPermission) return;
      }

      setTempAtTime(alertType);

      // CONSTRAINT: When at-time is Off, reminder must also be Off
      if (alertType === AlertType.Off) {
        setTempReminder(AlertType.Off);
      }
    },
    [ensurePermissions]
  );

  // Handle reminder change
  const handleReminderChange = useCallback(
    async (alertType: AlertType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (alertType !== AlertType.Off) {
        const hasPermission = await ensurePermissions();
        if (!hasPermission) return;
      }

      setTempReminder(alertType);
    },
    [ensurePermissions]
  );

  // Handle interval change
  const handleIntervalChange = useCallback((interval: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempInterval(interval);
  }, []);

  // Handle sound selection (dismiss this sheet, open sound sheet)
  const handleSoundPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideAlertMenuSheet();
    setTimeout(() => showSheet(), 150);
  }, []);

  // Commit changes on dismiss
  const handleDismiss = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!context) return;

    const { scheduleType, prayerIndex, englishName, arabicName } = context;

    // Get current stored values
    const currentAtTime = getPrayerAlertType(scheduleType, prayerIndex);
    const currentReminder = getReminderAlertType(scheduleType, prayerIndex);
    const currentInterval = getReminderInterval(scheduleType, prayerIndex);

    // Update at-time if changed
    if (tempAtTime !== currentAtTime) {
      setPrayerAlertType(scheduleType, prayerIndex, tempAtTime);
      if (tempAtTime === AlertType.Off) {
        await clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
      } else {
        await addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, tempAtTime);
      }
    }

    // Update reminder if changed
    if (tempReminder !== currentReminder || tempInterval !== currentInterval) {
      setReminderAlertType(scheduleType, prayerIndex, tempReminder);
      setReminderInterval(scheduleType, prayerIndex, tempInterval as ReminderInterval);
      if (tempReminder === AlertType.Off) {
        await clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
      } else {
        await addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, tempReminder);
      }
    }
  }, [context, tempAtTime, tempReminder, tempInterval]);

  // ... rest of component (JSX for sections, radio options, interval picker)
  // See patterns from BottomSheetSettings.tsx and BottomSheetSound.tsx
}
```

**Patterns to follow:**

- Modal reference pattern from `BottomSheetSettings.tsx:ref={(ref) => setSettingsSheetModal(ref)}`
- Temp selection + commit on dismiss from `BottomSheetSound.tsx:handleDismiss`
- Shared background/backdrop from `BottomSheetShared.tsx`
- Sheet transition pattern from `BottomSheetSettings.tsx:handleAthanPress` (dismiss, setTimeout, show)

- **Acceptance Criteria:**
  - [ ] Header shows prayer name and bell icon
  - [ ] At-time section with 3 radio options (Off/Silent/Sound)
  - [ ] Sound option has chevron that dismisses sheet and opens BottomSheetSound
  - [ ] Reminder section hidden when at-time = Off
  - [ ] Interval section hidden when reminder = Off
  - [ ] Interval chips: [5] [10] [15] [20] [25] [30] min
  - [ ] Changes committed on sheet dismiss (not on each tap)
  - [ ] Haptic feedback on all interactions
  - [ ] Accessibility labels for screen readers

---

**Task 3.2: Modify Alert.tsx Press Handler**

- **File:** `components/Alert.tsx`
- **Change Type:** Modified
- **Description:** Change press handler to open bottom sheet instead of cycling
- **Complexity:** Small
- **Dependencies:** Task 3.1

**Before:**

```typescript
const handlePress = useCallback(async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
  const nextAlertType = ALERT_CONFIGS[nextIndex].type;
  // ... cycle through and schedule
}, [...]);
```

**After:**

```typescript
import { setAlertMenuContext, showAlertMenuSheet } from '@/stores/ui';

const handlePress = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Set context for alert menu
  setAlertMenuContext({
    scheduleType: type,
    prayerIndex: index,
    englishName: Prayer.english,
    arabicName: Prayer.arabic,
  });

  // Open the alert menu sheet
  showAlertMenuSheet();
}, [type, index, Prayer.english, Prayer.arabic]);
```

**Keep:** All animation logic (AnimScale, AnimFill, AnimOpacity, AnimBounce)
**Remove:** The cycling logic, popup state, notification scheduling from handlePress

- **Acceptance Criteria:**
  - [ ] Press opens bottom sheet (not cycle)
  - [ ] Context set correctly before opening
  - [ ] Animation logic preserved
  - [ ] Haptic feedback on press
  - [ ] Remove popup-related code (useAlertPopupState, popup JSX)

---

**Task 3.3: Add BottomSheetAlertMenu to \_layout.tsx**

- **File:** `app/_layout.tsx`
- **Change Type:** Modified
- **Description:** Add BottomSheetAlertMenu alongside existing bottom sheets
- **Complexity:** Small
- **Dependencies:** Task 3.1
- **Code:**

```typescript
import BottomSheetAlertMenu from '@/components/BottomSheetAlertMenu';

// In return JSX (alongside other bottom sheets):
<BottomSheetAlertMenu />
```

- **Acceptance Criteria:**
  - [ ] BottomSheetAlertMenu imported
  - [ ] Component added to layout after other bottom sheets

---

### Phase 4: Integration & Testing

**Task 4.1: Initialize Reminder Channel on App Start**

- **File:** `shared/notifications.ts` (in initializeNotifications function)
- **Change Type:** Modified
- **Description:** Call createReminderAndroidChannel during notification initialization
- **Complexity:** Small
- **Dependencies:** Task 2.2
- **Code:**

```typescript
// In initializeNotifications() function:
export const initializeNotifications = async () => {
  // ... existing channel creation
  await createDefaultAndroidChannel();
  await createReminderAndroidChannel(); // ADD THIS LINE
  // ... rest of function
};
```

- **Acceptance Criteria:**
  - [ ] createReminderAndroidChannel called in initializeNotifications
  - [ ] Android reminder channel created on app start

---

**Task 4.2: Add Unit Tests**

- **File:** `stores/__tests__/notifications.test.ts` (new or existing)
- **Change Type:** Modified/New
- **Description:** Add tests for reminder atoms and constraint enforcement
- **Complexity:** Medium

**Test Cases:**

```typescript
describe('Reminder Atoms', () => {
  it('should default reminder alert to Off', () => {
    const alertType = getReminderAlertType(ScheduleType.Standard, 0);
    expect(alertType).toBe(AlertType.Off);
  });

  it('should default reminder interval to 15', () => {
    const interval = getReminderInterval(ScheduleType.Standard, 0);
    expect(interval).toBe(15);
  });

  it('should persist reminder alert type', () => {
    setReminderAlertType(ScheduleType.Standard, 0, AlertType.Sound);
    const alertType = getReminderAlertType(ScheduleType.Standard, 0);
    expect(alertType).toBe(AlertType.Sound);
  });
});

describe('Constraint Enforcement', () => {
  it('should disable reminder when at-time is set to Off', () => {
    // Setup: enable reminder
    setReminderAlertType(ScheduleType.Standard, 0, AlertType.Sound);

    // Action: set at-time to Off
    setPrayerAlertType(ScheduleType.Standard, 0, AlertType.Off);

    // Assert: reminder should be Off
    const reminderType = getReminderAlertType(ScheduleType.Standard, 0);
    expect(reminderType).toBe(AlertType.Off);
  });

  it('should not affect reminder when at-time is set to Silent or Sound', () => {
    // Setup: enable reminder
    setReminderAlertType(ScheduleType.Standard, 0, AlertType.Sound);

    // Action: set at-time to Silent
    setPrayerAlertType(ScheduleType.Standard, 0, AlertType.Silent);

    // Assert: reminder should still be Sound
    const reminderType = getReminderAlertType(ScheduleType.Standard, 0);
    expect(reminderType).toBe(AlertType.Sound);
  });
});
```

- **Acceptance Criteria:**
  - [ ] Tests for reminder atom defaults
  - [ ] Tests for reminder atom persistence
  - [ ] Tests for constraint enforcement
  - [ ] All tests pass

---

**Task 4.3: Verification - yarn validate**

- **Action:** Run full validation
- **Command:** `yarn validate`
- **Acceptance Criteria:**
  - [ ] TypeScript compilation passes
  - [ ] ESLint passes
  - [ ] Prettier passes
  - [ ] All tests pass (including new ones)

---

**Task 4.4: Manual Testing Checklist**

**Happy Path Tests:**

- [ ] Open alert menu: Tap any prayer's alert icon -> sheet opens with correct prayer name
- [ ] At-time options work: Change Off/Silent/Sound -> notification scheduled correctly
- [ ] Sound selection: Tap Sound chevron -> BottomSheetSound opens -> sound persists
- [ ] Reminder section visible: When at-time = Silent or Sound -> reminder section shown
- [ ] Interval section visible: When reminder = Silent or Sound -> interval section shown
- [ ] Interval selection: Select different intervals -> value persists
- [ ] Reminder scheduling: Enable reminder -> notification fires X min before prayer
- [ ] Per-prayer independence: Each prayer has separate settings
- [ ] Persistence: Close app -> reopen -> all settings preserved

**Constraint Tests:**

- [ ] Reminder section hidden: When at-time = Off -> reminder section hidden
- [ ] Interval section hidden: When reminder = Off -> interval section hidden
- [ ] Auto-disable reminder: Set at-time to Off when reminder enabled -> reminder also Off

**Edge Case Tests:**

- [ ] Istijaba reminder on non-Friday: Should skip scheduling
- [ ] Reminder time already passed: Should skip scheduling for that day
- [ ] Rapid toggles: Quick changes don't cause race conditions
- [ ] Permission denied: Shows appropriate message

**Error Scenario Tests:**

- [ ] Network failure during scheduling: Errors logged, UI stable
- [ ] Storage failure: Errors logged, app doesn't crash

---

## File Modifications Summary

| File                                     | Change Type | Description                                                               |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `shared/types.ts`                        | Modified    | Add ReminderInterval, REMINDER_INTERVALS, DEFAULT_REMINDER_INTERVAL       |
| `stores/notifications.ts`                | Modified    | Add reminder atoms, scheduling functions, constraint enforcement          |
| `stores/ui.ts`                           | Modified    | Add alertMenuSheetModalAtom, alertMenuContextAtom, actions                |
| `stores/database.ts`                     | Modified    | Add reminder database functions, update cleanup()                         |
| `shared/notifications.ts`                | Modified    | Add genReminderNotificationContent, createReminderAndroidChannel          |
| `device/notifications.ts`                | Modified    | Add addOneScheduledReminderForPrayer, clearAllScheduledRemindersForPrayer |
| `components/BottomSheetAlertMenu.tsx`    | **New**     | Alert menu bottom sheet (main UI)                                         |
| `components/Alert.tsx`                   | Modified    | Change press handler to open sheet, remove popup code                     |
| `app/_layout.tsx`                        | Modified    | Add BottomSheetAlertMenu                                                  |
| `stores/__tests__/notifications.test.ts` | Modified    | Add reminder and constraint tests                                         |

---

## Risk Analysis

| Risk                              | Likelihood | Impact | Mitigation                                    |
| --------------------------------- | ---------- | ------ | --------------------------------------------- |
| iOS 64 notification limit         | Low        | High   | 2-day window = ~44 max (11x2x2)               |
| Bottom sheet z-index conflicts    | Low        | Medium | Dismiss alert menu before showing sound sheet |
| Reminder + at-time race condition | Low        | Medium | Use withSchedulingLock for all scheduling     |
| Memory leak from atoms            | Low        | Low    | Follow existing atom patterns exactly         |
| Audio file missing                | Low        | High   | Verify reminders.wav exists in assets         |

---

## Success Criteria

- [ ] Alert icon tap opens bottom sheet menu (not cycle)
- [ ] At-time Off/Silent/Sound all work correctly
- [ ] Reminder section hidden when at-time = Off
- [ ] Interval section hidden when reminder = Off
- [ ] Reminder notifications fire at correct time before prayer
- [ ] Per-prayer settings are independent
- [ ] Settings persist across app restarts
- [ ] yarn validate passes
- [ ] All unit tests pass

---

## Approval

- [x] Architect: Plan approved (88 -> 92 after revisions)
- [x] Implementer: Ready to build (88 -> 91 after revisions)
- [x] ReviewerQA: Security/quality concerns addressed (85 -> 91 after revisions)

**Aggregate Score: 91/100** (meets 90+ threshold)

---

## Revision Notes (v2)

Issues addressed from specialist reviews:

1. Added Device.clearAllScheduledRemindersForPrayer (Task 2.3) - Gap G1
2. Added genReminderNotificationContent (Task 2.2) - Gap G3
3. Fixed dependency: Task 2.4 now depends on Tasks 1.2, 2.1, 2.3 - Issue D1
4. Added withSchedulingLock to reminder operations (Task 2.4) - Issue P2
5. Fixed sync/async mismatch with fire-and-forget pattern (Task 2.5) - Issue E1
6. Added getAllScheduledRemindersForPrayer to database (Task 2.1)
7. Added cleanup() function updates (Task 2.1) - Issue D2
8. Clarified sheet stacking: dismiss alert menu before showing sound sheet (Task 3.1) - Issue A2
9. Added unit tests task (Task 4.2) - Issue T1, T2
10. Added 30-second buffer for trigger time check (Task 2.4) - Issue R3
11. Expanded BottomSheetAlertMenu code (Task 3.1) - Gap in Task 3.1
12. Added accessibility mention (Task 3.1) - Issue G4
13. Confirmed filename: reminders.wav (matches assets) - Issue P1
